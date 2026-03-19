# PS-CRM — Smart Public Service CRM
## Master Context Document (Read This First)

---

## What We Are Building

A **Smart Public Service CRM (PS-CRM)** — an AI-powered civic intelligence platform for Delhi's municipal grievance system. This is **not** a replacement for Delhi Mitra or CPGRAMS. It is an **intelligence and automation layer that sits on top of them**, making them smarter, faster, and transparent.

The core idea is simple:

> **Traditional grievance platforms track complaints. PS-CRM tracks the health of the city itself.**

Complaints in our system are not tickets. They are **signals about infrastructure**. When 5 people report a broken streetlight on the same street, that is not 5 tickets — it is one infrastructure failure that needs to be clustered, mapped to the physical asset, routed to the right department, and proactively resolved.

---

## The Problem We Are Solving

Delhi's existing grievance systems (Delhi Mitra, CPGRAMS) are built for **compliance**, not intelligence. They ensure complaints follow bureaucratic timelines — but they do not:

- Map complaints to actual physical infrastructure assets (poles, drains, roads)
- Auto-route multi-department issues (e.g. a tree touching an electric pole involves Forest Dept + Electricity Dept simultaneously)
- Detect repeat failures at the same location
- Hold contractors accountable with performance data
- Give citizens real-time, meaningful visibility into progress
- Predict where problems will occur before they escalate

Our platform fills all of these gaps.

---

## Who Uses This System (Roles)

There are six distinct roles in the system, each with their own interface and data access:

**1. Citizen**
The person filing the complaint. Interacts via WhatsApp, web portal, or call centre. Receives status updates and is asked for mid-progress and final feedback via automated surveys. Can see their complaint's progress on a public dashboard.

**2. Worker**
A field-level government employee. Receives task assignments. Updates task progress. Uploads proof photos. Does not see data outside their assigned tasks.

**3. Contractor**
An external vendor hired for specific repair work. Has a profile in the system. Gets tasks assigned. Their performance (resolution time, failure rate, citizen rejection rate) is tracked and scored over time.

**4. Official (JSSA / AA / FAA)**
The department-level officer responsible for a geographic area. Sees all complaints and tasks in their area. Can assign workers and contractors. Can override contractor assignments (with a mandatory reason logged). Follows the Delhi Mitra 3-tier hierarchy (JSSA → AA → FAA, 41-day SLA). Sees only their department's and area's data.

**5. Admin**
Department head level. Sees all complaints, workers, contractors, and KPIs for their department city-wide. Can manage workflow configurations. Has the same dashboard capabilities as Officials but with broader data access.

**6. Super Admin**
City-level command. Sees everything — all departments, all areas, all complaints regardless of location. Approves tender requests. Monitors official and contractor performance across the entire city. Has override and escalation authority over everything.

---

## How a Complaint Flows Through the System

This is the full lifecycle of a single complaint:

**Step 1 — Intake**
Citizen files a complaint via WhatsApp, web portal, or call centre. The system captures their location (GPS or map pin), complaint text (in any Indian language), and optionally a photo. OTP verification confirms their identity. Bhashini API translates non-English input to English for processing while retaining the original.

**Step 2 — Hybrid Mapping**
This is where intelligence happens. The system uses a two-stage approach:
- First, a rule engine (keyword/regex dictionary) attempts to classify the complaint — match "drain" → Drainage Dept, match "tree" + "electric pole" → Forest Dept AND Electricity Dept simultaneously.
- If the rule engine cannot classify with high confidence (below 0.85), Gemini LLM is called to interpret the complaint and suggest departments, asset type, and urgency.
- Gemini's output is always validated by the rule engine before being accepted. The LLM suggests; the rules decide. This prevents hallucination from affecting actual municipal routing.

The complaint is then geo-tagged to a specific infrastructure asset in the asset registry (e.g. Pole #DL-4521, Drain Node #KBagh-12) using PostGIS spatial lookup.

**Step 3 — Clustering**
If other complaints already exist within a configurable radius targeting the same infrastructure type, this complaint is grouped under an existing **infra node cluster**. The citizen still sees their individual complaint. Officials see the cluster — one unified task, not 5 separate tickets.

**Step 4 — Workflow Assignment**
A workflow is created based on complaint type + jurisdiction. The jurisdiction is auto-resolved from the GPS coordinates via PostGIS polygon lookup (NDMC vs MCD vs PWD vs DDA all have different boundary polygons stored in the DB). Multi-department complaints create sequential workflow steps — e.g. Horticulture must complete Step 1 before Electricity can begin Step 2.

The complaint is published to GCP Pub/Sub as an event. The relevant official's dashboard updates in real time. The citizen receives a confirmation with their grievance ID.

**Step 5 — Execution**
The official assigns a worker or contractor. Contractor assignment is suggested by the system based on availability, area familiarity, and past performance score. The official can override the suggestion but must select a reason from a fixed dropdown (logged for analytics).

**Step 6 — Automated Follow-Up**
This is handled entirely by AI agents (LangGraph). No human needs to chase anyone:
- The SLA Watchdog agent monitors deadlines. If a step is overdue, it escalates automatically.
- The Mid-Survey Agent sends a WhatsApp message to the contractor at the 50% SLA point asking for a progress photo.
- The same agent simultaneously asks 2-3 nearby citizens (within 500m, opt-in) whether they've seen progress.
- If no proof is received after 3 attempts (Day 1, Day 3, Day 5), the system auto-escalates to the next tier (JSSA → AA → FAA).

**Step 7 — Closure and Validation**
When the contractor marks work as done, the Final Survey Agent sends a WhatsApp to the original complainant asking for confirmation and a final photo. If the citizen approves, the complaint closes. If they reject, it automatically reopens and escalates. Even if an admin force-closes, the system retains a "citizen-unverified" flag visible on the public dashboard.

**Step 8 — Seasonal / Emergency Handling**
- If a workflow step is seasonally blocked (e.g. road-cutting moratorium during monsoon July–September), it is automatically paused with a `legally_blocked` status and a resumption date shown to the citizen. Admins manage these rules from a frontend table — no code change needed.
- Emergency bypass is a first-class flag. An official can collapse the workflow and assign immediately, but the system auto-generates mandatory post-hoc documentation tasks that must be completed after resolution. Nothing disappears from the audit trail.

---

## Dashboards (What Each Role Sees)

**Citizen Portal (Public)**
A live map of open issues in the city. Color-coded by status. Citizens can see their own complaint's full timeline (what happened, when, who was assigned). No sensitive data (no phone numbers, no internal notes). Complaint density heatmaps by area.

**Official Dashboard**
Pinpoint map of their area with all complaints and their statuses. Task list sorted by SLA urgency. Agent-generated summaries for each complaint (AI writes a 2-line brief: what the issue is, what's been done, what's pending). Can assign, reassign, escalate, and update.

**Admin Dashboard**
Department-wide view. KPIs: complaints pending vs resolved by ward, SLA compliance rate, contractor performance rankings, average resolution time. Can see all officials' workloads. Manages workflow constraint rules (seasonal moratoriums, emergency policies).

**Super Admin Dashboard**
Full city view. All departments, all areas. Can see which officials have high override rates (flags potential issues). Approves tender requests. Views contractor profiles with full historical performance. Monitors version activity for workflow templates. Has alert feeds for: complaints unresolved beyond 30 days, spikes in negative citizen feedback, any complaints where citizens rejected the resolution.

---

## The Agentic Workflow Automation Layer

This is the brain of the system. A network of specialized AI agents (built with LangGraph, running on GCP Cloud Run) handles all automated tasks:

- **Supervisor Agent** — orchestrates all other agents, manages state
- **Routing Agent** — handles department assignment and task creation
- **Geo Agent** — manages spatial lookups, asset matching, cluster detection
- **SLA Watchdog** — monitors every active complaint for deadline breaches
- **Mid-Survey Agent** — autonomous proof and feedback collection mid-workflow
- **Final Audit Agent** — closure validation and citizen confirmation
- **Contractor Risk Agent** — scores contractor reliability using PyTorch models on historical data
- **Predictive Analytics Agent** — runs nightly spatial clustering on complaint history to detect emerging hotspots and alert Super Admin before problems escalate

Every agent action is logged in an append-only audit table. Agents suggest and monitor — they never unilaterally close a complaint or approve a tender. Human authority is always preserved for final decisions.

---

## Technology Stack

**Frontend**
React 19 + Shadcn UI + Tailwind CSS. MapLibre GL JS for maps (open-source, no Mapbox cost). WebSockets for real-time dashboard updates.

**Backend**
FastAPI (Python). Async, high-performance API layer. SQLAlchemy 2.0 for ORM. Alembic for migrations.

**Database**
PostgreSQL + PostGIS on Google Cloud SQL. PostGIS handles all geospatial operations — jurisdiction lookup, asset proximity, clustering, heatmap calculations. pgvector extension stores Nomic 768-dimensional embeddings for both complaint text and images (semantic duplicate detection at ingestion).

**AI / LLM**
Gemini 1.5 Pro / Flash on Google Vertex AI. Used only for ambiguous complaint reasoning — not for routing decisions. PyTorch models on Vertex AI for contractor risk scoring.

**Translation**
Bhashini API (primary — 22 Indian languages, government-aligned). Google Translate (fallback).

**Agent Orchestration**
LangGraph (open-source, MIT license). Stateful multi-agent workflows with human-in-the-loop checkpoints.

**Event Infrastructure**
GCP Pub/Sub as the event bus. GCP Cloud Tasks for all scheduled/delayed work (SLA reminders, survey dispatches, overdue alerts). Every event is idempotent and carries a unique event_id.

**Notifications**
WhatsApp Business API (Meta) for citizen-facing messages. Email via GCP for official-facing notifications. Geo-fenced to 500m radius for area notifications (opt-in only).

**Deployment**
GKE (production workloads) + Cloud Run (agents, lightweight services). Cloud Memorystore (Redis) for caching and WebSocket sessions.

---

## Database Design Principles

The production-grade PostgreSQL schema is built in layers and already designed. Key principles:

- **Jurisdiction is a property of the location**, not the complaint. PostGIS reverse lookup against stored boundary polygons auto-tags every complaint at ingestion time.
- **Workflow versioning is immutable**. Workflow templates are versioned. In-flight complaints always complete under the version they started. New complaints get the new version. Old versions are archived when zero active complaints remain.
- **Partitioning from day one**. High-volume tables (complaints, notification logs, event logs, task status history) are range-partitioned by month for query performance at scale.
- **Embeddings on the complaint table**. Two pgvector IVFFlat indexes (text + image, 768-dim) enable semantic duplicate detection at ingestion — before a complaint is even saved, the system checks if a semantically identical complaint already exists nearby.
- **Contractor override is DB-enforced**. The override reason is a PostgreSQL enum, not just a UI dropdown. Invalid reasons fail at the database layer regardless of how the API is called.
- **Emergency bypass creates posthoc tasks**. Skipped workflow steps are automatically converted to mandatory documentation tasks with computed deadlines. Only Super Admin can waive them, with a mandatory reason logged.

---

## What This System Explicitly Does NOT Do

- Does not replace Delhi Mitra's JSSA → AA → FAA hierarchy. It augments it.
- Does not let AI make final decisions. Gemini suggests. Humans decide.
- Does not broadcast notifications to entire wards (geo-fenced opt-in only).
- Does not expose officer phone numbers or internal notes publicly.
- Does not use blockchain. Audit trail lives in append-only PostgreSQL tables.
- Does not allow any complaint to be silently closed. Citizen rejection reopens automatically.

---

## Current State of the Project

The production-grade PostgreSQL database schema is fully designed and ready for Cloud SQL deployment. It covers 30+ tables across geography, users, infrastructure, complaints, workflow engine, tasks, emergency handling, tenders, surveys, notifications, GCP event integration, agent logging, KPI snapshots, and public dashboards. Views, helper functions, triggers, indexes, and RLS policies are all designed.

The next phases are: RLS (Row Level Security) policy implementation, FastAPI backend scaffolding, LangGraph agent implementation, and frontend build.

---

*This document is the single source of truth for understanding what PS-CRM is and how it works. Reference it at the start of every new session.*