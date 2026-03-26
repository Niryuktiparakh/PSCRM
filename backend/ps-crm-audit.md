# PS-CRM Comprehensive Audit Report
## Date: 2026-03-26

---

## 🔴 CRITICAL BUGS (From Error Logs)

### 1. `approve_workflow` - TypeError (admin_router.py:737)
```
TypeError: create_workflow_from_approval() got an unexpected keyword argument 'version_id'
```

**Root Cause:** The `admin_router.py` is calling `create_workflow_from_approval()` with a `version_id` parameter, but the function signature in `workflow_agent_service.py` doesn't accept this parameter.

**Fix Required in `admin_router.py` (around line 737):**
```python
# BEFORE (incorrect):
result = create_workflow_from_approval(
    db,
    complaint_id=complaint_id,
    template_id=body.template_id,
    version_id=body.version_id,  # ❌ This parameter doesn't exist
    ...
)

# AFTER (correct):
result = create_workflow_from_approval(
    db,
    complaint_id=complaint_id,
    template_id=body.template_id,
    # Remove version_id - function resolves it internally via _get_latest_version()
    ...
)
```

---

### 2. `get_infra_node_ai_summary` - SQL Column Error (admin_router.py:1252)
```
sqlalchemy.exc.ProgrammingError: column n.repeat_alert_years does not exist
HINT: Perhaps you meant to reference the column "it.repeat_alert_years"
```

**Root Cause:** Query references `n.repeat_alert_years` but `repeat_alert_years` is on `infra_types` table, not `infra_nodes`.

**Fix Required in `admin_router.py` (around line 1252):**
```sql
-- BEFORE (incorrect):
SELECT n.id, n.status, n.total_complaint_count, n.total_resolved_count,
       n.last_resolved_at, n.repeat_alert_years,  -- ❌ Wrong table
       it.name AS infra_type_name, ...

-- AFTER (correct):
SELECT n.id, n.status, n.total_complaint_count, n.total_resolved_count,
       n.last_resolved_at, it.repeat_alert_years,  -- ✅ Correct table
       it.name AS infra_type_name, ...
```

---

### 3. Gemini Briefing - MAX_TOKENS Error (crm_agent_service.py)
```
finish_reason: "MAX_TOKENS"
Response candidate content has no parts (and thus no text).
```

**Root Cause:** The `max_output_tokens` is set to `3060` but with `thinking_token_count: 297`, the model is hitting the limit before generating output text.

**Fix Required in `crm_agent_service.py`:**
```python
# BEFORE:
generation_config=GenerationConfig(temperature=0.2, max_output_tokens=3048)

# AFTER (increase limit):
generation_config=GenerationConfig(temperature=0.2, max_output_tokens=4096)
```

**Also add fallback handling:**
```python
def _call_gemini(system: str, prompt: str, max_tokens: int = 4096, temperature: float = 0.2) -> str:
    _ensure_vertex()
    model = GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=system,
        generation_config=GenerationConfig(temperature=temperature, max_output_tokens=max_tokens),
    )
    try:
        response = model.generate_content(prompt)
        # Check for blocked/empty response
        if not response.candidates or not response.candidates[0].content.parts:
            logger.warning("Gemini returned empty response - may be blocked or token-limited")
            return ""
        return (response.text or "").strip()
    except Exception as exc:
        logger.error("Gemini call failed: %s", exc)
        return ""
```

---

## 🟡 DATABASE COLUMN ALIGNMENT ISSUES

### Columns Being Filled Correctly ✅

| Table | Column | Service | Status |
|-------|--------|---------|--------|
| `complaints` | `citizen_id` | complaint_service.py | ✅ via fn_ingest_complaint |
| `complaints` | `city_id` | complaint_service.py | ✅ via fn_ingest_complaint |
| `complaints` | `jurisdiction_id` | complaint_service.py | ✅ via fn_resolve_jurisdiction |
| `complaints` | `infra_node_id` | complaint_service.py | ✅ via fn_find_infra_node_for_cluster |
| `complaints` | `workflow_instance_id` | workflow_agent_service.py | ✅ Updated after workflow creation |
| `complaints` | `translated_description` | complaint_service.py | ✅ via _translate_to_english |
| `complaints` | `images` | complaint_service.py | ✅ JSON array of URLs |
| `complaints` | `is_repeat_complaint` | complaint_service.py | ✅ via fn_check_repeat_complaint |
| `complaints` | `agent_suggested_dept_ids` | mapping_service.py | ✅ via UPDATE after Groq mapping |
| `complaint_embeddings` | `text_embedding` | complaint_service.py | ✅ via embedding_service |
| `complaint_embeddings` | `image_embedding` | complaint_service.py | ✅ via embedding_service (nullable) |
| `infra_nodes` | `cluster_ai_summary` | ❓ | ⚠️ Not being populated (see below) |
| `infra_nodes` | `cluster_major_themes` | ❓ | ⚠️ Not being populated |
| `infra_nodes` | `cluster_severity` | ❓ | ⚠️ Not being populated |
| `workflow_instances` | All columns | workflow_agent_service.py | ✅ |
| `workflow_step_instances` | All columns | workflow_agent_service.py | ✅ |
| `tasks` | All columns | workflow_agent_service.py | ✅ |
| `notification_logs` | All columns | notification_service.py | ✅ |
| `pubsub_event_log` | All columns | pubsub_service.py | ✅ |
| `domain_events` | All columns | complaint_service.py + mapping_service.py | ✅ |
| `agent_logs` | All columns | mapping_service.py | ✅ |

### Missing Column Population ⚠️

**1. `infra_nodes.cluster_ai_summary` / `cluster_major_themes` / `cluster_severity`**

These columns exist in the schema but no service populates them. You need a background job or triggered function.

**Recommended Fix - Add to `workflow_agent_service.py` or create new `infra_node_service.py`:**
```python
def update_infra_node_ai_summary(db: Session, infra_node_id: str) -> None:
    """
    Summarizes all complaints attached to an infra node using Gemini.
    Called after complaint ingestion or workflow completion.
    """
    complaints = db.execute(
        text("""
            SELECT c.title, c.translated_description, c.priority, c.status
            FROM complaints c
            WHERE c.infra_node_id = CAST(:nid AS uuid)
              AND c.is_deleted = FALSE
            ORDER BY c.created_at DESC
            LIMIT 20
        """),
        {"nid": infra_node_id},
    ).mappings().all()
    
    if not complaints:
        return
    
    complaint_text = "\n".join([
        f"- {c['title']}: {c['translated_description'][:200]}..."
        for c in complaints
    ])
    
    prompt = f"""
    Summarize these civic complaints at a single infrastructure location:
    
    {complaint_text}
    
    Return JSON: {{"summary": "...", "themes": ["theme1", "theme2"], "severity": "low|medium|high|critical"}}
    """
    
    raw = _call_gemini_json(prompt)
    try:
        parsed = json.loads(raw)
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
    except Exception as exc:
        logger.error("Failed to update infra node AI summary: %s", exc)
```

---

## 🔔 PUB/SUB & NOTIFICATION FLOW VERIFICATION

### Current Flow (PUBSUB_ENABLED=False - Local Mode)

```
Complaint Filed
    └── complaint_service.ingest_complaint()
        └── publish_complaint_received()
            └── publish_event(event_type="COMPLAINT_RECEIVED")
                └── _handle_fallback() [PUBSUB disabled]
                    └── dispatch_notification() [FCM + Email]
                        └── _write_notif_log()
```

### Issues Found:

**1. Survey Auto-Trigger Not Wired**

The `MIDWAY_SURVEY` and `COMPLAINT_RESOLVED` events are defined but need to be triggered:

```python
# Add to workflow_agent_service.py after step completion:
def complete_workflow_step(db, step_instance_id, ...):
    # ... existing logic ...
    
    # Check if midway (50% complete)
    step_instance = ...
    workflow = ...
    if step_instance.step_number == workflow.total_steps // 2:
        publish_event(
            db,
            event_type="MIDWAY_SURVEY",
            payload={"workflow_instance_id": str(workflow.id)},
            complaint_id=complaint_id,
            user_id=citizen_id,
            fallback_survey_type="midway",
            fallback_workflow_instance_id=str(workflow.id),
        )
```

**2. `notify_area_citizens` Not Called**

The function exists in `notification_service.py` but is never invoked. Should be called when:
- Emergency complaint filed
- Workflow started in area
- Major infrastructure work begins

```python
# Add to pubsub_service.py publish_complaint_received():
if is_repeat or priority in ('critical', 'emergency'):
    from services.notification_service import notify_area_citizens
    notify_area_citizens(
        db,
        jurisdiction_id=jurisdiction_id,
        event_type="REPEAT_COMPLAINT_ALERT" if is_repeat else "EMERGENCY",
        variables={"number": complaint_number, "title": title},
        data={"complaint_id": complaint_id},
    )
```

---

## 🎨 UI/UX AUDIT - GLASSMORPHISM & MODERN DESIGN

### Current State Analysis:

**Good Elements ✅:**
- Material Symbols icons used consistently
- Tailwind CSS utility classes
- Sonner toast notifications
- Mapbox 3D buildings and smooth animations
- Card-based layouts

**Missing Glassmorphism Elements ⚠️:**

### Recommended CSS Additions (`styles.css`):
```css
/* Glassmorphism utilities */
.glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.glass-dark {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-primary {
  background: rgba(99, 102, 241, 0.08);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(99, 102, 241, 0.15);
}

/* Gradient mesh backgrounds */
.mesh-gradient {
  background: 
    radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(251, 146, 60, 0.06) 0px, transparent 50%);
}

/* Card hover effects */
.card-hover {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

/* Skeleton loading with shimmer */
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.04) 25%,
    rgba(0, 0, 0, 0.08) 50%,
    rgba(0, 0, 0, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Component Updates Needed:

**AppLayout.jsx** - Add glass navbar:
```jsx
<nav className="glass sticky top-0 z-50 border-b border-white/20">
```

**Card components** - Add hover effects:
```jsx
<Card className="glass card-hover">
```

---

## ⚡ PERFORMANCE OPTIMIZATIONS

### Problem: Slow Loading

**Root Causes Identified:**

1. **Sequential API calls on dashboard load**
2. **No skeleton loading states**
3. **Gemini/Groq calls blocking complaint ingestion**
4. **No caching of static data (infra_types, departments)**

### Fixes:

**1. Background Task for AI Processing**

Move embedding and department mapping to background:

```python
# complaint_service.py - ASYNC version
from fastapi import BackgroundTasks

def ingest_complaint_fast(
    db: Session,
    request: ComplaintIngestRequest,
    background_tasks: BackgroundTasks,
) -> ComplaintIngestResponse:
    """
    Fast path: Insert complaint immediately, defer AI processing.
    """
    # 1. Quick insert with status='received'
    result = db.execute(
        text("SELECT * FROM fn_ingest_complaint_fast(...)"),
        params,
    )
    
    # 2. Queue background AI tasks
    complaint_id = str(result.mappings().first()["complaint_id"])
    
    background_tasks.add_task(
        _process_embeddings_async,
        complaint_id,
        request.description,
        primary_image_path,
    )
    
    background_tasks.add_task(
        _process_department_mapping_async,
        complaint_id,
        request.title,
        request.description,
    )
    
    return ComplaintIngestResponse(...)
```

**2. Add Redis/In-Memory Caching**

```python
# services/cache_service.py
from functools import lru_cache
from datetime import datetime, timedelta

_cache = {}
_cache_ttl = {}

def cache_get(key: str):
    if key in _cache:
        if datetime.now() < _cache_ttl.get(key, datetime.min):
            return _cache[key]
        del _cache[key]
    return None

def cache_set(key: str, value, ttl_seconds: int = 300):
    _cache[key] = value
    _cache_ttl[key] = datetime.now() + timedelta(seconds=ttl_seconds)

# Usage in admin_router.py:
def get_departments(db: Session):
    cached = cache_get("departments")
    if cached:
        return cached
    result = db.execute(text("SELECT * FROM departments")).mappings().all()
    cache_set("departments", result, ttl_seconds=600)
    return result
```

**3. Frontend Data Prefetching**

```jsx
// api/prefetch.js
const PREFETCH_KEYS = ['infra-types', 'departments', 'jurisdictions'];

export async function prefetchStaticData() {
  const cached = sessionStorage.getItem('ps_crm_static');
  if (cached) {
    const data = JSON.parse(cached);
    if (Date.now() - data.ts < 10 * 60 * 1000) {
      return data;
    }
  }
  
  const [infraTypes, departments, jurisdictions] = await Promise.all([
    client.get('/complaints/infra-types'),
    client.get('/admin/departments'),
    client.get('/admin/jurisdictions'),
  ]);
  
  const result = {
    infraTypes: infraTypes.data,
    departments: departments.data,
    jurisdictions: jurisdictions.data,
    ts: Date.now(),
  };
  
  sessionStorage.setItem('ps_crm_static', JSON.stringify(result));
  return result;
}
```

**4. Skeleton Loading Components**

```jsx
// components/SkeletonCard.jsx
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="rounded-2xl border border-outline-variant p-4 space-y-3">
      <div className="skeleton h-4 w-24 rounded" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3 rounded" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
}

// Usage in DashboardPage.jsx:
{loading ? (
  <div className="grid grid-cols-3 gap-3">
    {[1,2,3].map(n => <SkeletonCard key={n} lines={2} />)}
  </div>
) : (
  // actual content
)}
```

---

## 📋 IMMEDIATE ACTION CHECKLIST

### Critical (Fix Now)
- [ ] Fix `approve_workflow` version_id parameter error
- [ ] Fix `get_infra_node_ai_summary` SQL column reference
- [ ] Increase Gemini max_output_tokens to 4096
- [ ] Add empty response handling in _call_gemini

### High Priority (This Week)
- [ ] Wire up MIDWAY_SURVEY trigger in workflow step completion
- [ ] Add background tasks for embedding/mapping
- [ ] Implement skeleton loading states
- [ ] Add infra_node AI summary population

### Medium Priority (Next Sprint)
- [ ] Add Redis caching layer
- [ ] Implement session storage prefetching
- [ ] Add notify_area_citizens calls for emergencies
- [ ] Apply glassmorphism CSS updates

### Nice to Have
- [ ] Add WebSocket real-time updates for dashboard
- [ ] Implement complaint submission progress indicator
- [ ] Add offline support with service worker

---

## 🔧 QUICK FIX PATCH FILES

I'll generate the specific code patches in the next step. Would you like me to:

1. Generate the exact code fixes for the 3 critical bugs?
2. Create the background task implementation for faster complaint ingestion?
3. Generate the glassmorphism CSS and component updates?
4. Create the infra_node AI summary service?

Let me know which fixes you want first!
