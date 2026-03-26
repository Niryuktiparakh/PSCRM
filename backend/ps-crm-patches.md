# PS-CRM Critical Bug Fixes
## Ready to Apply Patches

---

## PATCH 1: Fix `approve_workflow` TypeError
**File:** `backend/routes/admin_router.py` (around line 737)

Find this code block:
```python
result = create_workflow_from_approval(
    db,
    complaint_id=str(complaint_id),
    template_id=body.template_id,
    version_id=body.version_id,  # ← REMOVE THIS LINE
    official_id=str(current_user.user_id),
    infra_node_id=...,
    jurisdiction_id=...,
    edited_steps=body.edited_steps,
    edit_reason=body.edit_reason,
)
```

Replace with:
```python
result = create_workflow_from_approval(
    db,
    complaint_id=str(complaint_id),
    template_id=body.template_id,
    # version_id is resolved internally by _get_latest_version()
    official_id=str(current_user.user_id),
    infra_node_id=str(complaint["infra_node_id"]) if complaint.get("infra_node_id") else None,
    jurisdiction_id=str(complaint["jurisdiction_id"]) if complaint.get("jurisdiction_id") else None,
    edited_steps=body.edited_steps,
    edit_reason=body.edit_reason,
)
```

---

## PATCH 2: Fix SQL Column Reference in `get_infra_node_ai_summary`
**File:** `backend/routes/admin_router.py` (around line 1252)

Find this query:
```python
node = db.execute(
    text("""
        SELECT n.id, n.status, n.total_complaint_count, n.total_resolved_count,
               n.last_resolved_at, n.repeat_alert_years,
               it.name AS infra_type_name, it.code AS infra_type_code,
               j.name AS jurisdiction_name
        FROM infra_nodes n
        JOIN infra_types it ON it.id = n.infra_type_id
        LEFT JOIN jurisdictions j ON j.id = n.jurisdiction_id
        WHERE n.id = CAST(%(nid)s AS uuid) AND n.is_deleted = FALSE
    """),
    {"nid": node_id},
).mappings().first()
```

Replace with:
```python
node = db.execute(
    text("""
        SELECT n.id, n.status, n.total_complaint_count, n.total_resolved_count,
               n.last_resolved_at, 
               it.repeat_alert_years,  -- ✅ Fixed: column is on infra_types, not infra_nodes
               it.name AS infra_type_name, it.code AS infra_type_code,
               it.cluster_radius_meters,
               j.name AS jurisdiction_name,
               n.cluster_ai_summary, n.cluster_major_themes, n.cluster_severity
        FROM infra_nodes n
        JOIN infra_types it ON it.id = n.infra_type_id
        LEFT JOIN jurisdictions j ON j.id = n.jurisdiction_id
        WHERE n.id = CAST(:nid AS uuid) AND n.is_deleted = FALSE
    """),
    {"nid": node_id},
).mappings().first()
```

---

## PATCH 3: Fix Gemini MAX_TOKENS Error
**File:** `backend/services/crm_agent_service.py`

### Change 1: Increase max_output_tokens (line ~44)
Find:
```python
def _call_gemini(system: str, prompt: str, max_tokens: int = 3048, temperature: float = 0.2) -> str:
    _ensure_vertex()
    model = GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=system,
        generation_config=GenerationConfig(temperature=temperature, max_output_tokens=max_tokens),
    )
    return (model.generate_content(prompt).text or "").strip()
```

Replace with:
```python
def _call_gemini(system: str, prompt: str, max_tokens: int = 4096, temperature: float = 0.2) -> str:
    """
    Call Gemini with proper error handling for blocked/empty responses.
    """
    _ensure_vertex()
    model = GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=system,
        generation_config=GenerationConfig(
            temperature=temperature, 
            max_output_tokens=max_tokens,
        ),
    )
    try:
        response = model.generate_content(prompt)
        
        # Check for blocked or empty response
        if not response.candidates:
            logger.warning("Gemini returned no candidates - response may be blocked")
            return ""
        
        candidate = response.candidates[0]
        if not candidate.content or not candidate.content.parts:
            finish_reason = getattr(candidate, 'finish_reason', 'UNKNOWN')
            logger.warning(
                "Gemini returned empty content. finish_reason=%s",
                finish_reason
            )
            return ""
        
        return (response.text or "").strip()
        
    except Exception as exc:
        logger.error("Gemini call failed: %s", exc)
        return ""
```

### Change 2: Add fallback in generate_morning_briefing (around line 200+)

Find the briefing function and add fallback:
```python
def generate_morning_briefing(db: Session, user_id: str, role: str) -> Dict:
    """Generate AI briefing for officials."""
    scope = _get_scope(db, user_id, role)
    if not scope:
        return {"briefing": "Unable to load your data scope."}
    
    kpi = _load_kpi(db, scope)
    
    # Build prompt...
    prompt = f"""..."""
    
    try:
        raw = _call_gemini(BRIEFING_SYSTEM_PROMPT, prompt, max_tokens=4096)
        
        # Handle empty response gracefully
        if not raw:
            return {
                "briefing": _generate_fallback_briefing(kpi, scope),
                "source": "fallback",
            }
        
        return {"briefing": raw, "source": "gemini"}
        
    except Exception as exc:
        logger.error("Briefing Gemini failed: %s", exc)
        return {
            "briefing": _generate_fallback_briefing(kpi, scope),
            "source": "fallback",
        }


def _generate_fallback_briefing(kpi: Dict, scope: Dict) -> str:
    """Generate a simple text briefing when Gemini fails."""
    complaints = kpi.get("complaints", {})
    tasks = kpi.get("tasks", {})
    
    lines = [
        f"Good morning, {scope.get('full_name', 'Official')}!",
        "",
        f"📊 **Current Status:**",
        f"- Open complaints: {complaints.get('open_total', 0)}",
        f"- Critical/Emergency: {complaints.get('critical_open', 0)}",
        f"- Needs workflow: {complaints.get('needs_workflow', 0)}",
        f"- Resolved today: {complaints.get('resolved_total', 0)}",
        "",
        f"📋 **Tasks:**",
        f"- Pending: {tasks.get('pending', 0)}",
        f"- Active: {tasks.get('active', 0)}",
        f"- Overdue: {tasks.get('overdue', 0)}",
        "",
        "Focus on critical items and overdue tasks today.",
    ]
    return "\n".join(lines)
```

---

## PATCH 4: Add Background Tasks for Faster Complaint Ingestion
**File:** `backend/routes/complaint_router.py`

Modify the complaint submission endpoint:
```python
from fastapi import BackgroundTasks

@router.post("/complaints", response_model=ComplaintIngestResponse)
def submit_complaint(
    request: ComplaintIngestRequest,
    background_tasks: BackgroundTasks,  # Add this parameter
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(verify_token),
):
    """
    Ingest complaint with fast path + background AI processing.
    """
    # Validate user
    request.citizen_id = current_user.user_id
    
    # Fast path: Insert immediately, queue AI
    response = ingest_complaint_fast(
        db,
        request,
        background_tasks,
    )
    
    return response
```

**File:** `backend/services/complaint_service.py` - Add async processing:
```python
def _process_embeddings_background(complaint_id: str, text: str, image_path: Optional[str]):
    """Background task to generate and store embeddings."""
    from db import SessionLocal
    db = SessionLocal()
    try:
        embeddings = create_complaint_embeddings(text, image_path)
        
        db.execute(
            text("""
                UPDATE complaint_embeddings
                SET text_embedding = CAST(:te AS vector(768)),
                    image_embedding = CAST(:ie AS vector(768)),
                    updated_at = NOW()
                WHERE complaint_id = CAST(:cid AS uuid)
            """),
            {
                "cid": complaint_id,
                "te": _vector_literal(embeddings["text_embedding"]),
                "ie": _vector_literal(embeddings["image_embedding"]),
            },
        )
        db.commit()
        logger.info("Background embeddings completed for %s", complaint_id)
    except Exception as exc:
        logger.error("Background embedding failed for %s: %s", complaint_id, exc)
    finally:
        db.close()


def _process_mapping_background(
    complaint_id: str, 
    city_id: str,
    title: str, 
    description: str,
    infra_type_id: str,
    infra_type_code: str,
    infra_type_name: str,
    infra_node_id: str,
    jurisdiction_name: Optional[str],
    lat: float,
    lng: float,
    address: Optional[str],
):
    """Background task to run department mapping."""
    from db import SessionLocal
    db = SessionLocal()
    try:
        map_complaint_to_departments(
            db,
            complaint_id=complaint_id,
            city_id=city_id,
            title=title,
            description=description,
            infra_type_id=infra_type_id,
            infra_type_code=infra_type_code,
            infra_type_name=infra_type_name,
            infra_node_id=infra_node_id,
            jurisdiction_name=jurisdiction_name,
            lat=lat,
            lng=lng,
            road_name=address,
        )
        
        # Update complaint status to 'mapped'
        db.execute(
            text("""
                UPDATE complaints
                SET status = 'mapped', updated_at = NOW()
                WHERE id = CAST(:cid AS uuid) AND status = 'received'
            """),
            {"cid": complaint_id},
        )
        db.commit()
        logger.info("Background mapping completed for %s", complaint_id)
    except Exception as exc:
        logger.error("Background mapping failed for %s: %s", complaint_id, exc)
    finally:
        db.close()
```

---

## PATCH 5: Add Infra Node AI Summary Service
**File:** `backend/services/infra_node_service.py` (NEW FILE)

```python
"""
Infra Node AI Summary Service.
Populates cluster_ai_summary, cluster_major_themes, cluster_severity.
"""
import json
import logging
from typing import Dict, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from services.crm_agent_service import _call_gemini

logger = logging.getLogger(__name__)


def update_infra_node_summary(db: Session, infra_node_id: str) -> Dict:
    """
    Generate and store AI summary for an infra node based on its complaints.
    Called after complaint ingestion or workflow completion.
    """
    # Fetch recent complaints for this node
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
    
    # Build complaint text for AI
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
  "themes": ["theme1", "theme2", "theme3"],  // max 5 themes
  "severity": "low|medium|high|critical"  // based on complaint priorities and volume
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
        
        # Parse JSON
        clean = raw.strip()
        if "```" in clean:
            parts = clean.split("```")
            clean = parts[1] if len(parts) > 1 else parts[0]
            if clean.lstrip().startswith("json"):
                clean = clean.lstrip()[4:]
        
        parsed = json.loads(clean.strip())
        
        # Update infra_node
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
```

Wire it into complaint_service.py:
```python
# At the end of ingest_complaint(), after db.commit():
from services.infra_node_service import update_infra_node_summary

# Queue node summary update (can also be background task)
try:
    update_infra_node_summary(db, infra_node_id)
except Exception as exc:
    logger.warning("Node summary update failed (non-critical): %s", exc)
```

---

## Quick Verification Checklist

After applying patches, verify:

```bash
# 1. Test workflow approval
curl -X POST http://localhost:8000/admin/complaints/{id}/workflow-approve \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"template_id": "..."}'

# 2. Test infra node AI summary endpoint
curl http://localhost:8000/admin/infra-nodes/{id}/ai-summary \
  -H "Authorization: Bearer {token}"

# 3. Check Gemini briefing
curl http://localhost:8000/admin/crm/briefing \
  -H "Authorization: Bearer {token}"
```

All should return 200 without errors in the console.
