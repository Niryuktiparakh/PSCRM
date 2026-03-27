"""
Infra Node AI Summary Service.

Summary is stored as a JSON requirements object — not plain text.
Shape stored in cluster_ai_summary (Text column, JSON-encoded string):

{
  "requirements": [
    {"issue": "Pothole repair needed on main stretch", "severity": "high", "count": 3},
    {"issue": "Drainage clearing required near junction", "severity": "medium", "count": 1}
  ],
  "overall_severity": "high",
  "themes": ["potholes", "drainage", "road damage"],
  "brief": "Citizens repeatedly report pothole damage and blocked drainage at this location."
}

Incremental strategy (always 1 Gemini call, never re-fetch complaints):
  - No existing summary  →  bootstrap: generate requirements from this complaint only
  - Summary exists       →  incremental: old requirements + new complaint → updated requirements

cluster_major_themes and cluster_severity are also written separately
so map queries (which don't parse JSON) still work.
"""

import json
import logging
from typing import Dict, List, Optional

import vertexai
from groq import Groq
from sqlalchemy import text
from sqlalchemy.orm import Session
from vertexai.generative_models import (
    GenerationConfig,
    GenerativeModel,
    HarmCategory,
    HarmBlockThreshold,
)

_SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HATE_SPEECH:       HarmBlockThreshold.BLOCK_ONLY_HIGH,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    HarmCategory.HARM_CATEGORY_HARASSMENT:        HarmBlockThreshold.BLOCK_ONLY_HIGH,
}

from config import settings

logger = logging.getLogger(__name__)
_vertex_initialized = False
_groq_client: Optional[Groq] = None


# ── Vertex init ───────────────────────────────────────────────────────────────

def _ensure_vertex():
    global _vertex_initialized
    if _vertex_initialized:
        return
    vertexai.init(
        project=settings.GCS_PROJECT_ID,
        location=settings.VERTEX_AI_LOCATION,
    )
    _vertex_initialized = True


def _call_gemini(prompt: str, max_tokens: int = 500) -> str:
    try:
        _ensure_vertex()
        model = GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=(
                "You are a civic infrastructure analyst. "
                "Output only valid JSON. No markdown fences, no explanation."
            ),
            generation_config=GenerationConfig(temperature=0.1, max_output_tokens=max_tokens),
        )
        return (model.generate_content(prompt, safety_settings=_SAFETY_SETTINGS).text or "").strip()
    except Exception as exc:
        logger.error("Gemini call failed in infra_node_service: %s", exc)
        return ""


def _get_groq_client() -> Optional[Groq]:
    global _groq_client
    if _groq_client is not None:
        return _groq_client

    api_key = getattr(settings, "GROQ_API_KEY", None)
    if not api_key:
        logger.warning("GROQ_API_KEY is not configured")
        return None

    try:
        _groq_client = Groq(api_key=api_key)
        return _groq_client
    except Exception as exc:
        logger.error("Failed to initialize Groq client in infra_node_service: %s", exc)
        return None


def _call_groq_summary(prompt: str, max_tokens: int = 700) -> str:
    client = _get_groq_client()
    if client is None:
        return ""

    try:
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a civic infrastructure analyst. "
                        "Return only valid JSON. No markdown, no extra text."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=max_tokens,
        )
        if not response.choices:
            return ""
        return (response.choices[0].message.content or "").strip()
    except Exception as exc:
        logger.error("Groq call failed in infra_node_service: %s", exc)
        return ""


def _parse_json(raw: str) -> Optional[dict]:
    if not raw:
        return None
    clean = raw.strip()
    if "```" in clean:
        parts = clean.split("```")
        clean = parts[1] if len(parts) > 1 else parts[0]
        if clean.lstrip().startswith("json"):
            clean = clean.lstrip()[4:]
    try:
        return json.loads(clean.strip())
    except json.JSONDecodeError as exc:
        logger.error("JSON parse failed: %s — raw: %.200s", exc, raw)
        return None


def _normalize_summary_payload(parsed: Optional[dict]) -> dict:
    if not isinstance(parsed, dict):
        parsed = {}

    allowed = {"low", "medium", "high", "critical"}

    def _norm_severity(value: Optional[str]) -> str:
        v = (value or "medium").strip().lower()
        return v if v in allowed else "medium"

    themes = parsed.get("themes") if isinstance(parsed.get("themes"), list) else []
    themes = [str(t).strip() for t in themes if str(t).strip()]

    brief = str(parsed.get("brief") or parsed.get("summary") or "").strip()

    problems = parsed.get("problems_reported")
    normalized_problems: List[dict] = []

    if isinstance(problems, list) and problems:
        for p in problems:
            if not isinstance(p, dict):
                continue
            issue_type = str(p.get("issue_type") or p.get("issue") or "General infrastructure issue").strip()
            severity = _norm_severity(str(p.get("severity") or "medium"))
            try:
                count = int(p.get("number_of_complaints") or p.get("count") or 1)
            except (TypeError, ValueError):
                count = 1
            summary = str(p.get("summary") or p.get("issue") or issue_type).strip()
            action = str(p.get("recommended_action") or "Inspect site and assign repair team").strip()
            normalized_problems.append(
                {
                    "issue_type": issue_type,
                    "severity": severity,
                    "number_of_complaints": max(1, count),
                    "summary": summary,
                    "recommended_action": action,
                }
            )

    if not normalized_problems:
        reqs = parsed.get("requirements") if isinstance(parsed.get("requirements"), list) else []
        for r in reqs:
            if not isinstance(r, dict):
                continue
            issue = str(r.get("issue") or "General infrastructure issue").strip()
            severity = _norm_severity(str(r.get("severity") or "medium"))
            try:
                count = int(r.get("count") or r.get("number_of_complaints") or 1)
            except (TypeError, ValueError):
                count = 1
            normalized_problems.append(
                {
                    "issue_type": issue,
                    "severity": severity,
                    "number_of_complaints": max(1, count),
                    "summary": issue,
                    "recommended_action": "Inspect site and assign repair team",
                }
            )

    if not normalized_problems:
        fallback_text = brief or "Infrastructure issue reported"
        normalized_problems.append(
            {
                "issue_type": "General",
                "severity": _norm_severity(parsed.get("overall_severity")),
                "number_of_complaints": 1,
                "summary": fallback_text,
                "recommended_action": "Inspect site and assign repair team",
            }
        )

    overall = _norm_severity(parsed.get("overall_severity"))
    if not parsed.get("overall_severity"):
        rank = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        overall = max(normalized_problems, key=lambda p: rank[p["severity"]])["severity"]

    requirements = [
        {
            "issue": p["summary"],
            "severity": p["severity"],
            "count": p["number_of_complaints"],
        }
        for p in normalized_problems
    ]

    total_count = sum(p["number_of_complaints"] for p in normalized_problems)
    if not brief:
        brief = f"{len(normalized_problems)} issue(s) reported with {total_count} complaint(s)."

    return {
        "problems_reported": normalized_problems,
        "overall_severity": overall,
        "themes": themes,
        "brief": brief,
        "summary": brief,
        "total_reported_complaints": total_count,
        # Backward-compatible fields used by existing frontend.
        "requirements": requirements,
    }


# ── DB write ──────────────────────────────────────────────────────────────────

def _write_requirements(db: Session, infra_node_id: str, parsed: dict) -> None:
    """
    Writes the requirements JSON to infra_nodes.
    cluster_ai_summary  → full JSON string (for API consumers)
    cluster_major_themes→ themes array (for map queries without JSON parsing)
    cluster_severity    → severity string (same reason)
    """
    normalized = _normalize_summary_payload(parsed)
    themes   = normalized.get("themes", [])
    severity = normalized.get("overall_severity", "medium")

    db.execute(
        text("""
            UPDATE infra_nodes
               SET cluster_ai_summary   = :summary_json,
                   cluster_major_themes = :themes,
                   cluster_severity     = :severity,
                   cluster_summary_at   = NOW(),
                   updated_at           = NOW()
             WHERE id = CAST(:nid AS uuid)
        """),
        {
            "nid":          infra_node_id,
            "summary_json": json.dumps(normalized, ensure_ascii=False),
            "themes":       themes,
            "severity":     severity,
        },
    )
    db.commit()
    logger.info(
        "Requirements saved for node=%s severity=%s themes=%s",
        infra_node_id, severity, themes,
    )


# ── Bootstrap ─────────────────────────────────────────────────────────────────

_BOOTSTRAP_PROMPT = """\
A civic infrastructure complaint has just been filed at a location.

Complaint:
{complaint_text}

Extract the operational infra issues from this complaint.

Respond with only valid JSON:
{{
    "problems_reported": [
        {{
            "issue_type": "pothole|drainage|streetlight|water|sewer|garbage|tree|electric_pole|other",
            "severity": "low|medium|high|critical",
            "number_of_complaints": 1,
            "summary": "clear operational summary of the issue",
            "recommended_action": "specific action for field team"
        }}
  ],
  "overall_severity": "low|medium|high|critical",
  "themes": ["theme1", "theme2"],
    "brief": "1-2 sentence summary of the situation at this location",
    "summary": "same as brief"
}}"""


def _bootstrap(db: Session, infra_node_id: str, complaint_text: str) -> Dict:
    raw    = _call_groq_summary(_BOOTSTRAP_PROMPT.format(complaint_text=complaint_text), max_tokens=700)
    parsed = _parse_json(raw) if raw else None

    if not parsed:
        logger.warning("Bootstrap failed for node=%s", infra_node_id)
        return {"status": "ai_failed"}

    _write_requirements(db, infra_node_id, parsed)
    return {"status": "success", "mode": "bootstrap", **parsed}


# ── Incremental ───────────────────────────────────────────────────────────────

_INCREMENTAL_PROMPT = """\
You maintain a running requirements list for a civic infrastructure location.

Current requirements:
{existing_json}

New complaint just filed:
{complaint_text}

Update the problems_reported list:
- If the new complaint describes the same issue type as an existing item, increment number_of_complaints.
- If it describes a new issue type, add a new item.
- Update overall_severity if this complaint changes the urgency.
- Keep brief to 1-2 sentences reflecting the full situation.

Respond with only valid JSON (same structure as input):
{{
    "problems_reported": [
        {{
            "issue_type": "...",
            "severity": "low|medium|high|critical",
            "number_of_complaints": <number>,
            "summary": "...",
            "recommended_action": "..."
        }}
  ],
  "overall_severity": "low|medium|high|critical",
  "themes": ["theme1", "theme2", "theme3"],
    "brief": "updated 1-2 sentence summary",
    "summary": "same as brief"
}}"""


def _incremental(
    db: Session,
    infra_node_id: str,
    existing_json: str,
    complaint_text: str,
) -> Dict:
    existing_parsed = _parse_json(existing_json) if existing_json else None
    normalized_existing = _normalize_summary_payload(existing_parsed)
    prompt = _INCREMENTAL_PROMPT.format(
        existing_json=json.dumps(normalized_existing, ensure_ascii=False, separators=(",", ":")),
        complaint_text=complaint_text,
    )
    raw    = _call_groq_summary(prompt, max_tokens=800)
    parsed = _parse_json(raw) if raw else None

    if not parsed:
        # Soft failure — keep existing, don't block ingest
        logger.warning(
            "Incremental update failed for node=%s, keeping existing requirements",
            infra_node_id,
        )
        return {"status": "ai_failed", "kept_existing": True}

    _write_requirements(db, infra_node_id, parsed)
    return {"status": "success", "mode": "incremental", **parsed}


# ── Public entry point ────────────────────────────────────────────────────────

def update_infra_node_summary(
    db: Session,
    infra_node_id: str,
    *,
    new_complaint_text: str,
) -> Dict:
    """
    Called after every complaint ingest.

    - No existing summary  →  bootstrap from this complaint alone
    - Summary exists       →  incremental (old requirements + new complaint)

    Never re-fetches all complaints. Always exactly 1 Gemini call.

    Args:
        db:                  SQLAlchemy session.
        infra_node_id:       UUID string.
        new_complaint_text:  "title: translated_description[:300]"  (from complaint_service)
    """
    row = db.execute(
        text("""
            SELECT cluster_ai_summary
            FROM infra_nodes
            WHERE id = CAST(:nid AS uuid) AND is_deleted = FALSE
        """),
        {"nid": infra_node_id},
    ).mappings().first()

    if not row:
        return {"status": "node_not_found"}

    existing = row["cluster_ai_summary"]

    if not existing:
        return _bootstrap(db, infra_node_id, new_complaint_text)
    else:
        return _incremental(db, infra_node_id, existing, new_complaint_text)


# ── Helper: parse stored requirements for API responses ──────────────────────

def parse_requirements(cluster_ai_summary: Optional[str]) -> Optional[dict]:
    """
    Safely parses the stored JSON requirements string.
    Returns the dict or None if empty / not yet generated.
    Use this in any API endpoint that returns node details.
    """
    if not cluster_ai_summary:
        return None
    try:
        return _normalize_summary_payload(json.loads(cluster_ai_summary))
    except (json.JSONDecodeError, TypeError):
        # Legacy plain-text summary — wrap it so frontend doesn't break
        return _normalize_summary_payload(
            {
                "brief": cluster_ai_summary,
                "overall_severity": "medium",
                "requirements": [{"issue": cluster_ai_summary, "severity": "medium", "count": 1}],
            }
        )


# ── Admin: forced full rebuild from last 20 complaints ───────────────────────

def rebuild_summary_from_complaints(db: Session, infra_node_id: str) -> Dict:
    """
    Admin-only: forces full requirements rebuild from last 20 complaints.
    NOT called during normal ingest. Use only for data repair.
    Exposed via POST /admin/infra-nodes/{node_id}/rebuild-summary
    """
    complaints = db.execute(
        text("""
            SELECT title, translated_description, priority
            FROM complaints
            WHERE infra_node_id = CAST(:nid AS uuid) AND is_deleted = FALSE
            ORDER BY created_at DESC LIMIT 20
        """),
        {"nid": infra_node_id},
    ).mappings().all()

    if not complaints:
        return {"status": "no_complaints"}

    complaint_block = "\n".join(
        f"- [{c['priority']}] {c['title']}: {(c['translated_description'] or '')[:150]}"
        for c in complaints
    )

    prompt = f"""Extract operational infrastructure problems from these complaints at a single infrastructure location:

{complaint_block}

Respond with only valid JSON:
{{
    "problems_reported": [
        {{
            "issue_type": "pothole|drainage|streetlight|water|sewer|garbage|tree|electric_pole|other",
            "severity": "low|medium|high|critical",
            "number_of_complaints": <how many complaints mention this>,
            "summary": "operational summary of the issue",
            "recommended_action": "specific action for field team"
        }}
  ],
  "overall_severity": "low|medium|high|critical",
  "themes": ["theme1", "theme2", "theme3"],
    "brief": "1-2 sentence summary of all issues at this location",
    "summary": "same as brief"
}}"""

    raw    = _call_groq_summary(prompt, max_tokens=900)
    parsed = _parse_json(raw) if raw else None

    if not parsed:
        return {"status": "ai_failed"}

    _write_requirements(db, infra_node_id, parsed)
    return {"status": "success", "mode": "full_rebuild", **parsed}