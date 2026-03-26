"""
Infra Node AI Summary Service.
Populates cluster_ai_summary, cluster_major_themes, cluster_severity.
"""
import json
import logging
from typing import Dict

from sqlalchemy import text
from sqlalchemy.orm import Session

from services.crm_agent_service import _call_gemini

logger = logging.getLogger(__name__)


def update_infra_node_summary(db: Session, infra_node_id: str) -> Dict:
    """
    Generate and store AI summary for an infra node based on its complaints.
    Called after complaint ingestion or workflow completion.
    """
    complaints = db.execute(
        text("""
            SELECT c.title, c.translated_description, c.priority, c.status, c.created_at
            FROM complaints c
            WHERE c.infra_node_id = CAST(:nid AS uuid)
              AND c.is_deleted = FALSE
            ORDER BY c.created_at DESC
            LIMIT 15
        """),
        {"nid": infra_node_id},
    ).mappings().all()

    if not complaints:
        return {"status": "no_complaints"}

    complaint_list = "\n".join([
        f"- [{c['priority']}] {c['title']}: {(c['translated_description'] or '')[:150]}..."
        for c in complaints
    ])

    prompt = f"""Analyze these civic complaints at a single infrastructure location:

COMPLAINTS:
{complaint_list}

Provide a JSON response:
{{
  "summary": "2-3 sentence summary of the issues at this location",
  "themes": ["theme1", "theme2", "theme3"],
  "severity": "low|medium|high|critical"
}}

Only output valid JSON, no markdown."""

    try:
        raw = _call_gemini(
            system="You are a civic infrastructure analyst. Output only valid JSON.",
            prompt=prompt,
            max_tokens=512,
        )

        if not raw:
            return {"status": "ai_failed", "reason": "empty_response"}

        clean = raw.strip()
        if "```" in clean:
            parts = clean.split("```")
            clean = parts[1] if len(parts) > 1 else parts[0]
            if clean.lstrip().startswith("json"):
                clean = clean.lstrip()[4:]

        parsed = json.loads(clean.strip())

        db.execute(
            text("""
                UPDATE infra_nodes
                SET cluster_ai_summary = :summary,
                    cluster_major_themes = :themes,
                    cluster_severity = :severity,
                    updated_at = NOW()
                WHERE id = CAST(:nid AS uuid)
            """),
            {
                "nid": infra_node_id,
                "summary": parsed.get("summary", ""),
                "themes": parsed.get("themes", []),
                "severity": parsed.get("severity", "medium"),
            },
        )
        db.commit()

        logger.info(
            "Updated infra node %s summary: severity=%s themes=%s",
            infra_node_id,
            parsed.get("severity"),
            parsed.get("themes"),
        )

        return {"status": "success", **parsed}

    except json.JSONDecodeError as exc:
        logger.error("Failed to parse AI response for node %s: %s", infra_node_id, exc)
        return {"status": "parse_failed", "raw": raw[:200]}
    except Exception as exc:
        logger.error("Failed to update infra node summary %s: %s", infra_node_id, exc)
        return {"status": "error", "error": str(exc)}


def update_all_node_summaries(db: Session, city_id: str, limit: int = 50) -> Dict:
    """
    Batch update AI summaries for nodes that need refresh.
    Run as a scheduled job.
    """
    nodes = db.execute(
        text("""
            SELECT n.id
            FROM infra_nodes n
            WHERE n.city_id = CAST(:city AS uuid)
              AND n.is_deleted = FALSE
              AND (
                n.cluster_ai_summary IS NULL
                OR n.updated_at < NOW() - INTERVAL '7 days'
              )
            ORDER BY n.total_complaint_count DESC
            LIMIT :limit
        """),
        {"city": city_id, "limit": limit},
    ).mappings().all()

    results = {"updated": 0, "failed": 0}

    for node in nodes:
        result = update_infra_node_summary(db, str(node["id"]))
        if result.get("status") == "success":
            results["updated"] += 1
        else:
            results["failed"] += 1

    return results
