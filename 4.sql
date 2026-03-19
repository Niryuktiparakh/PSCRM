-- ============================================================
--  PS-CRM  |  Smart Public Service CRM
--  FINAL CONSOLIDATED SCHEMA
--  Platform: GCP Cloud SQL (PostgreSQL 15+)
--
--  This is the ONLY file you need. Run once on a fresh DB:
--    psql -h <host> -U <user> -d <db> -f ps_crm_final.sql
--
--  Incorporates all fixes from v3.1 and v3.2.
--  Apply order: just this file. Nothing else.
--
--  Included in order:
--   1. Base schema (v3)
--   2. Critical fixes (v3.1): workflow_complaints junction,
--      location_hash race fix, normalized step dependencies,
--      assignment single source of truth, separate embeddings table,
--      task_sla, domain_events, soft delete, workflow_status_history,
--      survey geo index
--   3. Final fixes (v3.2): UNIQUE complaint->workflow constraint,
--      geohash upgrade, fn_ingest_complaint atomic transaction,
--      text_embedding NOT NULL, v_missing_embeddings monitoring view
-- ============================================================


-- ============================================================
-- PART 1: BASE SCHEMA (v3)
-- ============================================================

-- ============================================================
--  PS-CRM  |  Smart Public Service CRM
--  Production Schema v3 — COMPLETE, SINGLE FILE
--  Platform : GCP Cloud SQL (PostgreSQL 15+)
--  City     : Delhi (multi-city SaaS ready)
--
--  Apply order:
--    psql -h <host> -U <user> -d <db> -f ps_crm_schema_v3.sql
--
--  LAYER ORDER
--   1.  Extensions
--   2.  Reference / Master Data
--   3.  Users & Actors
--   4.  Infrastructure
--   5.  Complaints  (partitioned)
--   6.  Workflow Engine
--   7.  Tasks
--   8.  Emergency Post-Hoc
--   9.  Tenders
--  10.  Surveys
--  11.  Notifications
--  12.  GCP Integration (Pub/Sub + Cloud Tasks)
--  13.  Agent Logs
--  14.  Public Dashboard
--  15.  KPI Snapshots
--  16.  Deferred FKs
--  17.  Partitioned child tables
--  18.  Indexes
--  19.  Triggers
--  20.  Helper Functions
--  21.  Views
-- ============================================================


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;      -- pgvector: Nomic 768-dim embeddings

-- ============================================================
-- 2. REFERENCE / MASTER DATA
-- ============================================================

-- ── 2.1 Cities ───────────────────────────────────────────────────
CREATE TABLE cities (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    state           VARCHAR(100),
    country_code    CHAR(2)      NOT NULL DEFAULT 'IN',
    city_code       VARCHAR(10)  NOT NULL UNIQUE, -- DEL, MUM, etc. (used in serial numbers)
    timezone        VARCHAR(50)  NOT NULL DEFAULT 'Asia/Kolkata',
    metadata        JSONB        NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cities IS
    'Top-level city entity. Every resource is scoped to a city.
     city_code is used in complaint/task/tender serial numbers (CRM-DEL-...).
     Adding a new city = insert one row + seed its jurisdictions.';

-- ── 2.2 Jurisdictions (authority boundaries) ────────────────────
-- PostGIS MULTIPOLYGON for each authority area.
-- Reverse-lookup at complaint ingestion to auto-tag jurisdiction.
-- Delhi: NDMC, MCD, MCD_SOUTH, MCD_EAST, MCD_NORTH, PWD, DDA, CANTONMENT, DJB, IGL
CREATE TABLE jurisdictions (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id             UUID         NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    parent_id           UUID         REFERENCES jurisdictions(id),  -- nested zones
    name                VARCHAR(200) NOT NULL,
    code                VARCHAR(30)  NOT NULL,
    jurisdiction_type   VARCHAR(50)  NOT NULL,
    -- e.g. NDMC | MCD | MCD_SOUTH | PWD | DDA | CANTONMENT | DJB | IGL
    boundary            GEOMETRY(MULTIPOLYGON, 4326),
    metadata            JSONB        NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (city_id, code)
);

COMMENT ON TABLE jurisdictions IS
    'Spatial authority boundaries. A single location can fall under multiple authorities:
     road → PWD, drain → MCD, land → DDA.
     fn_resolve_jurisdiction() returns the most specific (smallest area) match.
     Workflow templates are keyed on (infra_type + jurisdiction) — same road complaint
     has different approval chains in NDMC vs MCD.
     Boundary GeoJSON sourced from Delhi Open Data portal.';

-- ── 2.3 Workflow Constraints (admin-managed, no redeploy) ────────
CREATE TABLE workflow_constraints (
    id                       UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id                  UUID         NOT NULL REFERENCES cities(id),
    jurisdiction_id          UUID         REFERENCES jurisdictions(id), -- NULL = whole city

    name                     VARCHAR(300) NOT NULL,
    description              TEXT,
    constraint_type          VARCHAR(30)  NOT NULL
                                 CHECK (constraint_type IN (
                                     'seasonal',   -- monsoon moratorium, winter smog
                                     'emergency',  -- flood rescue ops, riots
                                     'policy',     -- election model code
                                     'resource'    -- equipment shortage
                                 )),

    -- What it blocks (empty array = ALL)
    affected_dept_codes      TEXT[]       NOT NULL DEFAULT '{}',
    affected_work_type_codes TEXT[]       NOT NULL DEFAULT '{}',

    -- Recurring annual (e.g. monsoon Jul-Sep every year)
    is_recurring_annual      BOOLEAN      NOT NULL DEFAULT FALSE,
    start_month              SMALLINT     CHECK (start_month BETWEEN 1 AND 12),
    start_day                SMALLINT     CHECK (start_day   BETWEEN 1 AND 31),
    end_month                SMALLINT     CHECK (end_month   BETWEEN 1 AND 12),
    end_day                  SMALLINT     CHECK (end_day     BETWEEN 1 AND 31),

    -- One-off absolute window
    active_from              DATE,
    active_until             DATE,

    -- Future-proof condition (e.g. {"rainfall_mm": ">50", "aqi": ">400"})
    condition                JSONB        NOT NULL DEFAULT '{}',

    -- Shown verbatim to officials and citizens when step is blocked
    block_message            TEXT         NOT NULL,
    legal_reference          TEXT,

    is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by               UUID,        -- FK to users added after users table
    updated_by               UUID,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_wc_date_range CHECK (
        (is_recurring_annual = TRUE
            AND start_month IS NOT NULL AND start_day IS NOT NULL
            AND end_month   IS NOT NULL AND end_day   IS NOT NULL)
        OR
        (is_recurring_annual = FALSE
            AND active_from IS NOT NULL AND active_until IS NOT NULL)
    )
);

COMMENT ON TABLE workflow_constraints IS
    'Admin-managed, frontend-editable workflow blocking rules.
     No code deployment needed to add/remove constraints.
     Admin adds monsoon moratorium every July → system auto-blocks road-cutting steps.
     After September: admin deactivates it. Done.
     condition JSONB is for future sensor/API-driven triggers (rainfall, AQI).';

-- ── 2.4 Departments ─────────────────────────────────────────────
-- head_official_id FK added after users table (Layer 16)
CREATE TABLE departments (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id             UUID         NOT NULL REFERENCES cities(id),
    jurisdiction_id     UUID         REFERENCES jurisdictions(id), -- NULL = city-wide
    name                VARCHAR(300) NOT NULL,
    code                VARCHAR(30)  NOT NULL,                    -- PWD, MCD, NDMC, DJB, IGL
    contact_email       VARCHAR(255),
    contact_phone       VARCHAR(20),
    metadata            JSONB        NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (city_id, code)
);

COMMENT ON TABLE departments IS
    'Government departments scoped to city and optionally to a jurisdiction.
     DJB (water board) is city-wide; MCD Horticulture is zone-specific.';

-- ── 2.5 Infrastructure Types ────────────────────────────────────
CREATE TABLE infra_types (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(100) NOT NULL,  -- Road, Drain, Streetlight, Water Pipe
    code                    VARCHAR(30)  NOT NULL UNIQUE,
    default_dept_ids        UUID[]       NOT NULL DEFAULT '{}',
    -- Radius within which complaints on same type are clustered to one infra_node
    cluster_radius_meters   INTEGER      NOT NULL DEFAULT 50,
    -- 3-year repeat threshold (configurable per type)
    repeat_alert_years      INTEGER      NOT NULL DEFAULT 3,
    icon_url                TEXT,
    metadata                JSONB        NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE infra_types IS
    'Master infra catalogue. cluster_radius_meters controls complaint clustering:
     two complaints within this distance on the same type → same infra_node.
     repeat_alert_years: complaint on same node within this window → priority critical.';


-- ============================================================
-- 3. USERS & ACTORS
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'citizen',
    'worker',
    'contractor',
    'official',     -- assigns tasks, views area complaints
    'admin',        -- branch/zone admin
    'super_admin'   -- city-wide, approves tenders
);

CREATE TABLE users (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id             UUID         REFERENCES cities(id),
    department_id       UUID         REFERENCES departments(id),
    jurisdiction_id     UUID         REFERENCES jurisdictions(id),
    email               VARCHAR(255) UNIQUE,
    phone               VARCHAR(20)  UNIQUE,
    full_name           VARCHAR(300) NOT NULL,
    preferred_language  VARCHAR(10)  NOT NULL DEFAULT 'hi',
    role                user_role    NOT NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    is_verified         BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Firebase Auth UID (GCP Identity Platform)
    auth_uid            VARCHAR(255) UNIQUE,
    auth_provider       VARCHAR(30)  NOT NULL DEFAULT 'phone_otp',
    -- GCP Firebase Cloud Messaging token for push
    fcm_token           TEXT,
    twilio_opt_in       BOOLEAN      NOT NULL DEFAULT TRUE,
    email_opt_in        BOOLEAN      NOT NULL DEFAULT TRUE,
    metadata            JSONB        NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

COMMENT ON TABLE users IS
    'Unified user table for all roles.
     auth_uid links to GCP Identity Platform / Firebase Auth.
     Citizens self-register via phone OTP.
     Officials, admins provisioned by super_admin.
     twilio_opt_in / email_opt_in respected by notification dispatcher.';

-- Now safe to backfill workflow_constraints creator FK
ALTER TABLE workflow_constraints
    ADD CONSTRAINT fk_wc_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    ADD CONSTRAINT fk_wc_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);

ALTER TABLE departments
    ADD COLUMN head_official_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- ── 3.1 Contractors ─────────────────────────────────────────────
CREATE TABLE contractors (
    id                      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    city_id                 UUID          NOT NULL REFERENCES cities(id),
    company_name            VARCHAR(400)  NOT NULL,
    registration_number     VARCHAR(100)  NOT NULL,
    registered_dept_ids     UUID[]        NOT NULL DEFAULT '{}',
    license_expiry          DATE,
    max_concurrent_tasks    INTEGER       NOT NULL DEFAULT 5,
    performance_score       NUMERIC(4,2)  NOT NULL DEFAULT 5.0
                                CHECK (performance_score BETWEEN 0 AND 10),
    is_blacklisted          BOOLEAN       NOT NULL DEFAULT FALSE,
    blacklist_reason        TEXT,
    blacklisted_at          TIMESTAMPTZ,
    blacklisted_by          UUID          REFERENCES users(id),
    metadata                JSONB         NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE contractors IS
    'Registered contractors per city. Officials can override system assignment
     but must log a reason_code (enum). High override rate is flagged on KPI.
     Blacklisted contractors are excluded from all assignment suggestions.';

-- ── 3.2 Workers ─────────────────────────────────────────────────
CREATE TABLE workers (
    id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    department_id       UUID          REFERENCES departments(id),
    contractor_id       UUID          REFERENCES contractors(id), -- NULL = direct govt employee
    employee_id         VARCHAR(100),
    skills              TEXT[]        NOT NULL DEFAULT '{}',
    is_available        BOOLEAN       NOT NULL DEFAULT TRUE,
    current_task_count  INTEGER       NOT NULL DEFAULT 0,
    performance_score   NUMERIC(4,2)  NOT NULL DEFAULT 5.0
                            CHECK (performance_score BETWEEN 0 AND 10),
    metadata            JSONB         NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE workers IS
    'Field workers — direct employees (contractor_id IS NULL) or under a contractor.
     current_task_count incremented/decremented by trigger on task assignment.';


-- ============================================================
-- 4. INFRASTRUCTURE
-- ============================================================

-- ── 4.1 Infra Nodes (simple assets: point or line) ───────────────
CREATE TABLE infra_nodes (
    id                      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id                 UUID          NOT NULL REFERENCES cities(id),
    jurisdiction_id         UUID          REFERENCES jurisdictions(id), -- auto-resolved
    infra_type_id           UUID          NOT NULL REFERENCES infra_types(id),
    name                    VARCHAR(400),  -- "Streetlight near Chhatrapati Nagar"
    location                GEOMETRY(GEOMETRY, 4326) NOT NULL, -- POINT or LINESTRING
    status                  VARCHAR(30)   NOT NULL DEFAULT 'operational'
                                CHECK (status IN (
                                    'operational',
                                    'damaged',
                                    'under_repair',
                                    'decommissioned'
                                )),
    attributes              JSONB         NOT NULL DEFAULT '{}',

    -- ── Repeat complaint tracking (denormalized for fast ingestion lookup) ──
    -- Updated every time a workflow on this node is marked completed
    last_resolved_at        TIMESTAMPTZ,
    last_resolved_workflow_id UUID,       -- FK to workflow_instances (added in Layer 16)
    total_complaint_count   INTEGER       NOT NULL DEFAULT 0,
    total_resolved_count    INTEGER       NOT NULL DEFAULT 0,

    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE infra_nodes IS
    'Physical infrastructure items. Complaints are clustered under a node.
     last_resolved_at + infra_types.repeat_alert_years drive the repeat escalation:
     new complaint on same node within threshold → priority = critical.
     This is denormalized intentionally — ingestion needs it in ONE fast lookup,
     not a subquery across the complaints table.
     total_complaint_count and total_resolved_count feed the hotspot detection view.';

-- ── 4.2 Asset Health Logs ────────────────────────────────────────
CREATE TABLE asset_health_logs (
    id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    infra_node_id       UUID          NOT NULL REFERENCES infra_nodes(id) ON DELETE CASCADE,
    health_score        NUMERIC(4,2)  CHECK (health_score BETWEEN 0 AND 10),
    open_complaint_count   INTEGER    NOT NULL DEFAULT 0,
    resolved_complaint_count INTEGER  NOT NULL DEFAULT 0,
    avg_resolution_days NUMERIC(8,2),
    last_complaint_at   TIMESTAMPTZ,
    computed_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE asset_health_logs IS
    'Append-only health snapshot per infra_node. Written by the KPI Cloud Scheduler job.
     Drives the infra hotspot detection view and agent priority scoring.
     health_score: 10 = perfect, 0 = repeatedly failing. Agent uses this for
     complaint priority suggestion alongside is_repeat_complaint flag.';


-- ============================================================
-- 5. COMPLAINTS  (range-partitioned by created_at — monthly)
-- ============================================================

-- Partitioned parent table — do NOT insert directly into this table.
-- Insert into the monthly child partitions (created in Layer 17).
CREATE TABLE complaints (
    id                          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    complaint_number            VARCHAR(30)  NOT NULL,  -- CRM-DEL-2025-001234
    citizen_id                  UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    city_id                     UUID         NOT NULL REFERENCES cities(id),
    jurisdiction_id             UUID         REFERENCES jurisdictions(id),   -- auto-resolved
    infra_node_id               UUID         REFERENCES infra_nodes(id),     -- set after clustering
    workflow_instance_id        UUID,                                         -- FK deferred Layer 16

    -- ── Content ─────────────────────────────────────────────
    title                       VARCHAR(500) NOT NULL,
    description                 TEXT         NOT NULL,
    original_language           VARCHAR(10)  NOT NULL DEFAULT 'hi',
    translated_description      TEXT,

    -- ── Location ────────────────────────────────────────────
    location                    GEOMETRY(POINT, 4326) NOT NULL,
    address_text                TEXT,

    -- ── Media (stored in GCS; URLs here) ────────────────────
    -- [{url, gcs_path, mime_type, width, height, uploaded_at}]
    images                      JSONB        NOT NULL DEFAULT '[]',
    voice_recording_url         TEXT,        -- GCS signed URL
    voice_transcript            TEXT,
    voice_transcript_language   VARCHAR(10),

    -- ── Nomic 768-dim embeddings (pgvector) ─────────────────
    text_embedding              vector(768),
    image_embedding             vector(768),

    -- ── Status ──────────────────────────────────────────────
    status                      VARCHAR(30)  NOT NULL DEFAULT 'received'
                                    CHECK (status IN (
                                        'received',
                                        'clustered',
                                        'mapped',
                                        'workflow_started',
                                        'in_progress',
                                        'midway_survey_sent',
                                        'resolved',
                                        'closed',
                                        'rejected',
                                        'escalated',
                                        'constraint_blocked',
                                        'emergency'
                                    )),
    priority                    VARCHAR(20)  NOT NULL DEFAULT 'normal'
                                    CHECK (priority IN (
                                        'low', 'normal', 'high', 'critical', 'emergency'
                                    )),

    -- ── Repeat complaint escalation ─────────────────────────
    -- Set by fn_check_repeat_complaint() at ingestion
    is_repeat_complaint             BOOLEAN      NOT NULL DEFAULT FALSE,
    repeat_previous_complaint_id    UUID,       -- last resolved complaint on same node
    repeat_previous_resolved_at     TIMESTAMPTZ, -- when that one closed
    -- Days between previous resolution and this complaint's creation.
    -- Plain integer set once at ingestion by fn_ingest_complaint.
    -- Cannot be GENERATED: PostgreSQL requires immutable expressions;
    -- NOW() is volatile. Value is the gap at filing time, not today's gap.
    repeat_gap_days                 INTEGER,

    -- ── Emergency bypass ────────────────────────────────────
    is_emergency                BOOLEAN      NOT NULL DEFAULT FALSE,
    emergency_bypass_at         TIMESTAMPTZ,
    emergency_bypass_by         UUID         REFERENCES users(id),
    emergency_bypass_reason     TEXT,
    -- Snapshot written at bypass: {bypassed_by, reason, steps_bypassed, posthoc_task_ids}
    emergency_audit_trail       JSONB        NOT NULL DEFAULT '{}',

    -- ── Clustering ──────────────────────────────────────────
    is_cluster_primary          BOOLEAN      NOT NULL DEFAULT FALSE,

    -- ── Agent outputs ───────────────────────────────────────
    agent_summary               TEXT,
    agent_priority_reason       TEXT,
    agent_suggested_dept_ids    UUID[]       NOT NULL DEFAULT '{}',

    -- ── Re-complaint ────────────────────────────────────────
    is_recomplaint              BOOLEAN      NOT NULL DEFAULT FALSE,
    parent_complaint_id         UUID,        -- self-ref; FK cannot be on partitioned table
                                             -- enforced at app layer

    -- ── Resolution ──────────────────────────────────────────
    resolved_at                 TIMESTAMPTZ,
    rejected_reason             TEXT,

    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, created_at)   -- partition key must be in PK on Cloud SQL
) PARTITION BY RANGE (created_at);

COMMENT ON TABLE complaints IS
    'Core entity. Range-partitioned monthly by created_at for Cloud SQL performance.
     One row per citizen submission; multiple complaints cluster under one infra_node.

     REPEAT ESCALATION:
     fn_check_repeat_complaint(infra_node_id) is called at ingestion.
     If infra_node.last_resolved_at is within infra_types.repeat_alert_years:
       priority = critical
       is_repeat_complaint = TRUE
       repeat_previous_complaint_id = last resolved complaint
       repeat_gap_days (GENERATED) = days since last resolution
     agent_priority_reason shows: "Same infra reported again after X days.
     Previous resolution by [official] on [date]."

     PARTITIONING:
     Monthly child partitions are pre-created for 2 years (see Layer 17).
     Cloud Scheduler creates the next month partition on the 25th of each month.

     NOTE: self-referential FKs (parent_complaint_id, repeat_previous_complaint_id)
     cannot be enforced as FK constraints on partitioned tables in PostgreSQL.
     Enforced at application layer + checked by a nightly consistency Cloud Function.';

-- ── 5.1 Complaint Status History ────────────────────────────────
-- Also range-partitioned (Layer 17)
CREATE TABLE complaint_status_history (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    complaint_id    UUID         NOT NULL,
    old_status      VARCHAR(30),
    new_status      VARCHAR(30)  NOT NULL,
    changed_by      UUID         REFERENCES users(id),
    reason          TEXT,
    metadata        JSONB        NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- ── 5.2 Complaint Clusters ───────────────────────────────────────
CREATE TABLE complaint_clusters (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    infra_node_id           UUID         NOT NULL REFERENCES infra_nodes(id),
    primary_complaint_id    UUID         NOT NULL,  -- no FK: partitioned table
    complaint_count         INTEGER      NOT NULL DEFAULT 1,
    -- AI-generated summary of all complaints in cluster (shown to official)
    cluster_summary         TEXT,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE complaint_cluster_members (
    cluster_id      UUID        NOT NULL REFERENCES complaint_clusters(id) ON DELETE CASCADE,
    complaint_id    UUID        NOT NULL,   -- no FK: partitioned table
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (cluster_id, complaint_id)
);

COMMENT ON TABLE complaint_clusters IS
    'Groups complaints targeting the same infra_node.
     Citizens see: "X others also reported this issue."
     Officials see the cluster summary, not individual complaints.
     One cluster → one workflow_instance → one set of tasks.';


-- ============================================================
-- 6. WORKFLOW ENGINE
-- ============================================================

-- ── 6.1 Workflow Templates (base — named, not versioned) ─────────
CREATE TABLE workflow_templates (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id     UUID         NOT NULL REFERENCES cities(id),
    name        VARCHAR(300) NOT NULL,
    description TEXT,
    created_by  UUID         REFERENCES users(id),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (city_id, name)
);

COMMENT ON TABLE workflow_templates IS
    'Named base template. Versioning is separate (workflow_template_versions).
     Editing a template = creating a new version, never mutating the base.
     This table is just the anchor; all workflow logic lives in versions + steps.';

-- ── 6.2 Workflow Template Versions (immutable on creation) ───────
CREATE TABLE workflow_template_versions (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id         UUID         NOT NULL REFERENCES workflow_templates(id),
    city_id             UUID         NOT NULL REFERENCES cities(id),
    jurisdiction_id     UUID         REFERENCES jurisdictions(id),  -- NULL = city-wide
    infra_type_id       UUID         REFERENCES infra_types(id),    -- NULL = generic
    version             INTEGER      NOT NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    is_latest_version   BOOLEAN      NOT NULL DEFAULT TRUE,
    previous_version_id UUID         REFERENCES workflow_template_versions(id),
    notes               TEXT,
    created_by          UUID         REFERENCES users(id),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (template_id, version)
);

COMMENT ON TABLE workflow_template_versions IS
    'Frozen version snapshot. Once created, never edited.
     When admin updates a template:
       1. old version: is_latest_version = FALSE
       2. new row inserted: version = old+1, is_latest_version = TRUE
     In-flight workflow_instances carry version_id and run to completion
     under that frozen version. New complaints pick up is_latest_version = TRUE.
     Admin dashboard v_workflow_version_activity shows active_instances per version
     → safe_to_archive when active_instances = 0.

     JURISDICTION LAYER:
     A road complaint in NDMC matches version with jurisdiction_id = NDMC.
     Same complaint type in MCD matches MCD version. Different approval chains.
     fn_resolve_workflow_version() picks the most specific matching version.';

-- ── 6.3 Workflow Template Steps ─────────────────────────────────
CREATE TABLE workflow_template_steps (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id              UUID         NOT NULL
                                REFERENCES workflow_template_versions(id) ON DELETE CASCADE,
    step_number             INTEGER      NOT NULL,
    department_id           UUID         NOT NULL REFERENCES departments(id),
    step_name               VARCHAR(300) NOT NULL,
    description             TEXT,
    expected_duration_hours INTEGER,
    -- Step IDs that must be completed before this step unlocks
    -- Enables: Horticulture(1) must complete before E&M(2) starts
    prerequisite_step_ids   UUID[]       NOT NULL DEFAULT '{}',
    is_optional             BOOLEAN      NOT NULL DEFAULT FALSE,
    requires_tender         BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Matched against workflow_constraints.affected_work_type_codes
    work_type_codes         TEXT[]       NOT NULL DEFAULT '{}',
    metadata                JSONB        NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (version_id, step_number)
);

COMMENT ON TABLE workflow_template_steps IS
    'Ordered steps tied to a frozen version. prerequisite_step_ids enforces
     sequential locking: Step 3 cannot start until Steps 1 and 2 are completed.
     work_type_codes matched against workflow_constraints at step-unlock time.
     If blocked by an active constraint → step status = constraint_blocked.';

-- ── 6.4 Workflow Instances ───────────────────────────────────────
CREATE TABLE workflow_instances (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Workflow drives the cluster (infra_node), not individual complaint
    infra_node_id           UUID         NOT NULL REFERENCES infra_nodes(id),
    template_id             UUID         NOT NULL REFERENCES workflow_templates(id),
    -- version_id is IMMUTABLE after creation — this is the governance contract
    version_id              UUID         NOT NULL REFERENCES workflow_template_versions(id),
    jurisdiction_id         UUID         REFERENCES jurisdictions(id),
    status                  VARCHAR(30)  NOT NULL DEFAULT 'active'
                                CHECK (status IN (
                                    'active',
                                    'paused',
                                    'constraint_blocked',
                                    'completed',
                                    'cancelled',
                                    'emergency_bypassed'
                                )),
    mode                    VARCHAR(20)  NOT NULL DEFAULT 'normal'
                                CHECK (mode IN ('normal', 'emergency')),
    current_step_number     INTEGER      NOT NULL DEFAULT 1,
    total_steps             INTEGER      NOT NULL,
    started_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at            TIMESTAMPTZ,
    blocked_reason          TEXT,
    blocked_until           DATE,        -- surfaced to citizens
    is_emergency            BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Written at bypass: {bypassed_by, reason, bypassed_at, direct_assignee}
    emergency_bypass_log    JSONB        NOT NULL DEFAULT '{}',
    created_by              UUID         REFERENCES users(id),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE workflow_instances IS
    'One running workflow per infra_node cluster.
     version_id is stamped at creation and NEVER changes.
     In-flight workflows always run to completion on their version.
     Manual admin migration available with audit log entry.

     EMERGENCY MODE:
     mode = emergency + is_emergency = TRUE → all intermediate steps bypassed.
     emergency_posthoc_tasks auto-created for each bypassed non-optional step.
     Workflow status = emergency_bypassed.
     Officials get speed; audit trail is preserved via posthoc tasks.

     On completion: infra_nodes.last_resolved_at and last_resolved_workflow_id
     are updated for repeat-complaint detection on the next complaint.';

-- ── 6.5 Workflow Step Instances ─────────────────────────────────
CREATE TABLE workflow_step_instances (
    id                          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_instance_id        UUID         NOT NULL
                                    REFERENCES workflow_instances(id) ON DELETE CASCADE,
    template_step_id            UUID         NOT NULL
                                    REFERENCES workflow_template_steps(id),
    step_number                 INTEGER      NOT NULL,
    department_id               UUID         NOT NULL REFERENCES departments(id),
    step_name                   VARCHAR(300) NOT NULL,
    status                      VARCHAR(30)  NOT NULL DEFAULT 'pending'
                                    CHECK (status IN (
                                        'pending',
                                        'unlocked',
                                        'assigned',
                                        'in_progress',
                                        'completed',
                                        'blocked',
                                        'constraint_blocked',
                                        'bypassed_emergency',
                                        'skipped',
                                        'overridden'
                                    )),

    -- Assignment
    assigned_official_id        UUID         REFERENCES users(id),
    assigned_worker_id          UUID         REFERENCES workers(id),
    assigned_contractor_id      UUID         REFERENCES contractors(id),

    -- Override (enum-enforced — see Layer 7)
    override_reason_code        VARCHAR(30),  -- typed enum at app layer; CHECK below
    override_notes              TEXT,
    override_by                 UUID         REFERENCES users(id),
    override_at                 TIMESTAMPTZ,
    override_original_assignee  JSONB,        -- {type, id, name} snapshot

    -- Timing
    unlocked_at                 TIMESTAMPTZ,
    started_at                  TIMESTAMPTZ,
    expected_completion_at      TIMESTAMPTZ,
    completed_at                TIMESTAMPTZ,

    -- Constraint block
    constraint_block_id         UUID         REFERENCES workflow_constraints(id),
    legally_blocked_at          TIMESTAMPTZ,
    legally_blocked_until       DATE,

    -- Agent
    agent_summary               TEXT,
    agent_priority              VARCHAR(20),

    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (workflow_instance_id, step_number),
    CONSTRAINT chk_override_reason CHECK (
        override_reason_code IS NULL OR override_reason_code IN (
            'workload', 'specialization', 'area_familiarity',
            'emergency', 'relationship', 'performance',
            'availability', 'tender_linked', 'other'
        )
    )
);

COMMENT ON TABLE workflow_step_instances IS
    'Running step per workflow. Steps unlock only when all prerequisite steps complete.
     fn_is_step_constraint_blocked() checked before every unlock.
     override_reason_code: constrained dropdown; "other" requires override_notes.
     High override rate per official is flagged on KPI dashboard.';


-- ============================================================
-- 7. TASKS
-- ============================================================

CREATE TABLE tasks (
    id                          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_number                 VARCHAR(30)  NOT NULL UNIQUE,  -- TASK-DEL-2025-001234
    workflow_step_instance_id   UUID         REFERENCES workflow_step_instances(id),
    complaint_id                UUID,        -- no FK: partitioned table; enforced at app layer
    department_id               UUID         NOT NULL REFERENCES departments(id),
    jurisdiction_id             UUID         REFERENCES jurisdictions(id),

    assigned_official_id        UUID         REFERENCES users(id),
    assigned_worker_id          UUID         REFERENCES workers(id),
    assigned_contractor_id      UUID         REFERENCES contractors(id),

    title                       VARCHAR(500) NOT NULL,
    description                 TEXT,
    status                      VARCHAR(30)  NOT NULL DEFAULT 'pending'
                                    CHECK (status IN (
                                        'pending', 'accepted', 'in_progress',
                                        'completed', 'rejected', 'reassigned', 'cancelled'
                                    )),
    priority                    VARCHAR(20)  NOT NULL DEFAULT 'normal'
                                    CHECK (priority IN (
                                        'low', 'normal', 'high', 'critical', 'emergency'
                                    )),

    -- Override
    override_reason_code        VARCHAR(30),
    override_notes              TEXT,
    override_by                 UUID         REFERENCES users(id),
    override_at                 TIMESTAMPTZ,
    previous_assignee           JSONB,
    CONSTRAINT chk_task_override_reason CHECK (
        override_reason_code IS NULL OR override_reason_code IN (
            'workload', 'specialization', 'area_familiarity',
            'emergency', 'relationship', 'performance',
            'availability', 'tender_linked', 'other'
        )
    ),

    -- Timing
    due_at                      TIMESTAMPTZ,
    started_at                  TIMESTAMPTZ,
    completed_at                TIMESTAMPTZ,

    -- Evidence (GCS URLs)
    before_photos               JSONB        NOT NULL DEFAULT '[]',
    after_photos                JSONB        NOT NULL DEFAULT '[]',
    progress_photos             JSONB        NOT NULL DEFAULT '[]',
    completion_notes            TEXT,
    completion_location         GEOMETRY(POINT, 4326),

    agent_summary               TEXT,

    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tasks IS
    'One task per workflow step instance per department.
     Worker/contractor uploads before_photos, progress_photos, after_photos to GCS;
     URLs stored in JSONB. override_reason_code is CHECK-constrained at DB level
     (same values as workflow_step_instances for consistency).
     "other" requires override_notes — enforced in API layer.';

-- ── 7.1 Task Status History (range-partitioned — Layer 17) ───────
CREATE TABLE task_status_history (
    id          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    task_id     UUID         NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    old_status  VARCHAR(30),
    new_status  VARCHAR(30)  NOT NULL,
    changed_by  UUID         REFERENCES users(id),
    reason      TEXT,
    metadata    JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);


-- ============================================================
-- 8. EMERGENCY POST-HOC TASKS
-- ============================================================

CREATE TABLE emergency_posthoc_tasks (
    id                          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_instance_id        UUID         NOT NULL
                                    REFERENCES workflow_instances(id) ON DELETE CASCADE,
    complaint_id                UUID         NOT NULL,  -- app-layer enforced
    original_template_step_id  UUID         NOT NULL
                                    REFERENCES workflow_template_steps(id),
    step_number                 INTEGER      NOT NULL,
    step_name                   VARCHAR(300) NOT NULL,
    department_id               UUID         NOT NULL REFERENCES departments(id),
    assigned_official_id        UUID         REFERENCES users(id),

    documentation_type          VARCHAR(50)  NOT NULL
                                    CHECK (documentation_type IN (
                                        'site_photos',
                                        'inspection_report',
                                        'safety_clearance',
                                        'material_certificate',
                                        'noc',
                                        'completion_report',
                                        'other'
                                    )),
    instructions                TEXT         NOT NULL,
    is_mandatory                BOOLEAN      NOT NULL DEFAULT TRUE,

    status                      VARCHAR(30)  NOT NULL DEFAULT 'pending'
                                    CHECK (status IN (
                                        'pending',
                                        'in_progress',
                                        'completed',
                                        'waived'     -- super_admin only, reason mandatory
                                    )),
    waived_by                   UUID         REFERENCES users(id),
    waived_reason               TEXT,

    -- [{url, gcs_path, mime_type, uploaded_by, uploaded_at, description}]
    uploaded_documents          JSONB        NOT NULL DEFAULT '[]',
    completion_notes            TEXT,

    due_within_hours            INTEGER      NOT NULL DEFAULT 48,
    emergency_bypass_at         TIMESTAMPTZ  NOT NULL,
    -- Set at INSERT time by the bypass handler:
    --   due_at = emergency_bypass_at + (due_within_hours * interval '1 hour')
    -- Cannot be GENERATED: PostgreSQL rejects interval arithmetic on column
    -- references as non-immutable in generated column expressions.
    due_at                      TIMESTAMPTZ  NOT NULL,
    completed_at                TIMESTAMPTZ,

    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE emergency_posthoc_tasks IS
    'Auto-generated when emergency bypass fires on a workflow_instance.
     One row per bypassed non-optional step.
     due_at set at INSERT time by bypass handler:
       due_at = emergency_bypass_at + (due_within_hours * interval ''1 hour'')
     Cannot be a GENERATED column: PostgreSQL disallows interval arithmetic
     on other column references in generated expressions (not immutable).
     Complaint cannot be fully closed until all non-waived posthoc tasks complete.
     Only super_admin can waive; waived_reason is mandatory.
     Cloud Tasks job (CHECK_POSTHOC_DEADLINE) monitors overdue rows
     and escalates to super_admin via Pub/Sub event.';


-- ============================================================
-- 9. TENDERS
-- ============================================================

CREATE TABLE tenders (
    id                          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_number               VARCHAR(30)   NOT NULL UNIQUE,  -- TND-DEL-2025-000123
    department_id               UUID          NOT NULL REFERENCES departments(id),
    workflow_step_instance_id   UUID          REFERENCES workflow_step_instances(id),
    complaint_id                UUID,         -- app-layer enforced (partitioned)
    requested_by                UUID          NOT NULL REFERENCES users(id),
    title                       VARCHAR(500)  NOT NULL,
    description                 TEXT,
    scope_of_work               TEXT,
    estimated_cost              NUMERIC(15,2),
    final_cost                  NUMERIC(15,2),
    status                      VARCHAR(30)   NOT NULL DEFAULT 'draft'
                                    CHECK (status IN (
                                        'draft', 'submitted', 'under_review',
                                        'approved', 'rejected', 'awarded',
                                        'in_progress', 'completed', 'cancelled'
                                    )),
    approved_by                 UUID          REFERENCES users(id),
    rejected_by                 UUID          REFERENCES users(id),
    awarded_to_contractor_id    UUID          REFERENCES contractors(id),
    -- [{name, url, gcs_path, uploaded_at, uploaded_by}]
    documents                   JSONB         NOT NULL DEFAULT '[]',
    approval_notes              TEXT,
    rejection_reason            TEXT,
    submitted_at                TIMESTAMPTZ,
    approved_at                 TIMESTAMPTZ,
    awarded_at                  TIMESTAMPTZ,
    due_date                    DATE,
    created_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tenders IS
    'Full tender lifecycle: draft → submitted → super_admin approval → awarded.
     Step is blocked until tender status = awarded.
     Documents stored in GCS (Cloud Storage); URLs in JSONB.';


-- ============================================================
-- 10. SURVEYS
-- ============================================================

CREATE TABLE survey_templates (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(300) NOT NULL,
    survey_type         VARCHAR(30)  NOT NULL
                            CHECK (survey_type IN (
                                'midway',           -- auto at ~50% workflow steps
                                'completion',       -- auto at workflow resolved
                                'worker_feedback'   -- to worker about the job
                            )),
    -- Trigger midway survey when this % of steps are complete
    trigger_at_step_pct SMALLINT     DEFAULT 50
                            CHECK (trigger_at_step_pct BETWEEN 1 AND 99),
    -- [{id, text, type: 'rating'|'text'|'boolean', required: true|false}]
    questions           JSONB        NOT NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by          UUID         REFERENCES users(id),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE survey_templates IS
    'Survey config. Agent autonomously triggers:
     - midway: to citizens when workflow reaches trigger_at_step_pct
     - completion: to citizens after workflow resolves
     - worker_feedback: to workers/contractors after their task completes
     Dispatch goes through Cloud Tasks queue (scheduled) → Cloud Run → Twilio/email.';

CREATE TABLE survey_instances (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id             UUID         NOT NULL REFERENCES survey_templates(id),
    workflow_instance_id    UUID         REFERENCES workflow_instances(id),
    complaint_id            UUID,        -- app-layer enforced
    survey_type             VARCHAR(30)  NOT NULL,
    target_user_id          UUID         NOT NULL REFERENCES users(id),
    target_role             VARCHAR(30)  NOT NULL,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                CHECK (status IN (
                                    'pending', 'sent', 'opened', 'completed', 'expired'
                                )),
    triggered_by            VARCHAR(20)  NOT NULL DEFAULT 'agent',
    channel                 VARCHAR(20)  NOT NULL DEFAULT 'whatsapp'
                                CHECK (channel IN ('whatsapp', 'email', 'portal', 'sms')),
    triggered_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    sent_at                 TIMESTAMPTZ,
    opened_at               TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE survey_responses (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_instance_id  UUID         NOT NULL REFERENCES survey_instances(id),
    respondent_id       UUID         NOT NULL REFERENCES users(id),
    -- [{question_id, answer}]
    answers             JSONB        NOT NULL,
    -- Extracted from answers for fast KPI aggregation
    overall_rating      NUMERIC(3,1) CHECK (overall_rating BETWEEN 1 AND 5),
    feedback_text       TEXT,
    submitted_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE survey_responses IS
    'overall_rating extracted from answers and stored flat.
     Feeds directly into official_performance_snapshots and
     contractor_performance_snapshots (computed nightly by Cloud Scheduler).';


-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================

-- ── 11.1 Notification Templates ─────────────────────────────────
CREATE TABLE notification_templates (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(300) NOT NULL,
    event_type      VARCHAR(100) NOT NULL,
    -- Event types: COMPLAINT_RECEIVED | COMPLAINT_CLUSTERED | WORKFLOW_STARTED |
    --   TASK_ASSIGNED | TASK_STARTED | TASK_COMPLETED | STEP_CONSTRAINT_BLOCKED |
    --   DELAY_ALERT | SURVEY_MIDWAY | SURVEY_END | EMERGENCY_BYPASS |
    --   TENDER_APPROVED | TENDER_REJECTED | REPEAT_COMPLAINT_ESCALATED
    channel         VARCHAR(30)  NOT NULL
                        CHECK (channel IN ('email', 'twilio_sms', 'twilio_whatsapp')),
    language        VARCHAR(10)  NOT NULL DEFAULT 'hi',
    subject_template TEXT,                        -- email only; {{variable}} syntax
    body_template   TEXT         NOT NULL,        -- {{complaint_number}}, {{status}}, etc.
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (event_type, channel, language)
);

COMMENT ON TABLE notification_templates IS
    'Config store for all notification content.
     Dispatcher resolves: event_type + channel + user.preferred_language → template.
     Falls back to English if no language match.
     Channels: Twilio (WhatsApp + SMS) + email (SendGrid or GCP Cloud SMTP).';

-- ── 11.2 Notification Logs (range-partitioned — Layer 17) ────────
CREATE TABLE notification_logs (
    id                      UUID         NOT NULL DEFAULT uuid_generate_v4(),
    template_id             UUID         REFERENCES notification_templates(id),
    recipient_user_id       UUID         NOT NULL REFERENCES users(id),
    recipient_contact       VARCHAR(255) NOT NULL,
    channel                 VARCHAR(30)  NOT NULL,
    event_type              VARCHAR(100) NOT NULL,
    complaint_id            UUID,
    task_id                 UUID         REFERENCES tasks(id),
    survey_instance_id      UUID         REFERENCES survey_instances(id),
    payload                 JSONB        NOT NULL DEFAULT '{}',
    status                  VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                CHECK (status IN (
                                    'pending', 'sent', 'delivered', 'failed', 'bounced'
                                )),
    -- Twilio MessageSID or email provider message ID
    external_message_id     VARCHAR(255),
    error_message           TEXT,
    sent_at                 TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

COMMENT ON TABLE notification_logs IS
    'Delivery receipt store. Append-only.
     Twilio webhook → Cloud Run handler → UPDATE status + delivered_at.
     email bounces handled via SendGrid webhook → same handler.
     Partitioned monthly — keeps query performance stable over years.';

-- ── 11.3 Area Notification Subscriptions ────────────────────────
CREATE TABLE area_notification_subscriptions (
    id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location            GEOMETRY(POINT, 4326) NOT NULL,
    radius_meters       INTEGER       NOT NULL DEFAULT 5000,
    preferred_channels  TEXT[]        NOT NULL DEFAULT ARRAY['email','twilio_whatsapp'],
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE area_notification_subscriptions IS
    'Citizen opt-in for area-wide alerts within radius_meters of their location.
     fn_get_area_subscribers(point, radius) queries this via ST_DWithin GIST index.
     Called by notification dispatcher after any workflow status change.
     Respects user.twilio_opt_in and user.email_opt_in (app layer).';


-- ============================================================
-- 12. GCP INTEGRATION
-- ============================================================

-- ── 12.1 Pub/Sub Event Log ───────────────────────────────────────
-- Durable receipt for every event published to GCP Pub/Sub.
-- The DB is not the message broker — Pub/Sub is. This table is the audit log.
CREATE TABLE pubsub_event_log (
    id                      UUID         NOT NULL DEFAULT uuid_generate_v4(),
    event_type              VARCHAR(100) NOT NULL,
    -- GCP Pub/Sub metadata
    pubsub_topic            VARCHAR(300),  -- projects/{proj}/topics/{topic}
    pubsub_message_id       VARCHAR(200),  -- GCP-assigned message ID
    published_at            TIMESTAMPTZ,
    ack_at                  TIMESTAMPTZ,
    -- Full event payload as published
    payload                 JSONB        NOT NULL DEFAULT '{}',
    -- Entity references for DB-side queries
    city_id                 UUID         REFERENCES cities(id),
    complaint_id            UUID,         -- no FK: partitioned table
    workflow_instance_id    UUID         REFERENCES workflow_instances(id),
    task_id                 UUID         REFERENCES tasks(id),
    user_id                 UUID         REFERENCES users(id),
    -- Processing
    processed_by            VARCHAR(200), -- Cloud Run service name
    processing_status       VARCHAR(20)  NOT NULL DEFAULT 'published'
                                CHECK (processing_status IN (
                                    'published', 'processing',
                                    'processed', 'failed', 'dead_lettered'
                                )),
    retry_count             SMALLINT     NOT NULL DEFAULT 0,
    error_message           TEXT,
    processed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

COMMENT ON TABLE pubsub_event_log IS
    'GCP Pub/Sub architecture:
     1. Domain Cloud Run service writes to domain table
     2. Same service publishes event to Pub/Sub topic
     3. pubsub_event_log row written as durable receipt
     4. Downstream consumers subscribe independently:
          notification-service → ps-crm-notifications topic
          agent-service        → ps-crm-agent topic
          workflow-engine      → ps-crm-workflow topic
          kpi-service          → ps-crm-kpi topic

     Suggested topics:
       ps-crm-complaints     complaint lifecycle
       ps-crm-workflow       workflow + step events
       ps-crm-tasks          task events
       ps-crm-surveys        survey trigger / response
       ps-crm-notifications  notification dispatch requests
       ps-crm-agent          agent input / output

     dead_lettered rows → GCP dead-letter topic → Cloud Monitoring alert.
     This table enables full event replay for debugging and ops audit.';

-- ── 12.2 Cloud Tasks Schedule ────────────────────────────────────
-- Registry of every GCP Cloud Tasks job created.
-- Cloud Tasks has no native "list all pending tasks" API — this fills that gap.
CREATE TABLE cloud_task_schedule (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- projects/{proj}/locations/{region}/queues/{queue}/tasks/{name}
    cloud_task_name         VARCHAR(500) NOT NULL UNIQUE,
    queue_name              VARCHAR(200) NOT NULL,
    -- Queues:
    --   ps-crm-notifications    Twilio + email dispatch
    --   ps-crm-surveys          survey sends (delayed after step complete)
    --   ps-crm-kpi              nightly snapshot jobs
    --   ps-crm-overdue-checks   scan overdue tasks / posthoc tasks
    --   ps-crm-escalations      auto-escalation after SLA breach
    task_type               VARCHAR(100) NOT NULL,
    -- Task types:
    --   SEND_NOTIFICATION | TRIGGER_SURVEY | COMPUTE_KPI_SNAPSHOT |
    --   CHECK_OVERDUE_TASKS | ESCALATE_COMPLAINT | SEND_DELAY_ALERT |
    --   EXPIRE_SURVEY | CHECK_POSTHOC_DEADLINE | CREATE_NEXT_PARTITION
    complaint_id            UUID,
    workflow_instance_id    UUID         REFERENCES workflow_instances(id),
    task_id                 UUID         REFERENCES tasks(id),
    survey_instance_id      UUID         REFERENCES survey_instances(id),
    target_user_id          UUID         REFERENCES users(id),
    payload                 JSONB        NOT NULL DEFAULT '{}',
    scheduled_for           TIMESTAMPTZ  NOT NULL,
    schedule_delay_seconds  INTEGER      NOT NULL DEFAULT 0,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'scheduled'
                                CHECK (status IN (
                                    'scheduled', 'executing',
                                    'completed', 'failed', 'cancelled'
                                )),
    retry_count             SMALLINT     NOT NULL DEFAULT 0,
    error_message           TEXT,
    executed_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cloud_task_schedule IS
    'Registry of every GCP Cloud Tasks job we create.
     Usage patterns:
       Survey 24h after workflow midpoint:
         task_type = TRIGGER_SURVEY, schedule_delay_seconds = 86400
       Overdue check 2h after task.due_at:
         task_type = CHECK_OVERDUE_TASKS, scheduled_for = task.due_at + 2h
       Delay alert if step not started within expected_duration_hours:
         task_type = SEND_DELAY_ALERT, target_user_id = citizens in 5km
       Nightly KPI snapshot:
         task_type = COMPUTE_KPI_SNAPSHOT, scheduled_for = next midnight
       Posthoc deadline check:
         task_type = CHECK_POSTHOC_DEADLINE, scheduled_for = posthoc_task.due_at
       Monthly partition creation:
         task_type = CREATE_NEXT_PARTITION, scheduled_for = 25th of month';


-- ============================================================
-- 13. AGENT LOGS
-- ============================================================

CREATE TABLE agent_logs (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type              VARCHAR(60)  NOT NULL
                                CHECK (agent_type IN (
                                    'INGESTION',
                                    'CLUSTERING',
                                    'DEPT_MAPPER',
                                    'WORKFLOW_ENGINE',
                                    'SURVEY_TRIGGER',
                                    'SUMMARY_GENERATOR',
                                    'PRIORITY_SCORER',
                                    'NOTIFICATION_DISPATCHER',
                                    'ESCALATION_DETECTOR',
                                    'REPEAT_CHECKER'
                                )),
    complaint_id            UUID,
    workflow_instance_id    UUID         REFERENCES workflow_instances(id),
    task_id                 UUID         REFERENCES tasks(id),
    input_data              JSONB        NOT NULL DEFAULT '{}',
    output_data             JSONB        NOT NULL DEFAULT '{}',
    action_taken            VARCHAR(300),
    confidence_score        NUMERIC(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
    human_overridden        BOOLEAN      NOT NULL DEFAULT FALSE,
    override_by             UUID         REFERENCES users(id),
    override_reason         TEXT,
    latency_ms              INTEGER,
    model_used              VARCHAR(100),
    tokens_used             INTEGER,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE agent_logs IS
    'Append-only log of every agentic action. Enables model performance tracking,
     override pattern analysis, and full explainability audit trail.
     REPEAT_CHECKER agent type added for fn_check_repeat_complaint() calls.
     human_overridden = TRUE flags cases where official rejected agent suggestion.';


-- ============================================================
-- 14. PUBLIC DASHBOARD & ANNOUNCEMENTS
-- ============================================================

CREATE TABLE public_announcements (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id                 UUID         NOT NULL REFERENCES cities(id),
    jurisdiction_id         UUID         REFERENCES jurisdictions(id),
    infra_node_id           UUID         REFERENCES infra_nodes(id),
    workflow_instance_id    UUID         REFERENCES workflow_instances(id),
    title                   VARCHAR(500) NOT NULL,
    content                 TEXT         NOT NULL,
    work_type               VARCHAR(100),
    affected_area           GEOMETRY(POLYGON, 4326),
    status                  VARCHAR(30)  NOT NULL,
    expected_start_date     DATE,
    expected_end_date       DATE,
    actual_end_date         DATE,
    is_published            BOOLEAN      NOT NULL DEFAULT FALSE,
    published_at            TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    created_by              UUID         REFERENCES users(id),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public_announcements IS
    'Public-facing work announcements on the citizen map.
     Auto-draft created by agent when workflow starts; admin publishes.
     affected_area polygon enables "show work near me" on the public portal.
     Expired or completed announcements filtered out by v_public_complaint_map.';


-- ============================================================
-- 15. KPI SNAPSHOTS
-- ============================================================

-- Written nightly by Cloud Scheduler → Cloud Run kpi-service
CREATE TABLE official_performance_snapshots (
    id                      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    official_id             UUID          NOT NULL REFERENCES users(id),
    department_id           UUID          REFERENCES departments(id),
    snapshot_date           DATE          NOT NULL,
    tasks_assigned          INTEGER       NOT NULL DEFAULT 0,
    tasks_completed         INTEGER       NOT NULL DEFAULT 0,
    tasks_overdue           INTEGER       NOT NULL DEFAULT 0,
    avg_resolution_hours    NUMERIC(8,2),
    avg_survey_rating       NUMERIC(4,2),
    override_count          INTEGER       NOT NULL DEFAULT 0,
    -- Breakdown by reason_code for analytics
    override_reason_breakdown JSONB       NOT NULL DEFAULT '{}',
    complaints_handled      INTEGER       NOT NULL DEFAULT 0,
    emergency_bypasses      INTEGER       NOT NULL DEFAULT 0,
    posthoc_tasks_pending   INTEGER       NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (official_id, snapshot_date)
);

CREATE TABLE contractor_performance_snapshots (
    id                      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    contractor_id           UUID          NOT NULL REFERENCES contractors(id),
    snapshot_date           DATE          NOT NULL,
    tasks_completed         INTEGER       NOT NULL DEFAULT 0,
    tasks_overdue           INTEGER       NOT NULL DEFAULT 0,
    avg_completion_hours    NUMERIC(8,2),
    avg_survey_rating       NUMERIC(4,2),
    tenders_won             INTEGER       NOT NULL DEFAULT 0,
    tenders_applied         INTEGER       NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (contractor_id, snapshot_date)
);

COMMENT ON TABLE official_performance_snapshots IS
    'Nightly materialized KPI per official.
     override_reason_breakdown: {"workload": 3, "relationship": 5, "other": 1}
     — surfaced as a bar chart on super_admin dashboard.
     High emergency_bypasses or "other"/"relationship" override rates trigger alerts.
     posthoc_tasks_pending: count of overdue posthoc tasks under this official.';


-- ============================================================
-- 16. DEFERRED FKs
-- ============================================================

-- complaints → workflow_instances
ALTER TABLE complaints
    ADD CONSTRAINT fk_complaint_workflow_instance
    FOREIGN KEY (workflow_instance_id)
    REFERENCES workflow_instances(id)
    ON DELETE SET NULL
    NOT VALID;  -- NOT VALID: existing partitions validated async; new rows enforced

-- infra_nodes → workflow_instances (last resolved)
ALTER TABLE infra_nodes
    ADD CONSTRAINT fk_infra_last_resolved_workflow
    FOREIGN KEY (last_resolved_workflow_id)
    REFERENCES workflow_instances(id)
    ON DELETE SET NULL;

COMMENT ON CONSTRAINT fk_infra_last_resolved_workflow ON infra_nodes IS
    'Updated by WORKFLOW_ENGINE on workflow completion.
     Drives fn_check_repeat_complaint() for the repeat escalation rule.';


-- ============================================================
-- 17. PARTITIONED CHILD TABLES (2025 + 2026 pre-created)
-- ============================================================
-- Cloud Tasks CREATE_NEXT_PARTITION job runs on the 25th of each month
-- to create the following month partition before it is needed.
-- Tables partitioned: complaints, complaint_status_history,
--                     task_status_history, notification_logs, pubsub_event_log

-- ── complaints ───────────────────────────────────────────────────
CREATE TABLE complaints_2025_01 PARTITION OF complaints
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE complaints_2025_02 PARTITION OF complaints
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE complaints_2025_03 PARTITION OF complaints
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
CREATE TABLE complaints_2025_04 PARTITION OF complaints
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
CREATE TABLE complaints_2025_05 PARTITION OF complaints
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
CREATE TABLE complaints_2025_06 PARTITION OF complaints
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE complaints_2025_07 PARTITION OF complaints
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE complaints_2025_08 PARTITION OF complaints
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE complaints_2025_09 PARTITION OF complaints
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE complaints_2025_10 PARTITION OF complaints
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE complaints_2025_11 PARTITION OF complaints
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE complaints_2025_12 PARTITION OF complaints
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
CREATE TABLE complaints_2026_01 PARTITION OF complaints
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE complaints_2026_02 PARTITION OF complaints
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE complaints_2026_03 PARTITION OF complaints
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE complaints_2026_04 PARTITION OF complaints
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE complaints_2026_05 PARTITION OF complaints
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE complaints_2026_06 PARTITION OF complaints
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE complaints_2026_default PARTITION OF complaints DEFAULT;

-- ── complaint_status_history ─────────────────────────────────────
CREATE TABLE csh_2025 PARTITION OF complaint_status_history
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE csh_2026 PARTITION OF complaint_status_history
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE csh_default PARTITION OF complaint_status_history DEFAULT;

-- ── task_status_history ──────────────────────────────────────────
CREATE TABLE tsh_2025 PARTITION OF task_status_history
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE tsh_2026 PARTITION OF task_status_history
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE tsh_default PARTITION OF task_status_history DEFAULT;

-- ── notification_logs ────────────────────────────────────────────
CREATE TABLE nl_2025 PARTITION OF notification_logs
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE nl_2026 PARTITION OF notification_logs
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE nl_default PARTITION OF notification_logs DEFAULT;

-- ── pubsub_event_log ─────────────────────────────────────────────
CREATE TABLE pel_2025 PARTITION OF pubsub_event_log
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE pel_2026 PARTITION OF pubsub_event_log
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE pel_default PARTITION OF pubsub_event_log DEFAULT;


-- ============================================================
-- 18. INDEXES
-- ============================================================

-- ── Jurisdictions ────────────────────────────────────────────────
CREATE INDEX idx_jurisdictions_boundary ON jurisdictions USING GIST(boundary);
CREATE INDEX idx_jurisdictions_city     ON jurisdictions(city_id);
CREATE INDEX idx_jurisdictions_parent   ON jurisdictions(parent_id);

-- ── Workflow Constraints ─────────────────────────────────────────
CREATE INDEX idx_wc_city_active ON workflow_constraints(city_id)
    WHERE is_active = TRUE;
CREATE INDEX idx_wc_jurisdiction ON workflow_constraints(jurisdiction_id);

-- ── Users ────────────────────────────────────────────────────────
CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_users_city       ON users(city_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_phone      ON users(phone);
CREATE INDEX idx_users_auth_uid   ON users(auth_uid) WHERE auth_uid IS NOT NULL;

-- ── Contractors / Workers ────────────────────────────────────────
CREATE INDEX idx_contractors_city      ON contractors(city_id);
CREATE INDEX idx_contractors_available ON contractors(city_id)
    WHERE is_blacklisted = FALSE;
CREATE INDEX idx_workers_department    ON workers(department_id);
CREATE INDEX idx_workers_available     ON workers(is_available)
    WHERE is_available = TRUE;

-- ── Infra Nodes ──────────────────────────────────────────────────
CREATE INDEX idx_infra_nodes_location       ON infra_nodes USING GIST(location);
CREATE INDEX idx_infra_nodes_city           ON infra_nodes(city_id);
CREATE INDEX idx_infra_nodes_type           ON infra_nodes(infra_type_id);
CREATE INDEX idx_infra_nodes_last_resolved  ON infra_nodes(last_resolved_at)
    WHERE last_resolved_at IS NOT NULL;
-- Composite for repeat-complaint check (one index scan at ingestion)
CREATE INDEX idx_infra_nodes_repeat_check   ON infra_nodes(infra_type_id, last_resolved_at)
    WHERE last_resolved_at IS NOT NULL;

-- ── Asset Health Logs ────────────────────────────────────────────
-- BRIN: append-only table, no random updates
CREATE INDEX idx_ahl_node_time ON asset_health_logs
    USING BRIN(infra_node_id, computed_at);

-- ── Complaints (parent — indexes propagate to partitions) ────────
CREATE INDEX idx_complaints_location     ON complaints USING GIST(location);
CREATE INDEX idx_complaints_citizen      ON complaints(citizen_id);
CREATE INDEX idx_complaints_status       ON complaints(status);
CREATE INDEX idx_complaints_infra_node   ON complaints(infra_node_id);
CREATE INDEX idx_complaints_jurisdiction ON complaints(jurisdiction_id);
CREATE INDEX idx_complaints_priority     ON complaints(priority)
    WHERE priority IN ('critical','emergency');
-- Partial index: repeat complaints (small, fast)
CREATE INDEX idx_complaints_is_repeat    ON complaints(infra_node_id, created_at)
    WHERE is_repeat_complaint = TRUE;
-- Partial index: emergencies
CREATE INDEX idx_complaints_emergency    ON complaints(city_id, created_at)
    WHERE is_emergency = TRUE;
-- IVFFlat for Nomic vector similarity (semantic dedup + clustering)
CREATE INDEX idx_complaints_text_embed   ON complaints
    USING ivfflat(text_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_complaints_image_embed  ON complaints
    USING ivfflat(image_embedding vector_cosine_ops) WITH (lists = 100);
-- BRIN on created_at (partition boundary scans)
CREATE INDEX idx_complaints_created_brin ON complaints USING BRIN(created_at);

-- ── Complaint Clusters ───────────────────────────────────────────
CREATE INDEX idx_clusters_infra_node ON complaint_clusters(infra_node_id);
CREATE INDEX idx_ccm_complaint       ON complaint_cluster_members(complaint_id);

-- ── Workflow Templates / Versions ────────────────────────────────
CREATE INDEX idx_wtv_template         ON workflow_template_versions(template_id);
CREATE INDEX idx_wtv_latest           ON workflow_template_versions(city_id, infra_type_id)
    WHERE is_latest_version = TRUE AND is_active = TRUE;
CREATE INDEX idx_wtv_jurisdiction     ON workflow_template_versions(jurisdiction_id);
CREATE INDEX idx_wts_version          ON workflow_template_steps(version_id);

-- ── Workflow Instances ───────────────────────────────────────────
CREATE INDEX idx_wi_infra_node   ON workflow_instances(infra_node_id);
CREATE INDEX idx_wi_status       ON workflow_instances(status)
    WHERE status = 'active';
CREATE INDEX idx_wi_version      ON workflow_instances(version_id);

-- ── Workflow Step Instances ──────────────────────────────────────
CREATE INDEX idx_wsi_workflow    ON workflow_step_instances(workflow_instance_id);
CREATE INDEX idx_wsi_status      ON workflow_step_instances(status);
CREATE INDEX idx_wsi_official    ON workflow_step_instances(assigned_official_id);
CREATE INDEX idx_wsi_dept        ON workflow_step_instances(department_id);
CREATE INDEX idx_wsi_unlocked    ON workflow_step_instances(workflow_instance_id)
    WHERE status = 'unlocked';

-- ── Tasks ────────────────────────────────────────────────────────
CREATE INDEX idx_tasks_worker      ON tasks(assigned_worker_id);
CREATE INDEX idx_tasks_contractor  ON tasks(assigned_contractor_id);
CREATE INDEX idx_tasks_official    ON tasks(assigned_official_id);
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_tasks_department  ON tasks(department_id);
CREATE INDEX idx_tasks_due         ON tasks(due_at)
    WHERE status NOT IN ('completed','cancelled');
CREATE INDEX idx_tasks_priority    ON tasks(priority)
    WHERE priority IN ('critical','emergency');

-- ── Emergency Posthoc Tasks ──────────────────────────────────────
CREATE INDEX idx_ept_workflow   ON emergency_posthoc_tasks(workflow_instance_id);
CREATE INDEX idx_ept_official   ON emergency_posthoc_tasks(assigned_official_id);
CREATE INDEX idx_ept_pending    ON emergency_posthoc_tasks(due_at)
    WHERE status = 'pending';

-- ── Tenders ──────────────────────────────────────────────────────
CREATE INDEX idx_tenders_department ON tenders(department_id);
CREATE INDEX idx_tenders_status     ON tenders(status);
CREATE INDEX idx_tenders_contractor ON tenders(awarded_to_contractor_id);

-- ── Surveys ──────────────────────────────────────────────────────
CREATE INDEX idx_si_workflow    ON survey_instances(workflow_instance_id);
CREATE INDEX idx_si_user        ON survey_instances(target_user_id);
CREATE INDEX idx_si_pending     ON survey_instances(triggered_at)
    WHERE status = 'pending';
CREATE INDEX idx_sr_instance    ON survey_responses(survey_instance_id);

-- ── Notifications ────────────────────────────────────────────────
CREATE INDEX idx_nt_event_channel_lang
    ON notification_templates(event_type, channel, language);
CREATE INDEX idx_nl_recipient   ON notification_logs(recipient_user_id);
CREATE INDEX idx_nl_status      ON notification_logs(status)
    WHERE status IN ('pending','failed');
-- BRIN for append-only time queries
CREATE INDEX idx_nl_created_brin ON notification_logs USING BRIN(created_at);
CREATE INDEX idx_ans_location    ON area_notification_subscriptions USING GIST(location);
CREATE INDEX idx_ans_user        ON area_notification_subscriptions(user_id);
CREATE INDEX idx_ans_active      ON area_notification_subscriptions(is_active)
    WHERE is_active = TRUE;

-- ── Pub/Sub Event Log ────────────────────────────────────────────
CREATE INDEX idx_pel_event_type  ON pubsub_event_log(event_type);
CREATE INDEX idx_pel_workflow    ON pubsub_event_log(workflow_instance_id);
CREATE INDEX idx_pel_status      ON pubsub_event_log(processing_status)
    WHERE processing_status IN ('published','failed');
CREATE INDEX idx_pel_created_brin ON pubsub_event_log USING BRIN(created_at);

-- ── Cloud Tasks ──────────────────────────────────────────────────
CREATE INDEX idx_cts_scheduled   ON cloud_task_schedule(scheduled_for)
    WHERE status = 'scheduled';
CREATE INDEX idx_cts_task_type   ON cloud_task_schedule(task_type);

-- ── Agent Logs ───────────────────────────────────────────────────
CREATE INDEX idx_al_type         ON agent_logs(agent_type);
CREATE INDEX idx_al_created_brin ON agent_logs USING BRIN(created_at);
CREATE INDEX idx_al_overridden   ON agent_logs(agent_type, created_at)
    WHERE human_overridden = TRUE;

-- ── Public Announcements ─────────────────────────────────────────
CREATE INDEX idx_pa_affected_area ON public_announcements USING GIST(affected_area);
CREATE INDEX idx_pa_published     ON public_announcements(city_id, is_published, expires_at);

-- ── KPI Snapshots ────────────────────────────────────────────────
CREATE INDEX idx_ops_official     ON official_performance_snapshots(official_id);
CREATE INDEX idx_ops_dept_date    ON official_performance_snapshots(department_id, snapshot_date DESC);
CREATE INDEX idx_cps_contractor   ON contractor_performance_snapshots(contractor_id);


-- ============================================================
-- 19. TRIGGERS (updated_at)
-- ============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'cities', 'jurisdictions', 'workflow_constraints',
        'departments', 'users', 'contractors', 'workers',
        'infra_nodes', 'complaint_clusters',
        'workflow_instances', 'workflow_step_instances',
        'tasks', 'tenders', 'area_notification_subscriptions',
        'public_announcements', 'emergency_posthoc_tasks'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%1$s_updated_at
             BEFORE UPDATE ON %1$s
             FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at()',
            tbl
        );
    END LOOP;
END;
$$;

-- ── Worker task count trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_worker_task_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Increment on assignment
    IF TG_OP = 'UPDATE'
       AND NEW.assigned_worker_id IS NOT NULL
       AND (OLD.assigned_worker_id IS DISTINCT FROM NEW.assigned_worker_id
            OR OLD.status = 'pending') THEN
        UPDATE workers
           SET current_task_count = current_task_count + 1
         WHERE id = NEW.assigned_worker_id;
    END IF;
    -- Decrement on completion/cancellation
    IF TG_OP = 'UPDATE'
       AND OLD.assigned_worker_id IS NOT NULL
       AND NEW.status IN ('completed','cancelled','rejected') THEN
        UPDATE workers
           SET current_task_count = GREATEST(0, current_task_count - 1)
         WHERE id = OLD.assigned_worker_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_task_worker_count
    AFTER UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION fn_update_worker_task_count();

-- ── Update infra_node on workflow completion ─────────────────────
-- Sets last_resolved_at and increments total_resolved_count
CREATE OR REPLACE FUNCTION fn_update_infra_on_workflow_complete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE infra_nodes
           SET last_resolved_at        = NOW(),
               last_resolved_workflow_id = NEW.id,
               total_resolved_count    = total_resolved_count + 1,
               status                  = 'operational'
         WHERE id = NEW.infra_node_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_workflow_complete_infra
    AFTER UPDATE ON workflow_instances
    FOR EACH ROW EXECUTE FUNCTION fn_update_infra_on_workflow_complete();

COMMENT ON FUNCTION fn_update_infra_on_workflow_complete IS
    'Fires when workflow_instances.status → completed.
     Updates infra_nodes.last_resolved_at — this is the value that
     fn_check_repeat_complaint() reads at the next complaint ingestion.
     This keeps the repeat detection accurate without any app-layer code.';


-- ============================================================
-- 20. HELPER FUNCTIONS
-- ============================================================

-- ── Sequences for serial numbers ────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS seq_complaint_number START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_task_number      START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_tender_number    START 1 INCREMENT 1;

-- ── Generate complaint number: CRM-DEL-2025-001234 ───────────────
CREATE OR REPLACE FUNCTION fn_generate_complaint_number(
    p_city_code VARCHAR,
    p_year      INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER
)
RETURNS VARCHAR LANGUAGE sql AS $$
    SELECT 'CRM-' || UPPER(p_city_code) || '-' || p_year || '-'
           || LPAD(NEXTVAL('seq_complaint_number')::TEXT, 6, '0');
$$;

CREATE OR REPLACE FUNCTION fn_generate_task_number(
    p_city_code VARCHAR,
    p_year      INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER
)
RETURNS VARCHAR LANGUAGE sql AS $$
    SELECT 'TASK-' || UPPER(p_city_code) || '-' || p_year || '-'
           || LPAD(NEXTVAL('seq_task_number')::TEXT, 6, '0');
$$;

CREATE OR REPLACE FUNCTION fn_generate_tender_number(
    p_city_code VARCHAR,
    p_year      INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER
)
RETURNS VARCHAR LANGUAGE sql AS $$
    SELECT 'TND-' || UPPER(p_city_code) || '-' || p_year || '-'
           || LPAD(NEXTVAL('seq_tender_number')::TEXT, 6, '0');
$$;

-- ── Resolve jurisdiction from PostGIS point ──────────────────────
-- Returns the most specific (smallest area) jurisdiction containing the point
CREATE OR REPLACE FUNCTION fn_resolve_jurisdiction(
    p_point   GEOMETRY(POINT, 4326),
    p_city_id UUID
)
RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT id
    FROM   jurisdictions
    WHERE  city_id = p_city_id
      AND  ST_Contains(boundary, p_point)
    ORDER  BY ST_Area(boundary::geography) ASC
    LIMIT  1;
$$;

COMMENT ON FUNCTION fn_resolve_jurisdiction IS
    'Called at complaint ingestion. Returns the most specific jurisdiction.
     A complaint in Lutyens Delhi (NDMC area) → NDMC jurisdiction_id.
     Same complaint type 2km north (MCD area) → MCD jurisdiction_id.
     Workflow template version is then selected by (infra_type + jurisdiction).';

-- ── Find existing infra node for clustering ──────────────────────
CREATE OR REPLACE FUNCTION fn_find_infra_node_for_cluster(
    p_point         GEOMETRY(POINT, 4326),
    p_infra_type_id UUID,
    p_city_id       UUID
)
RETURNS TABLE(infra_node_id UUID, distance_meters FLOAT) LANGUAGE sql STABLE AS $$
    SELECT  n.id,
            ST_Distance(n.location::geography, p_point::geography) AS distance_meters
    FROM    infra_nodes n
    JOIN    infra_types t ON t.id = n.infra_type_id
    WHERE   n.infra_type_id = p_infra_type_id
      AND   n.city_id       = p_city_id
      AND   n.status        != 'decommissioned'
      AND   ST_DWithin(n.location::geography, p_point::geography, t.cluster_radius_meters)
    ORDER   BY distance_meters ASC
    LIMIT   1;
$$;

COMMENT ON FUNCTION fn_find_infra_node_for_cluster IS
    'Called at ingestion. If result returned → attach complaint to existing node.
     If no result → create new infra_node then attach.
     cluster_radius_meters is per infra_type (road = larger, pole = smaller).';

-- ── Repeat complaint check (core escalation logic) ───────────────
CREATE OR REPLACE FUNCTION fn_check_repeat_complaint(
    p_infra_node_id UUID
)
RETURNS TABLE(
    is_repeat               BOOLEAN,
    previous_resolved_at    TIMESTAMPTZ,
    gap_days                INTEGER,
    last_resolved_workflow_id UUID
) LANGUAGE sql STABLE AS $$
    SELECT
        CASE
            WHEN n.last_resolved_at IS NOT NULL
             AND NOW() - n.last_resolved_at
                 < (t.repeat_alert_years || ' years')::INTERVAL
            THEN TRUE
            ELSE FALSE
        END                             AS is_repeat,
        n.last_resolved_at              AS previous_resolved_at,
        CASE
            WHEN n.last_resolved_at IS NOT NULL
            THEN EXTRACT(DAY FROM NOW() - n.last_resolved_at)::INTEGER
            ELSE NULL
        END                             AS gap_days,
        n.last_resolved_workflow_id
    FROM    infra_nodes  n
    JOIN    infra_types  t ON t.id = n.infra_type_id
    WHERE   n.id = p_infra_node_id;
$$;

COMMENT ON FUNCTION fn_check_repeat_complaint IS
    'Called by INGESTION agent after infra_node is identified.
     If is_repeat = TRUE:
       SET complaints.priority               = ''critical''
       SET complaints.is_repeat_complaint    = TRUE
       SET complaints.repeat_previous_resolved_at = previous_resolved_at
       (repeat_gap_days is GENERATED STORED automatically)
       SET agent_priority_reason = "Same infrastructure reported again after
         X days. Previous resolution on [date]."
     Publish REPEAT_COMPLAINT_ESCALATED event to ps-crm-complaints Pub/Sub topic.
     Threshold comes from infra_types.repeat_alert_years (default 3 years).';

-- ── Resolve best workflow template version ───────────────────────
CREATE OR REPLACE FUNCTION fn_resolve_workflow_version(
    p_infra_type_id  UUID,
    p_jurisdiction_id UUID,
    p_city_id        UUID
)
RETURNS UUID LANGUAGE sql STABLE AS $$
    -- Priority: most specific (type + jurisdiction) → type only → city-wide
    SELECT  v.id
    FROM    workflow_template_versions v
    WHERE   v.city_id          = p_city_id
      AND   v.is_latest_version = TRUE
      AND   v.is_active         = TRUE
      AND   (v.infra_type_id   = p_infra_type_id   OR v.infra_type_id   IS NULL)
      AND   (v.jurisdiction_id = p_jurisdiction_id  OR v.jurisdiction_id IS NULL)
    ORDER BY
        -- Prefer exact type + exact jurisdiction match
        (v.infra_type_id   = p_infra_type_id)::INT   DESC,
        (v.jurisdiction_id = p_jurisdiction_id)::INT  DESC
    LIMIT 1;
$$;

COMMENT ON FUNCTION fn_resolve_workflow_version IS
    'Picks the most specific active workflow version for a new complaint.
     Road complaint in NDMC → version with infra_type=ROAD + jurisdiction=NDMC.
     Road complaint in area with no specific version → falls back to city-wide ROAD version.
     Called by WORKFLOW_ENGINE agent at workflow_instance creation.';

-- ── Check if a step is blocked by active workflow constraints ─────
CREATE OR REPLACE FUNCTION fn_is_step_constraint_blocked(
    p_work_type_codes   TEXT[],
    p_dept_code         VARCHAR,
    p_city_id           UUID,
    p_jurisdiction_id   UUID,
    p_check_date        DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    is_blocked      BOOLEAN,
    constraint_id   UUID,
    blocked_until   DATE,
    block_message   TEXT
) LANGUAGE sql STABLE AS $$
    SELECT
        TRUE,
        wc.id,
        CASE
            WHEN wc.is_recurring_annual THEN
                (DATE_TRUNC('year', p_check_date::TIMESTAMPTZ)
                 + MAKE_INTERVAL(
                     months => wc.end_month - 1,
                     days   => wc.end_day   - 1
                   ))::DATE
            ELSE wc.active_until
        END             AS blocked_until,
        wc.block_message
    FROM   workflow_constraints wc
    WHERE  wc.city_id   = p_city_id
      AND  wc.is_active = TRUE
      AND  (wc.jurisdiction_id IS NULL OR wc.jurisdiction_id = p_jurisdiction_id)
      AND  (wc.affected_dept_codes = '{}'
            OR p_dept_code = ANY(wc.affected_dept_codes))
      AND  (wc.affected_work_type_codes = '{}'
            OR p_work_type_codes && wc.affected_work_type_codes)
      AND  (
              (wc.is_recurring_annual = TRUE
               AND (EXTRACT(MONTH FROM p_check_date) > wc.start_month
                    OR (EXTRACT(MONTH FROM p_check_date) = wc.start_month
                        AND EXTRACT(DAY FROM p_check_date) >= wc.start_day))
               AND (EXTRACT(MONTH FROM p_check_date) < wc.end_month
                    OR (EXTRACT(MONTH FROM p_check_date) = wc.end_month
                        AND EXTRACT(DAY FROM p_check_date) <= wc.end_day))
              )
              OR
              (wc.is_recurring_annual = FALSE
               AND p_check_date BETWEEN wc.active_from AND wc.active_until)
           )
    ORDER BY wc.constraint_type
    LIMIT 1;
$$;

COMMENT ON FUNCTION fn_is_step_constraint_blocked IS
    'Called by WORKFLOW_ENGINE before unlocking any step.
     If is_blocked = TRUE:
       SET workflow_step_instances.status = ''constraint_blocked''
       SET constraint_block_id            = constraint_id
       SET legally_blocked_until          = blocked_until
       Publish STEP_CONSTRAINT_BLOCKED event to ps-crm-workflow topic
     block_message shown verbatim to officials and citizens in portal.';

-- ── Get area notification subscribers ───────────────────────────
CREATE OR REPLACE FUNCTION fn_get_area_subscribers(
    p_point         GEOMETRY(POINT, 4326),
    p_radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE(user_id UUID, preferred_channels TEXT[]) LANGUAGE sql STABLE AS $$
    SELECT  s.user_id, s.preferred_channels
    FROM    area_notification_subscriptions s
    JOIN    users u ON u.id = s.user_id
    WHERE   s.is_active  = TRUE
      AND   u.is_active  = TRUE
      AND   ST_DWithin(s.location::geography, p_point::geography, p_radius_meters);
$$;

-- ── Create next monthly partition (called by Cloud Tasks) ─────────
CREATE OR REPLACE FUNCTION fn_create_next_month_partitions(
    p_target_year  INTEGER,
    p_target_month INTEGER
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_start DATE;
    v_end   DATE;
    v_ym    TEXT;
BEGIN
    v_start := MAKE_DATE(p_target_year, p_target_month, 1);
    v_end   := v_start + INTERVAL '1 month';
    v_ym    := TO_CHAR(v_start, 'YYYY_MM');

    -- complaints
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS complaints_%s
         PARTITION OF complaints
         FOR VALUES FROM (%L) TO (%L)',
        v_ym, v_start, v_end
    );
    -- complaint_status_history (annual partitions are enough but monthly available)
    -- notification_logs
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS nl_%s
         PARTITION OF notification_logs
         FOR VALUES FROM (%L) TO (%L)',
        v_ym, v_start, v_end
    );
    -- pubsub_event_log
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS pel_%s
         PARTITION OF pubsub_event_log
         FOR VALUES FROM (%L) TO (%L)',
        v_ym, v_start, v_end
    );

    RAISE NOTICE 'Created partitions for %', v_ym;
END;
$$;

COMMENT ON FUNCTION fn_create_next_month_partitions IS
    'Called by Cloud Tasks CREATE_NEXT_PARTITION job on the 25th of each month.
     Creates the child partition for the following month across all partitioned tables.
     Idempotent (IF NOT EXISTS). Logs a NOTICE for Cloud Run log ingestion.';


-- ============================================================
-- 21. VIEWS
-- ============================================================
-- DROP first so CREATE OR REPLACE can freely change column layout.
-- CASCADE automatically drops any dependent views.
DROP VIEW IF EXISTS v_missing_embeddings            CASCADE;
DROP VIEW IF EXISTS v_posthoc_task_monitor          CASCADE;
DROP VIEW IF EXISTS v_repeat_complaint_alerts        CASCADE;
DROP VIEW IF EXISTS v_infra_hotspots                CASCADE;
DROP VIEW IF EXISTS v_override_reason_analytics     CASCADE;
DROP VIEW IF EXISTS v_workflow_version_activity     CASCADE;
DROP VIEW IF EXISTS v_active_workflow_constraints   CASCADE;
DROP VIEW IF EXISTS v_pending_surveys               CASCADE;
DROP VIEW IF EXISTS v_contractor_kpi                CASCADE;
DROP VIEW IF EXISTS v_admin_kpi_dashboard           CASCADE;
DROP VIEW IF EXISTS v_official_task_dashboard       CASCADE;
DROP VIEW IF EXISTS v_citizen_complaint_detail      CASCADE;
DROP VIEW IF EXISTS v_public_complaint_map          CASCADE;

-- ── 21.1 Public Complaint Map ────────────────────────────────────
-- Citizen portal + public dashboard map. No PII.
CREATE OR REPLACE VIEW v_public_complaint_map AS
SELECT
    c.id,
    c.complaint_number,
    c.title,
    c.status,
    c.priority,
    c.is_repeat_complaint,
    c.repeat_gap_days,
    ST_AsGeoJSON(c.location)::JSONB                    AS location_geojson,
    c.address_text,
    c.created_at,
    c.resolved_at,
    it.name                                            AS infra_type,
    it.code                                            AS infra_type_code,
    it.icon_url,
    j.name                                             AS jurisdiction_name,
    j.jurisdiction_type,
    wi.current_step_number,
    wi.total_steps,
    CASE WHEN wi.total_steps > 0
         THEN ROUND(wi.current_step_number::NUMERIC / wi.total_steps * 100, 1)
         ELSE 0
    END                                                AS progress_pct,
    wi.status                                          AS workflow_status,
    wi.blocked_until,
    cc.complaint_count                                 AS cluster_complaint_count
FROM        complaints            c
LEFT JOIN   infra_nodes           n   ON n.id  = c.infra_node_id
LEFT JOIN   infra_types           it  ON it.id = n.infra_type_id
LEFT JOIN   jurisdictions         j   ON j.id  = c.jurisdiction_id
LEFT JOIN   workflow_instances    wi  ON wi.id = c.workflow_instance_id
LEFT JOIN   complaint_clusters    cc  ON cc.infra_node_id = c.infra_node_id
WHERE  c.status NOT IN ('rejected', 'closed');

COMMENT ON VIEW v_public_complaint_map IS
    'Read-only, no PII. Powers the public map on the citizen portal.
     is_repeat_complaint + repeat_gap_days surfaced as a badge:
     "⚠ Same issue reported again after X days."
     Filter by geography at app layer: WHERE ST_DWithin(location, :user_point, 5000).';

-- ── 21.2 Citizen Complaint Detail ───────────────────────────────
CREATE OR REPLACE VIEW v_citizen_complaint_detail AS
SELECT
    c.id,
    c.complaint_number,
    c.citizen_id,
    c.title,
    c.description,
    c.status,
    c.priority,
    c.images,
    c.voice_recording_url,
    ST_AsGeoJSON(c.location)::JSONB                    AS location_geojson,
    c.address_text,
    c.agent_summary,
    c.is_repeat_complaint,
    c.repeat_gap_days,
    c.repeat_previous_resolved_at,
    c.is_recomplaint,
    c.parent_complaint_id,
    c.created_at,
    c.resolved_at,
    cc.complaint_count                                 AS cluster_complaint_count,
    wi.status                                          AS workflow_status,
    wi.current_step_number,
    wi.total_steps,
    CASE WHEN wi.total_steps > 0
         THEN ROUND(wi.current_step_number::NUMERIC / wi.total_steps * 100, 1)
         ELSE 0
    END                                                AS progress_pct,
    wi.blocked_until,
    it.name                                            AS infra_type,
    d_step.name                                        AS current_dept_name,
    -- Constraint block message (shown to citizen if step is blocked)
    wc.block_message                                   AS current_block_message,
    latest_task.assigned_worker_name,
    latest_task.assigned_contractor_name,
    latest_task.task_status
FROM        complaints            c
LEFT JOIN   complaint_cluster_members ccm ON ccm.complaint_id = c.id
LEFT JOIN   complaint_clusters        cc  ON cc.id = ccm.cluster_id
LEFT JOIN   workflow_instances        wi  ON wi.id = c.workflow_instance_id
LEFT JOIN   workflow_step_instances   wsi ON wsi.workflow_instance_id = wi.id
                                         AND wsi.step_number = wi.current_step_number
LEFT JOIN   departments               d_step ON d_step.id = wsi.department_id
LEFT JOIN   workflow_constraints      wc  ON wc.id = wsi.constraint_block_id
LEFT JOIN   infra_nodes               n   ON n.id  = c.infra_node_id
LEFT JOIN   infra_types               it  ON it.id = n.infra_type_id
LEFT JOIN LATERAL (
    SELECT
        wu.full_name     AS assigned_worker_name,
        ctr.company_name AS assigned_contractor_name,
        t.status         AS task_status
    FROM   tasks   t
    LEFT JOIN workers     w   ON w.id  = t.assigned_worker_id
    LEFT JOIN users       wu  ON wu.id = w.user_id
    LEFT JOIN contractors ctr ON ctr.id = t.assigned_contractor_id
    WHERE  t.complaint_id = c.id
    ORDER  BY t.created_at DESC
    LIMIT  1
) latest_task ON TRUE;

-- ── 21.3 Official Task Dashboard ────────────────────────────────
CREATE OR REPLACE VIEW v_official_task_dashboard AS
SELECT
    t.id                                               AS task_id,
    t.task_number,
    t.title                                            AS task_title,
    t.status                                           AS task_status,
    t.priority,
    t.due_at,
    t.started_at,
    t.completed_at,
    t.agent_summary,
    t.before_photos,
    t.after_photos,
    t.progress_photos,
    -- Complaint context
    c.complaint_number,
    c.description                                      AS complaint_description,
    ST_AsGeoJSON(c.location)::JSONB                    AS location_geojson,
    c.address_text,
    c.agent_summary                                    AS complaint_agent_summary,
    c.agent_priority_reason,
    c.status                                           AS complaint_status,
    c.is_repeat_complaint,
    c.repeat_gap_days,
    -- Department
    d.name                                             AS department_name,
    d.code                                             AS department_code,
    -- Assignment
    t.assigned_official_id,
    wu.full_name                                       AS worker_name,
    ctr.company_name                                   AS contractor_name,
    -- Override
    t.override_reason_code,
    t.override_notes,
    t.override_at,
    -- Workflow position
    wsi.step_number,
    wi.total_steps,
    wsi.status                                         AS step_status,
    wsi.expected_completion_at,
    wsi.legally_blocked_until,
    wc_block.block_message                             AS step_block_message
FROM        tasks                 t
LEFT JOIN   complaints            c   ON c.id   = t.complaint_id
JOIN        departments           d   ON d.id   = t.department_id
LEFT JOIN   workers               w   ON w.id   = t.assigned_worker_id
LEFT JOIN   users                 wu  ON wu.id  = w.user_id
LEFT JOIN   contractors           ctr ON ctr.id = t.assigned_contractor_id
LEFT JOIN   workflow_step_instances wsi ON wsi.id = t.workflow_step_instance_id
LEFT JOIN   workflow_instances    wi  ON wi.id  = wsi.workflow_instance_id
LEFT JOIN   workflow_constraints  wc_block ON wc_block.id = wsi.constraint_block_id;

-- ── 21.4 Admin KPI Dashboard ─────────────────────────────────────
CREATE OR REPLACE VIEW v_admin_kpi_dashboard AS
SELECT
    ops.snapshot_date,
    ops.official_id,
    u.full_name                                        AS official_name,
    d.name                                             AS department_name,
    d.code                                             AS department_code,
    j.name                                             AS jurisdiction_name,
    ops.tasks_assigned,
    ops.tasks_completed,
    ops.tasks_overdue,
    ops.avg_resolution_hours,
    ops.avg_survey_rating,
    ops.override_count,
    ops.override_reason_breakdown,
    ops.complaints_handled,
    ops.emergency_bypasses,
    ops.posthoc_tasks_pending,
    CASE WHEN ops.tasks_assigned > 0
         THEN ROUND(ops.tasks_completed::NUMERIC / ops.tasks_assigned * 100, 1)
         ELSE 0
    END                                                AS completion_rate_pct
FROM        official_performance_snapshots ops
JOIN        users        u ON u.id  = ops.official_id
LEFT JOIN   departments  d ON d.id  = ops.department_id
LEFT JOIN   jurisdictions j ON j.id = u.jurisdiction_id;

-- ── 21.5 Contractor KPI ──────────────────────────────────────────
CREATE OR REPLACE VIEW v_contractor_kpi AS
SELECT
    cps.snapshot_date,
    cps.contractor_id,
    ctr.company_name,
    ctr.registration_number,
    ctr.performance_score                              AS lifetime_score,
    ctr.is_blacklisted,
    cps.tasks_completed,
    cps.tasks_overdue,
    cps.avg_completion_hours,
    cps.avg_survey_rating,
    cps.tenders_won,
    cps.tenders_applied,
    CASE WHEN cps.tenders_applied > 0
         THEN ROUND(cps.tenders_won::NUMERIC / cps.tenders_applied * 100, 1)
         ELSE 0
    END                                                AS tender_win_rate_pct
FROM   contractor_performance_snapshots cps
JOIN   contractors                      ctr ON ctr.id = cps.contractor_id;

-- ── 21.6 Pending Surveys (agent poll) ───────────────────────────
CREATE OR REPLACE VIEW v_pending_surveys AS
SELECT
    si.id,
    si.survey_type,
    si.target_user_id,
    si.target_role,
    si.channel,
    si.triggered_at,
    si.expires_at,
    c.complaint_number,
    u.full_name     AS recipient_name,
    u.email,
    u.phone,
    u.preferred_language,
    u.twilio_opt_in,
    u.email_opt_in
FROM        survey_instances si
LEFT JOIN   complaints        c  ON c.id  = si.complaint_id
JOIN        users             u  ON u.id  = si.target_user_id
WHERE  si.status = 'pending'
  AND  (si.expires_at IS NULL OR si.expires_at > NOW());

-- ── 21.7 Active Workflow Constraints ────────────────────────────
CREATE OR REPLACE VIEW v_active_workflow_constraints AS
SELECT
    wc.id,
    wc.city_id,
    ci.name                                            AS city_name,
    wc.jurisdiction_id,
    j.name                                             AS jurisdiction_name,
    wc.name                                            AS constraint_name,
    wc.constraint_type,
    wc.affected_dept_codes,
    wc.affected_work_type_codes,
    wc.block_message,
    wc.legal_reference,
    CASE
        WHEN wc.is_recurring_annual THEN
            (DATE_TRUNC('year', NOW())
             + MAKE_INTERVAL(months => wc.end_month - 1, days => wc.end_day - 1)
            )::DATE
        ELSE wc.active_until
    END                                                AS active_until
FROM        workflow_constraints wc
JOIN        cities               ci ON ci.id = wc.city_id
LEFT JOIN   jurisdictions        j  ON j.id  = wc.jurisdiction_id
WHERE  wc.is_active = TRUE
  AND  (
          (wc.is_recurring_annual = TRUE
           AND (EXTRACT(MONTH FROM NOW()) > wc.start_month
                OR (EXTRACT(MONTH FROM NOW()) = wc.start_month
                    AND EXTRACT(DAY FROM NOW()) >= wc.start_day))
           AND (EXTRACT(MONTH FROM NOW()) < wc.end_month
                OR (EXTRACT(MONTH FROM NOW()) = wc.end_month
                    AND EXTRACT(DAY FROM NOW()) <= wc.end_day))
          )
          OR
          (wc.is_recurring_annual = FALSE
           AND CURRENT_DATE BETWEEN wc.active_from AND wc.active_until)
       );

-- ── 21.8 Workflow Version Activity ──────────────────────────────
CREATE OR REPLACE VIEW v_workflow_version_activity AS
SELECT
    wt.id                                              AS template_id,
    wt.name                                            AS template_name,
    v.id                                               AS version_id,
    v.version,
    v.is_latest_version,
    v.is_active,
    v.created_at                                       AS version_created_at,
    it.name                                            AS infra_type,
    j.name                                             AS jurisdiction_name,
    COUNT(wi.id)                                       AS total_instances,
    COUNT(wi.id) FILTER (WHERE wi.status = 'active')           AS active_instances,
    COUNT(wi.id) FILTER (WHERE wi.status = 'completed')        AS completed_instances,
    COUNT(wi.id) FILTER (WHERE wi.status = 'constraint_blocked') AS blocked_instances,
    CASE WHEN COUNT(wi.id) FILTER (WHERE wi.status = 'active') = 0
         THEN TRUE ELSE FALSE
    END                                                AS safe_to_archive
FROM        workflow_template_versions v
JOIN        workflow_templates         wt ON wt.id = v.template_id
LEFT JOIN   infra_types                it ON it.id = v.infra_type_id
LEFT JOIN   jurisdictions              j  ON j.id  = v.jurisdiction_id
LEFT JOIN   workflow_instances         wi ON wi.version_id = v.id
GROUP BY    wt.id, wt.name, v.id, v.version, v.is_latest_version,
            v.is_active, v.created_at, it.name, j.name
ORDER BY    wt.name, v.version DESC;

-- ── 21.9 Override Reason Analytics ──────────────────────────────
CREATE OR REPLACE VIEW v_override_reason_analytics AS
SELECT
    t.assigned_official_id                             AS official_id,
    u.full_name                                        AS official_name,
    d.name                                             AS department_name,
    t.override_reason_code,
    COUNT(*)                                           AS override_count,
    DATE_TRUNC('month', t.override_at)                 AS month
FROM   tasks  t
JOIN   users       u ON u.id = t.assigned_official_id
JOIN   departments d ON d.id = t.department_id
WHERE  t.override_reason_code IS NOT NULL
  AND  t.override_at IS NOT NULL
GROUP  BY t.assigned_official_id, u.full_name, d.name, t.override_reason_code, DATE_TRUNC('month', t.override_at)
ORDER  BY DATE_TRUNC('month', t.override_at) DESC, COUNT(*) DESC;

-- ── 21.10 Infra Hotspots ─────────────────────────────────────────
CREATE OR REPLACE VIEW v_infra_hotspots AS
SELECT
    n.id                                               AS infra_node_id,
    n.name                                             AS infra_name,
    n.city_id,
    ci.name                                            AS city_name,
    n.jurisdiction_id,
    j.name                                             AS jurisdiction_name,
    it.name                                            AS infra_type,
    ST_AsGeoJSON(n.location)::JSONB                    AS location_geojson,
    n.total_complaint_count,
    n.total_resolved_count,
    n.last_resolved_at,
    n.status                                           AS infra_status,
    -- Complaints in last 90 days (rolling window)
    COUNT(c.id) FILTER (
        WHERE c.created_at >= NOW() - INTERVAL '90 days'
    )                                                  AS complaints_last_90d,
    -- Repeat complaint flag
    CASE WHEN n.last_resolved_at IS NOT NULL
              AND NOW() - n.last_resolved_at
                  < (it.repeat_alert_years || ' years')::INTERVAL
         THEN TRUE ELSE FALSE
    END                                                AS is_in_repeat_window,
    -- Latest health score
    ahl.health_score                                   AS latest_health_score
FROM        infra_nodes   n
JOIN        cities        ci  ON ci.id = n.city_id
LEFT JOIN   jurisdictions j   ON j.id  = n.jurisdiction_id
JOIN        infra_types   it  ON it.id = n.infra_type_id
LEFT JOIN   complaints    c   ON c.infra_node_id = n.id
LEFT JOIN LATERAL (
    SELECT health_score FROM asset_health_logs
    WHERE  infra_node_id = n.id
    ORDER  BY computed_at DESC
    LIMIT  1
) ahl ON TRUE
GROUP BY n.id, n.name, n.city_id, ci.name, n.jurisdiction_id, j.name,
         it.name, it.repeat_alert_years, n.location, n.total_complaint_count,
         n.total_resolved_count, n.last_resolved_at, n.status, ahl.health_score
ORDER BY complaints_last_90d DESC;

COMMENT ON VIEW v_infra_hotspots IS
    'Super admin + public dashboard: infrastructure ranked by complaint density.
     complaints_last_90d: rolling window for live hotspot detection.
     is_in_repeat_window: TRUE means ANY new complaint on this node will be critical.
     Combine with ST_DWithin at app layer for "worst infra near me" map queries.';

-- ── 21.11 Repeat Complaint Alerts ───────────────────────────────
CREATE OR REPLACE VIEW v_repeat_complaint_alerts AS
SELECT
    c.id                                               AS complaint_id,
    c.complaint_number,
    c.city_id,
    ci.name                                            AS city_name,
    c.jurisdiction_id,
    j.name                                             AS jurisdiction_name,
    c.priority,
    c.status,
    c.created_at,
    c.repeat_gap_days,
    c.repeat_previous_resolved_at,
    -- Who resolved it last time
    prev_wi.id                                         AS prev_workflow_id,
    prev_official.full_name                            AS prev_responsible_official,
    prev_dept.name                                     AS prev_department_name,
    it.name                                            AS infra_type,
    n.name                                             AS infra_name,
    ST_AsGeoJSON(c.location)::JSONB                    AS location_geojson
FROM        complaints            c
JOIN        cities                ci  ON ci.id = c.city_id
LEFT JOIN   jurisdictions         j   ON j.id  = c.jurisdiction_id
LEFT JOIN   infra_nodes           n   ON n.id  = c.infra_node_id
LEFT JOIN   infra_types           it  ON it.id = n.infra_type_id
LEFT JOIN   workflow_instances    prev_wi ON prev_wi.id = n.last_resolved_workflow_id
LEFT JOIN   workflow_step_instances prev_wsi
                ON prev_wsi.workflow_instance_id = prev_wi.id
               AND prev_wsi.status = 'completed'
               AND prev_wsi.step_number = prev_wi.total_steps
LEFT JOIN   users                 prev_official ON prev_official.id = prev_wsi.assigned_official_id
LEFT JOIN   departments           prev_dept     ON prev_dept.id = prev_wsi.department_id
WHERE  c.is_repeat_complaint = TRUE
  AND  c.status NOT IN ('resolved', 'closed', 'rejected')
ORDER BY c.repeat_gap_days ASC;

COMMENT ON VIEW v_repeat_complaint_alerts IS
    'Super admin and admin dashboard widget: "Active repeat complaints."
     Shows who was responsible for the previous resolution — accountability trail.
     Sorted by gap_days ASC: shortest gap = worst repeat offenders first.
     Feed this into the agent PRIORITY_SCORER for automated escalation.';

-- ── 21.12 Emergency Posthoc Task Monitor ────────────────────────
CREATE OR REPLACE VIEW v_posthoc_task_monitor AS
SELECT
    ept.id,
    ept.workflow_instance_id,
    ept.complaint_id,
    ept.step_name,
    ept.documentation_type,
    ept.instructions,
    ept.is_mandatory,
    ept.status,
    ept.due_at,
    ept.emergency_bypass_at,
    EXTRACT(EPOCH FROM (ept.due_at - NOW()))/3600      AS hours_until_due,
    ept.due_at < NOW() AND ept.status = 'pending'      AS is_overdue,
    ept.completed_at,
    -- Assigned official
    u.full_name                                        AS assigned_official_name,
    d.name                                             AS department_name,
    -- Bypass context
    wi.emergency_bypass_log
FROM        emergency_posthoc_tasks  ept
JOIN        workflow_instances       wi  ON wi.id  = ept.workflow_instance_id
JOIN        departments              d   ON d.id   = ept.department_id
LEFT JOIN   users                    u   ON u.id   = ept.assigned_official_id
WHERE  ept.status IN ('pending', 'in_progress')
ORDER BY ept.due_at ASC;

COMMENT ON VIEW v_posthoc_task_monitor IS
    'Super admin dashboard: all pending posthoc documentation tasks after emergency bypasses.
     is_overdue = TRUE triggers a Cloud Tasks escalation to super_admin.
     hours_until_due allows color-coded urgency indicators in the UI.';


-- ============================================================
-- END OF SCHEMA — PS-CRM v3
-- ============================================================
--
-- TABLE SUMMARY (31 tables + 12 views + 10 functions + 3 sequences):
--
-- Reference:     cities, jurisdictions, workflow_constraints, departments, infra_types
-- Users:         users, contractors, workers
-- Infra:         infra_nodes, asset_health_logs
-- Complaints:    complaints*, complaint_status_history*, complaint_clusters,
--                complaint_cluster_members
-- Workflow:      workflow_templates, workflow_template_versions,
--                workflow_template_steps, workflow_instances,
--                workflow_step_instances
-- Tasks:         tasks, task_status_history*
-- Emergency:     emergency_posthoc_tasks
-- Tenders:       tenders
-- Surveys:       survey_templates, survey_instances, survey_responses
-- Notifications: notification_templates, notification_logs*, area_notification_subscriptions
-- GCP:           pubsub_event_log*, cloud_task_schedule
-- Agent:         agent_logs
-- Public:        public_announcements
-- KPI:           official_performance_snapshots, contractor_performance_snapshots
--
-- (* = range-partitioned by created_at)
--
-- GCP SERVICES WIRED IN:
--   Cloud SQL (PostgreSQL 15)   — this schema
--   GCP Identity Platform       — users.auth_uid
--   Cloud Storage (GCS)         — media URLs in JSONB columns
--   Cloud Pub/Sub               — pubsub_event_log (durable receipt)
--   Cloud Tasks                 — cloud_task_schedule (registry)
--   Cloud Run                   — workflow-engine, notification-service, agent-service
--   Cloud Scheduler             — nightly KPI + monthly partition creation
--   Firebase Cloud Messaging    — users.fcm_token (push)
--   Twilio                      — SMS + WhatsApp (notification_logs.external_message_id)
--   pgvector (extension)        — Nomic 768d embeddings on complaints
--   PostGIS (extension)         — all geometry + geography + GIST indexes
-- ============================================================


-- ============================================================
-- PART 2: CRITICAL FIXES (v3.1)
-- ============================================================

-- ============================================================
--  PS-CRM  |  CRITICAL FIXES DELTA  v3 → v3.1
--  Apply on top of ps_crm_schema_v3.sql
--
--  Fixes:
--   FIX 1.  workflow_complaints junction table
--   FIX 2.  infra_node race condition (location_hash)
--   FIX 3.  workflow_step_dependencies (normalized)
--   FIX 4.  remove assignment from workflow_step_instances
--   FIX 5.  complaint_embeddings (separate table)
--   FIX 6.  task_sla table
--   FIX 7.  domain_events table
--   IMP A.  soft delete (complaints, infra_nodes, tasks)
--   IMP B.  workflow_status_history
--   IMP C.  geo index for survey_instances
-- ============================================================


-- ============================================================
-- FIX 1 — WORKFLOW ↔ COMPLAINT JUNCTION TABLE
-- Problem: workflow is cluster-level, not complaint-level.
--          complaints.workflow_instance_id is a denormalized cache —
--          it does NOT represent the true 1-cluster:N-complaints mapping.
--          Under concurrency + clustering this becomes inconsistent.
-- ============================================================

CREATE TABLE workflow_complaints (
    workflow_instance_id    UUID        NOT NULL
                                REFERENCES workflow_instances(id) ON DELETE CASCADE,
    complaint_id            UUID        NOT NULL,
    -- When this complaint was attached to the workflow
    -- (may differ from complaint.created_at if clustering happened post-ingestion)
    attached_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Which agent action attached this complaint
    attached_by_agent_log_id UUID       REFERENCES agent_logs(id),
    PRIMARY KEY (workflow_instance_id, complaint_id)
);

CREATE INDEX idx_wc_complaint_id ON workflow_complaints(complaint_id);

COMMENT ON TABLE workflow_complaints IS
    'TRUE mapping between complaints and workflow instances.
     One workflow_instance maps to N complaints (the cluster).
     One complaint maps to exactly one workflow_instance (enforced at app layer).

     complaints.workflow_instance_id is kept as a denormalized read cache ONLY.
     All writes go through this table first.
     Read path for citizen portal: SELECT workflow_instance_id FROM workflow_complaints
       WHERE complaint_id = :id   — single row, indexed.
     Write path at clustering: INSERT INTO workflow_complaints after cluster resolves.

     attached_by_agent_log_id traces which CLUSTERING agent action created the link
     for full explainability.';


-- ============================================================
-- FIX 2 — INFRA NODE RACE CONDITION (location_hash)
-- Problem: two parallel ingestion requests within cluster_radius_meters
--          of each other both do ST_DWithin → find nothing → both INSERT
--          → duplicate infra_nodes for the same physical asset.
-- ============================================================

ALTER TABLE infra_nodes
    ADD COLUMN location_hash TEXT;

-- Backfill for any existing rows (safe to run on empty DB):
UPDATE infra_nodes
   SET location_hash = ROUND(ST_Y(location::geometry)::NUMERIC, 5)::TEXT
                    || '_'
                    || ROUND(ST_X(location::geometry)::NUMERIC, 5)::TEXT
 WHERE location_hash IS NULL;

-- Unique constraint: same type cannot have two nodes at the same rounded coordinate
CREATE UNIQUE INDEX idx_unique_infra_hash
    ON infra_nodes(infra_type_id, location_hash);

COMMENT ON COLUMN infra_nodes.location_hash IS
    'Spatial deduplication key: ROUND(lat,5) || "_" || ROUND(lng,5).
     At 5 decimal places, resolution ≈ 1.1 metres — well within any
     cluster_radius_meters value (minimum 10m in practice).
     Generated at app layer before INSERT. If INSERT fails on this unique index,
     the ingestion service retries with the existing node.

     Why app-layer generation rather than a DB-generated column:
     PostgreSQL GENERATED columns cannot call PostGIS functions.
     The ingestion Cloud Run service computes:
       hash = round(lat, 5).toString() + "_" + round(lng, 5).toString()
     then passes it in the INSERT. ON CONFLICT on this index → use existing node.

     Race condition resolved: first writer wins, second writer gets the existing node.';

-- ============================================================
-- FIX 3 — WORKFLOW STEP DEPENDENCIES (normalized)
-- Problem: prerequisite_step_ids UUID[] has no FK integrity,
--          is painful to query (ANY()), and cannot be validated
--          at the DB level. Agents doing dependency checks need proper joins.
-- ============================================================

-- Drop the array column from template steps
ALTER TABLE workflow_template_steps
    DROP COLUMN IF EXISTS prerequisite_step_ids;

CREATE TABLE workflow_step_dependencies (
    step_id             UUID    NOT NULL
                            REFERENCES workflow_template_steps(id) ON DELETE CASCADE,
    depends_on_step_id  UUID    NOT NULL
                            REFERENCES workflow_template_steps(id) ON DELETE CASCADE,
    PRIMARY KEY (step_id, depends_on_step_id),
    -- A step cannot depend on itself
    CONSTRAINT chk_no_self_dependency CHECK (step_id != depends_on_step_id)
);

CREATE INDEX idx_wsd_depends_on ON workflow_step_dependencies(depends_on_step_id);

COMMENT ON TABLE workflow_step_dependencies IS
    'Normalized step prerequisite graph. Replaces prerequisite_step_ids UUID[].

     To check if step X is unblocked:
       SELECT COUNT(*) = 0 AS is_ready
       FROM   workflow_step_dependencies d
       JOIN   workflow_step_instances    si
              ON si.template_step_id = d.depends_on_step_id
             AND si.workflow_instance_id = :workflow_instance_id
       WHERE  d.step_id = :template_step_id
         AND  si.status != ''completed'';

     To get all steps that become unlockable when step Y completes:
       SELECT step_id FROM workflow_step_dependencies
       WHERE  depends_on_step_id = :completed_step_id;

     idx_wsd_depends_on enables this reverse lookup efficiently —
     used by WORKFLOW_ENGINE after every step completion to find next unlockable steps.

     Cyclic dependency prevention: enforced at application layer during template creation
     (walk the graph; reject if cycle detected). DB enforces no-self-dependency only.';


-- ============================================================
-- FIX 4 — REMOVE ASSIGNMENT FROM workflow_step_instances
-- Problem: assignment lives in BOTH tasks and workflow_step_instances
--          → two sources of truth → guaranteed drift.
-- Rule: tasks is the single source of truth for assignment.
--       workflow_step_instances tracks step lifecycle, not who is doing the work.
-- ============================================================

ALTER TABLE workflow_step_instances
    DROP COLUMN IF EXISTS assigned_worker_id,
    DROP COLUMN IF EXISTS assigned_contractor_id,
    DROP COLUMN IF EXISTS override_reason_code,
    DROP COLUMN IF EXISTS override_notes,
    DROP COLUMN IF EXISTS override_by,
    DROP COLUMN IF EXISTS override_at,
    DROP COLUMN IF EXISTS override_original_assignee;

-- Keep assigned_official_id — the official owns the step (routing/accountability).
-- Worker + contractor live exclusively in tasks.

COMMENT ON COLUMN workflow_step_instances.assigned_official_id IS
    'The official responsible for this step (routing and accountability).
     Worker and contractor assignment is in tasks ONLY — single source of truth.
     Override tracking (reason_code, override_by, etc.) lives in tasks only.';


-- ============================================================
-- FIX 5 — COMPLAINT EMBEDDINGS (separate table)
-- Problem: 768-dim vectors inside the partitioned complaints table
--          bloat partition size, slow sequential scans on non-vector queries,
--          and make cold-partition archiving messy.
-- Fix: separate table, one row per complaint, joined only when needed.
-- ============================================================

-- Remove vector columns from complaints
ALTER TABLE complaints
    DROP COLUMN IF EXISTS text_embedding,
    DROP COLUMN IF EXISTS image_embedding;

CREATE TABLE complaint_embeddings (
    complaint_id        UUID         NOT NULL,
    -- Nomic text-embedding-3 (768d) of translated_description
    text_embedding      vector(768),
    -- Nomic vision embedding of the first/primary complaint image
    image_embedding     vector(768),
    -- Which Nomic model version generated these (for future re-embedding)
    model_version       VARCHAR(100) NOT NULL DEFAULT 'nomic-embed-text-v1.5',
    embedded_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (complaint_id)
    -- No FK to complaints: complaints is partitioned; cross-partition FKs unsupported.
    -- Referential integrity enforced at app layer.
);

-- IVFFlat indexes (moved here from complaints)
CREATE INDEX idx_ce_text_embed  ON complaint_embeddings
    USING ivfflat(text_embedding  vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_ce_image_embed ON complaint_embeddings
    USING ivfflat(image_embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE complaint_embeddings IS
    'Separate embedding store. Joined only when semantic search is needed.
     Main complaints table stays lean — partition scans stay fast.

     Usage patterns:
       1. Duplicate detection at ingestion:
            SELECT complaint_id,
                   1 - (text_embedding <=> :new_embedding) AS similarity
            FROM   complaint_embeddings
            WHERE  text_embedding <=> :new_embedding < 0.15
            ORDER  BY text_embedding <=> :new_embedding
            LIMIT  5;

       2. Semantic cluster summary (agent reads N similar complaints):
            SELECT ce.complaint_id
            FROM   complaint_embeddings ce
            WHERE  ce.text_embedding <=> :cluster_centroid_embedding < 0.25;

       model_version allows targeted re-embedding when Nomic releases a new model
       (UPDATE complaint_embeddings SET ... WHERE model_version = old_version).

     Note: complaint_id has no FK constraint because complaints is partitioned.
     App layer must INSERT into complaint_embeddings immediately after complaint INSERT.
     A nightly Cloud Function checks for complaints missing embeddings and backfills.';


-- ============================================================
-- FIX 6 — SLA TRACKING TABLE
-- Problem: expected_duration_hours on the template is a planning field.
--          There is no runtime SLA tracking, no breach detection,
--          no escalation trigger source. KPI "overdue" counts are guesses.
-- ============================================================

CREATE TABLE task_sla (
    task_id             UUID         PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
    sla_hours           INTEGER      NOT NULL,
    -- Set when task status → accepted/in_progress
    started_at          TIMESTAMPTZ,
    due_at              TIMESTAMPTZ  NOT NULL,
    -- Breach
    is_breached         BOOLEAN      NOT NULL DEFAULT FALSE,
    breached_at         TIMESTAMPTZ,
    -- Warning sent at 75% of SLA elapsed
    warning_sent_at     TIMESTAMPTZ,
    -- Escalation chain (who was notified and when)
    -- [{notified_user_id, role, notified_at, channel}]
    escalation_log      JSONB        NOT NULL DEFAULT '[]',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sla_due_active ON task_sla(due_at)
    WHERE is_breached = FALSE;
CREATE INDEX idx_sla_breached   ON task_sla(breached_at)
    WHERE is_breached = TRUE;

COMMENT ON TABLE task_sla IS
    'Runtime SLA tracking per task. Created by Cloud Tasks when task is assigned.
     sla_hours = workflow_template_steps.expected_duration_hours (copied at task creation).

     Cloud Tasks jobs scheduled off this table:
       75% elapsed  → task_type = SEND_DELAY_ALERT
                    → warn official + notify citizens in 5km
                    → log to escalation_log
       100% elapsed → task_type = CHECK_OVERDUE_TASKS
                    → SET is_breached = TRUE, breached_at = NOW()
                    → escalate to admin
                    → Pub/Sub event: TASK_SLA_BREACHED
                    → feeds official_performance_snapshots.tasks_overdue

     Without this table:
       KPI "overdue" counts are computed from (NOW() > due_at) at query time —
       no history of when breach happened, no escalation audit, no chain of custody.
     With this table:
       Breach timestamp is immutable, escalation_log is append-only,
       and the KPI snapshot job has a clean source to read from.

     updated_at trigger added below.';

CREATE TRIGGER trg_task_sla_updated_at
    BEFORE UPDATE ON task_sla
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
-- FIX 7 — DOMAIN EVENTS TABLE
-- Problem: pubsub_event_log is infrastructure plumbing — it tracks
--          Pub/Sub delivery mechanics. Agents should NOT read it.
--          Agents need clean domain semantics: "what happened to complaint X".
-- Rule: agents read domain_events; pubsub_event_log is for ops/infra.
-- ============================================================

CREATE TABLE domain_events (
    id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type      VARCHAR(100) NOT NULL,
    -- Domain event types:
    --   COMPLAINT_RECEIVED        COMPLAINT_CLUSTERED       COMPLAINT_REPEAT_ESCALATED
    --   COMPLAINT_MAPPED          WORKFLOW_STARTED          WORKFLOW_COMPLETED
    --   WORKFLOW_EMERGENCY_BYPASS STEP_UNLOCKED             STEP_CONSTRAINT_BLOCKED
    --   STEP_COMPLETED            TASK_ASSIGNED             TASK_STARTED
    --   TASK_COMPLETED            TASK_SLA_BREACHED         TASK_OVERRIDDEN
    --   TENDER_SUBMITTED          TENDER_APPROVED           TENDER_AWARDED
    --   SURVEY_TRIGGERED          SURVEY_COMPLETED          POSTHOC_TASK_CREATED
    --   POSTHOC_TASK_OVERDUE      CONTRACTOR_BLACKLISTED    WORKFLOW_VERSION_ARCHIVED
    entity_type     VARCHAR(60)  NOT NULL,
    -- e.g. complaint | workflow_instance | task | infra_node | tender | survey
    entity_id       UUID         NOT NULL,
    -- Actor who caused the event (NULL = system/agent)
    actor_id        UUID         REFERENCES users(id),
    actor_type      VARCHAR(30),  -- user | agent | system | scheduler
    -- Lightweight payload — just the diff, not the full object
    -- e.g. {"old_status": "pending", "new_status": "in_progress", "reason": "..."}
    payload         JSONB        NOT NULL DEFAULT '{}',
    -- Correlation IDs for agent context chaining
    complaint_id    UUID,        -- always set when event relates to a complaint
    workflow_instance_id UUID    REFERENCES workflow_instances(id),
    city_id         UUID         REFERENCES cities(id),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- BRIN: append-only, time-ordered
CREATE INDEX idx_de_created_brin    ON domain_events USING BRIN(created_at);
-- B-tree for agent queries: "all events for complaint X"
CREATE INDEX idx_de_entity          ON domain_events(entity_type, entity_id);
CREATE INDEX idx_de_complaint       ON domain_events(complaint_id)
    WHERE complaint_id IS NOT NULL;
CREATE INDEX idx_de_workflow        ON domain_events(workflow_instance_id)
    WHERE workflow_instance_id IS NOT NULL;
CREATE INDEX idx_de_event_type      ON domain_events(event_type);

COMMENT ON TABLE domain_events IS
    'Clean domain event log for agent consumption.
     Separate from pubsub_event_log (infrastructure) and agent_logs (agent actions).

     Three tables, three concerns:
       domain_events    — WHAT happened in the domain (agent reads this)
       pubsub_event_log — HOW it was transported (ops reads this)
       agent_logs       — WHAT the agent did about it (explainability reads this)

     Agent query pattern — "Give me the full timeline for complaint X":
       SELECT event_type, actor_type, payload, created_at
       FROM   domain_events
       WHERE  complaint_id = :id
       ORDER  BY created_at ASC;

     Agent query pattern — "What changed in this workflow in the last hour":
       SELECT event_type, entity_id, payload, created_at
       FROM   domain_events
       WHERE  workflow_instance_id = :id
         AND  created_at > NOW() - INTERVAL ''1 hour''
       ORDER  BY created_at ASC;

     Payload is intentionally minimal (just the diff).
     Full object state is always reconstructed from the domain tables.
     This keeps domain_events fast to write and cheap to scan.';


-- ============================================================
-- IMPROVEMENT A — SOFT DELETE
-- Add is_deleted to complaints, infra_nodes, tasks.
-- Never hard-delete civic records — audit requirements.
-- ============================================================

ALTER TABLE complaints
    ADD COLUMN IF NOT EXISTS is_deleted         BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by         UUID         REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS deletion_reason    TEXT;

ALTER TABLE infra_nodes
    ADD COLUMN IF NOT EXISTS is_deleted         BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by         UUID         REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS deletion_reason    TEXT;

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS is_deleted         BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by         UUID         REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS deletion_reason    TEXT;

-- Partial indexes: active records (the 99% query path) never touch deleted rows
CREATE INDEX idx_complaints_active  ON complaints(city_id, status, created_at)
    WHERE is_deleted = FALSE;
CREATE INDEX idx_infra_nodes_active ON infra_nodes(city_id, infra_type_id)
    WHERE is_deleted = FALSE;
CREATE INDEX idx_tasks_active       ON tasks(assigned_official_id, status)
    WHERE is_deleted = FALSE;

COMMENT ON COLUMN complaints.is_deleted IS
    'Soft delete only. Hard deletes are prohibited — civic records are permanent.
     Deleted complaints are excluded from all views (WHERE is_deleted = FALSE).
     deleted_by + deletion_reason are mandatory at app layer for super_admin deletes.
     Only super_admin role can soft-delete. Regular users get status = rejected instead.';


-- ============================================================
-- IMPROVEMENT B — WORKFLOW STATUS HISTORY
-- Problem: step-level history exists but workflow-level transitions
--          (active → paused → emergency_bypassed → completed) are invisible.
--          Super admin audit requires full workflow lifecycle trail.
-- ============================================================

CREATE TABLE workflow_status_history (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_instance_id    UUID         NOT NULL
                                REFERENCES workflow_instances(id) ON DELETE CASCADE,
    old_status              VARCHAR(30),
    new_status              VARCHAR(30)  NOT NULL,
    -- Who triggered this transition (NULL = system/agent)
    changed_by              UUID         REFERENCES users(id),
    change_source           VARCHAR(30)  NOT NULL DEFAULT 'system'
                                CHECK (change_source IN (
                                    'system',    -- automated workflow engine
                                    'agent',     -- AI agent action
                                    'official',  -- manual official action
                                    'admin',     -- admin override
                                    'super_admin'
                                )),
    reason                  TEXT,
    -- Snapshot of key state at transition time
    -- {current_step, mode, total_steps, active_constraint_id, bypass_reason}
    state_snapshot          JSONB        NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wsh_workflow   ON workflow_status_history(workflow_instance_id);
CREATE INDEX idx_wsh_created    ON workflow_status_history USING BRIN(created_at);

COMMENT ON TABLE workflow_status_history IS
    'Immutable audit trail for workflow-level status transitions.
     Answers: "When did this workflow go into emergency mode, and who triggered it?"
     change_source distinguishes system automation from human decisions.
     state_snapshot captures current_step + mode at transition time
     so the audit is self-contained (no joins needed for historical reconstruction).

     Auto-populated by trigger fn_log_workflow_status_change() below.';

-- Trigger: auto-log every workflow status transition
CREATE OR REPLACE FUNCTION fn_log_workflow_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO workflow_status_history (
            workflow_instance_id,
            old_status,
            new_status,
            change_source,
            state_snapshot
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            'system',   -- app layer can UPDATE this row's change_source post-insert
            jsonb_build_object(
                'current_step', NEW.current_step_number,
                'total_steps',  NEW.total_steps,
                'mode',         NEW.mode,
                'is_emergency', NEW.is_emergency
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_workflow_status_history
    AFTER UPDATE ON workflow_instances
    FOR EACH ROW EXECUTE FUNCTION fn_log_workflow_status_change();

COMMENT ON TRIGGER trg_workflow_status_history ON workflow_instances IS
    'Fires on every status change. change_source defaults to "system".
     The app service should UPDATE workflow_status_history SET change_source = ''official'',
     changed_by = :user_id, reason = :reason WHERE id = lastval()
     immediately after the workflow UPDATE, within the same transaction.';


-- ============================================================
-- IMPROVEMENT C — GEO INDEX FOR SURVEY INSTANCES
-- Needed for: "send survey to all citizens within 5km who are
-- affected by this workflow" — a geo-fenced survey dispatch.
-- ============================================================

-- Add location column to survey_instances (point of the related complaint/infra_node)
ALTER TABLE survey_instances
    ADD COLUMN IF NOT EXISTS related_location GEOMETRY(POINT, 4326);

CREATE INDEX idx_si_location ON survey_instances USING GIST(related_location)
    WHERE related_location IS NOT NULL;

COMMENT ON COLUMN survey_instances.related_location IS
    'Location of the related infra_node/complaint. Copied at survey creation.
     Enables geo-fenced survey dispatch:
       SELECT si.id, si.target_user_id
       FROM   survey_instances si
       WHERE  ST_DWithin(si.related_location::geography, :area_center::geography, 5000)
         AND  si.status = ''pending'';
     Also used to show citizens a map pin: "This survey is about work near you."';


-- ============================================================
-- SUMMARY OF CHANGES
-- ============================================================
--
-- NEW TABLES:
--   workflow_complaints           FIX 1 — true N-complaint:1-workflow mapping
--   workflow_step_dependencies    FIX 3 — normalized step dependency graph
--   complaint_embeddings          FIX 5 — embeddings decoupled from complaint partitions
--   task_sla                      FIX 6 — runtime SLA tracking + breach detection
--   domain_events                 FIX 7 — clean event log for agent consumption
--   workflow_status_history       IMP B — workflow lifecycle audit trail
--
-- MODIFIED TABLES:
--   infra_nodes          +location_hash (FIX 2) +is_deleted/deleted_at/by/reason (IMP A)
--   workflow_template_steps  -prerequisite_step_ids (replaced by workflow_step_dependencies)
--   workflow_step_instances  -assigned_worker_id -assigned_contractor_id
--                            -override_reason_code -override_notes -override_by
--                            -override_at -override_original_assignee (FIX 4)
--   complaints           -text_embedding -image_embedding (FIX 5)
--                        +is_deleted/deleted_at/by/reason (IMP A)
--   tasks                +is_deleted/deleted_at/by/reason (IMP A)
--   survey_instances     +related_location GEOMETRY (IMP C)
--
-- NEW INDEXES:
--   idx_unique_infra_hash (UNIQUE — race condition prevention)
--   idx_wc_complaint_id
--   idx_wsd_depends_on
--   idx_ce_text_embed / idx_ce_image_embed (moved from complaints)
--   idx_sla_due_active / idx_sla_breached
--   idx_de_* (5 domain_events indexes)
--   idx_complaints_active / idx_infra_nodes_active / idx_tasks_active (partial, soft-delete)
--   idx_wsh_workflow / idx_wsh_created
--   idx_si_location (GIST — geo survey dispatch)
--
-- NEW TRIGGERS:
--   trg_task_sla_updated_at
--   trg_workflow_status_history
--
-- PATCHED VIEWS:
--   v_public_complaint_map     (uses workflow_complaints junction + is_deleted filter)
--   v_official_task_dashboard  (uses workflow_complaints + task_sla SLA columns + is_deleted)
-- ============================================================


-- ============================================================
-- PART 3: FINAL FIXES (v3.2)
-- ============================================================

-- ============================================================
--  PS-CRM  |  FINAL CRITICAL CHECKS DELTA  v3.1 → v3.2
--  Apply on top of:
--    1. ps_crm_schema_v3.sql
--    2. ps_crm_critical_fixes_v3_1.sql
--
--  Changes:
--   FIX 1. UNIQUE on workflow_complaints(complaint_id)
--   FIX 2. location_hash → geohash(precision=8)
--   FIX 3. Atomic ingestion transaction pattern (documented + enforced via function)
--   FIX 4. Embedding pipeline: guaranteed text + image embeddings per complaint
-- ============================================================


-- ============================================================
-- FIX 1 — UNIQUE CONSTRAINT: one complaint → one workflow
-- Problem: "enforced at app layer" is not enough under concurrency.
--          Two parallel requests could both INSERT the same complaint_id
--          into workflow_complaints before either COMMITs.
-- ============================================================

-- This is a single-column unique index, not the composite PK.
-- The PK (workflow_instance_id, complaint_id) allows the same complaint
-- to appear under multiple workflows — which must NEVER happen.
-- This index closes that gap.
CREATE UNIQUE INDEX idx_unique_complaint_workflow
    ON workflow_complaints(complaint_id);

COMMENT ON INDEX idx_unique_complaint_workflow IS
    'Guarantees one complaint maps to exactly one workflow_instance.
     The composite PK alone does not prevent one complaint_id appearing
     under two different workflow_instance_ids.
     This index makes that impossible at the DB layer — no app-layer trust needed.
     ON CONFLICT on this index during clustering → use existing workflow_instance_id.';


-- ============================================================
-- FIX 2 — location_hash → geohash(precision=8)
-- Problem: ROUND(lat,5)_ROUND(lng,5) = ~1.1m resolution.
--          Two different physical assets legitimately 2m apart
--          but of the same infra_type get the same hash → false collision.
--          geohash(precision=8) = ~38m × 19m cell — large enough to
--          deduplicate the same asset, small enough not to collapse
--          distinct assets into one node.
--
-- Note: PostGIS provides ST_GeoHash() natively — no extension needed.
-- ============================================================

-- Drop the old index before changing the column semantics
DROP INDEX IF EXISTS idx_unique_infra_hash;

-- Recompute location_hash for all existing rows using ST_GeoHash
UPDATE infra_nodes
   SET location_hash = ST_GeoHash(location::geometry, 8)
 WHERE location IS NOT NULL;

-- Recreate the unique index on the new hash values
CREATE UNIQUE INDEX idx_unique_infra_hash
    ON infra_nodes(infra_type_id, location_hash);

COMMENT ON COLUMN infra_nodes.location_hash IS
    'ST_GeoHash(location, 8) — geohash at precision 8 = ~38m × 19m cell.
     Why precision 8:
       precision 6 = ~1.2km × 0.6km  (too coarse: collapses distinct assets)
       precision 7 = ~150m × 150m    (borderline for cluster_radius_meters=50)
       precision 8 = ~38m × 19m      (fits inside cluster_radius_meters; still deduplicates)
       precision 9 = ~5m × 5m        (too fine: same asset GPS jitter = new node)

     Generated at app layer (Cloud Run ingestion service):
       import geohash  # Python: python-geohash
       hash = geohash.encode(lat, lng, precision=8)
     OR directly in SQL: ST_GeoHash(ST_SetSRID(ST_Point(lng,lat),4326), 8)

     ON CONFLICT on (infra_type_id, location_hash) → use existing infra_node.
     Race condition fully resolved: first writer wins, concurrent writers
     get the existing node via the unique index conflict.';


-- ============================================================
-- FIX 3 — ATOMIC INGESTION TRANSACTION
-- The ingestion transaction is the most critical write path in the system.
-- A partial write leaves orphan complaints, broken cluster mappings,
-- and missing embeddings. ALL six steps must succeed or ALL roll back.
--
-- This function encapsulates the full ingestion contract.
-- The Cloud Run ingestion service calls ONLY this function — never
-- individual INSERTs — for new complaint creation.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_ingest_complaint(
    -- ── Citizen + City ───────────────────────────────────────
    p_citizen_id            UUID,
    p_city_id               UUID,
    p_city_code             VARCHAR,

    -- ── Content ──────────────────────────────────────────────
    p_title                 VARCHAR(500),
    p_description           TEXT,
    p_original_language     VARCHAR(10),
    p_translated_description TEXT,

    -- ── Location ─────────────────────────────────────────────
    p_lat                   DOUBLE PRECISION,
    p_lng                   DOUBLE PRECISION,
    p_address_text          TEXT,

    -- ── Media ────────────────────────────────────────────────
    p_images                JSONB,          -- [{url, gcs_path, mime_type, ...}]
    p_voice_recording_url   TEXT,
    p_voice_transcript      TEXT,

    -- ── Infrastructure ───────────────────────────────────────
    p_infra_type_id         UUID,
    p_infra_name            VARCHAR(400),   -- optional; agent-generated

    -- ── Embeddings (computed by Cloud Run before calling this fn) ──
    p_text_embedding        vector(768),
    p_image_embedding       vector(768),    -- NULL if no image submitted
    p_embedding_model       VARCHAR(100)    DEFAULT 'nomic-embed-text-v1.5',

    -- ── Priority / Agent ─────────────────────────────────────
    p_priority              VARCHAR(20)     DEFAULT 'normal',
    p_agent_summary         TEXT            DEFAULT NULL,
    p_agent_priority_reason TEXT            DEFAULT NULL,
    p_agent_suggested_dept_ids UUID[]       DEFAULT '{}'
)
RETURNS TABLE(
    complaint_id            UUID,
    complaint_number        VARCHAR,
    infra_node_id           UUID,
    workflow_instance_id    UUID,
    is_new_infra_node       BOOLEAN,
    is_repeat_complaint     BOOLEAN,
    repeat_gap_days         INTEGER,
    jurisdiction_id         UUID
)
LANGUAGE plpgsql AS $$
DECLARE
    v_complaint_id          UUID    := uuid_generate_v4();
    v_complaint_number      VARCHAR;
    v_point                 GEOMETRY(POINT, 4326);
    v_jurisdiction_id       UUID;
    v_infra_node_id         UUID;
    v_location_hash         TEXT;
    v_is_new_node           BOOLEAN := FALSE;
    v_workflow_instance_id  UUID;
    v_is_repeat             BOOLEAN := FALSE;
    v_prev_resolved_at      TIMESTAMPTZ;
    v_gap_days              INTEGER;
    v_last_wf_id            UUID;
    v_final_priority        VARCHAR(20);
    v_repeat_prev_complaint UUID;
BEGIN
    -- ── STEP 0: build geometry ───────────────────────────────
    v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);

    -- ── STEP 1: resolve jurisdiction ─────────────────────────
    v_jurisdiction_id := fn_resolve_jurisdiction(v_point, p_city_id);

    -- ── STEP 2: find or create infra_node (race-safe) ────────
    v_location_hash := ST_GeoHash(v_point, 8);

    -- Try to find existing node by geohash first (fastest path)
    SELECT id INTO v_infra_node_id
    FROM   infra_nodes
    WHERE  infra_type_id  = p_infra_type_id
      AND  location_hash  = v_location_hash
      AND  is_deleted     = FALSE
    LIMIT  1;

    -- If not found by hash, try spatial proximity
    IF v_infra_node_id IS NULL THEN
        SELECT infra_node_id INTO v_infra_node_id
        FROM   fn_find_infra_node_for_cluster(v_point, p_infra_type_id, p_city_id);
    END IF;

    -- If still not found, create a new node
    IF v_infra_node_id IS NULL THEN
        INSERT INTO infra_nodes (
            city_id, jurisdiction_id, infra_type_id,
            name, location, location_hash, status
        )
        VALUES (
            p_city_id, v_jurisdiction_id, p_infra_type_id,
            p_infra_name, v_point, v_location_hash, 'damaged'
        )
        ON CONFLICT (infra_type_id, location_hash)
            DO UPDATE SET updated_at = NOW()  -- no-op update to return id
        RETURNING id INTO v_infra_node_id;

        v_is_new_node := TRUE;

        -- Update total_complaint_count on new node
        UPDATE infra_nodes
           SET total_complaint_count = total_complaint_count + 1
         WHERE id = v_infra_node_id;
    ELSE
        -- Increment complaint count on existing node
        UPDATE infra_nodes
           SET total_complaint_count = total_complaint_count + 1,
               status = CASE WHEN status = 'operational' THEN 'damaged' ELSE status END
         WHERE id = v_infra_node_id;
    END IF;

    -- ── STEP 3: repeat complaint check ───────────────────────
    SELECT
        rc.is_repeat,
        rc.previous_resolved_at,
        rc.gap_days,
        rc.last_resolved_workflow_id
    INTO
        v_is_repeat,
        v_prev_resolved_at,
        v_gap_days,
        v_last_wf_id
    FROM fn_check_repeat_complaint(v_infra_node_id) rc;

    -- If repeat: escalate priority to critical regardless of agent suggestion
    v_final_priority := CASE
        WHEN v_is_repeat         THEN 'critical'
        WHEN p_priority IS NULL  THEN 'normal'
        ELSE p_priority
    END;

    -- Find the last resolved complaint on this node for the backlink
    IF v_is_repeat THEN
        SELECT id INTO v_repeat_prev_complaint
        FROM   complaints
        WHERE  infra_node_id = v_infra_node_id
          AND  status        = 'resolved'
          AND  is_deleted    = FALSE
        ORDER  BY resolved_at DESC
        LIMIT  1;
    END IF;

    -- ── STEP 4: generate complaint number ────────────────────
    v_complaint_number := fn_generate_complaint_number(p_city_code);

    -- ── STEP 5: insert complaint ─────────────────────────────
    INSERT INTO complaints (
        id, complaint_number,
        citizen_id, city_id, jurisdiction_id, infra_node_id,
        title, description, original_language, translated_description,
        location, address_text,
        images, voice_recording_url, voice_transcript,
        status, priority,
        is_repeat_complaint,
        repeat_previous_complaint_id,
        repeat_previous_resolved_at,
        repeat_gap_days,
        agent_summary, agent_priority_reason, agent_suggested_dept_ids,
        created_at
    ) VALUES (
        v_complaint_id, v_complaint_number,
        p_citizen_id, p_city_id, v_jurisdiction_id, v_infra_node_id,
        p_title, p_description, p_original_language, p_translated_description,
        v_point, p_address_text,
        COALESCE(p_images, '[]'::jsonb),
        p_voice_recording_url, p_voice_transcript,
        'received',
        v_final_priority,
        v_is_repeat,
        v_repeat_prev_complaint,
        v_prev_resolved_at,
        v_gap_days,           -- set once at filing time; never updated
        p_agent_summary, p_agent_priority_reason,
        COALESCE(p_agent_suggested_dept_ids, '{}'::UUID[]),
        NOW()
    );

    -- ── STEP 6: insert embeddings ────────────────────────────
    -- text_embedding is ALWAYS required (computed before calling this fn).
    -- image_embedding is NULL if no image was submitted — that is valid.
    -- The ingestion Cloud Run service must compute both BEFORE calling this fn:
    --   text:  Nomic nomic-embed-text-v1.5 on translated_description
    --   image: Nomic nomic-embed-vision-v1.5 on first image (if images != [])
    INSERT INTO complaint_embeddings (
        complaint_id,
        text_embedding,
        image_embedding,
        model_version,
        embedded_at
    ) VALUES (
        v_complaint_id,
        p_text_embedding,
        p_image_embedding,   -- NULL is valid (no image case)
        p_embedding_model,
        NOW()
    );

    -- ── STEP 7: resolve workflow_instance ────────────────────
    -- Check if an active workflow already exists for this infra_node
    SELECT id INTO v_workflow_instance_id
    FROM   workflow_instances
    WHERE  infra_node_id = v_infra_node_id
      AND  status        = 'active'
    LIMIT  1;

    -- If no active workflow: the WORKFLOW_ENGINE agent creates one.
    -- We leave workflow_instance_id NULL here — the agent fills it
    -- and then inserts the workflow_complaints row itself.
    -- This fn only inserts workflow_complaints if a workflow already exists.
    IF v_workflow_instance_id IS NOT NULL THEN
        INSERT INTO workflow_complaints (
            workflow_instance_id,
            complaint_id,
            attached_at
        ) VALUES (
            v_workflow_instance_id,
            v_complaint_id,
            NOW()
        )
        ON CONFLICT (complaint_id) DO NOTHING;  -- idempotent

        -- Update complaints cache column
        UPDATE complaints
           SET workflow_instance_id = v_workflow_instance_id
         WHERE id = v_complaint_id;
    END IF;

    -- ── STEP 8: write domain event ───────────────────────────
    INSERT INTO domain_events (
        event_type, entity_type, entity_id,
        actor_id, actor_type,
        payload,
        complaint_id, city_id
    ) VALUES (
        CASE WHEN v_is_repeat THEN 'COMPLAINT_REPEAT_ESCALATED' ELSE 'COMPLAINT_RECEIVED' END,
        'complaint',
        v_complaint_id,
        p_citizen_id,
        'user',
        jsonb_build_object(
            'complaint_number',     v_complaint_number,
            'priority',             v_final_priority,
            'infra_node_id',        v_infra_node_id,
            'is_new_infra_node',    v_is_new_node,
            'is_repeat',            v_is_repeat,
            'repeat_gap_days',      v_gap_days,
            'jurisdiction_id',      v_jurisdiction_id,
            'has_image_embedding',  (p_image_embedding IS NOT NULL)
        ),
        v_complaint_id,
        p_city_id
    );

    -- ── RETURN ───────────────────────────────────────────────
    RETURN QUERY SELECT
        v_complaint_id,
        v_complaint_number,
        v_infra_node_id,
        v_workflow_instance_id,
        v_is_new_node,
        v_is_repeat,
        v_gap_days,
        v_jurisdiction_id;

END;
$$;

COMMENT ON FUNCTION fn_ingest_complaint IS
    '═══════════════════════════════════════════════════════════
     ATOMIC INGESTION CONTRACT — READ BEFORE CALLING
     ═══════════════════════════════════════════════════════════

     This function is the ONLY entry point for new complaint creation.
     The Cloud Run ingestion service MUST NOT call individual INSERTs.

     WHAT THIS FUNCTION GUARANTEES (all-or-nothing):
       1. Jurisdiction auto-resolved from PostGIS point
       2. Infra node found-or-created (race-safe via geohash unique index)
       3. Repeat complaint detected → priority auto-escalated to critical
       4. Complaint inserted with correct priority and repeat metadata
       5. Embeddings inserted (text always, image when available)
       6. Workflow mapped if active workflow already exists for this infra_node
       7. Domain event written (COMPLAINT_RECEIVED or COMPLAINT_REPEAT_ESCALATED)

     WHAT THE CALLER (Cloud Run) MUST DO BEFORE CALLING:
       A. Translate description to English (Google Cloud Translation API)
       B. Compute text embedding:
            Nomic nomic-embed-text-v1.5 on translated_description
            → vector(768)
            REQUIRED — do not call this function without it.
       C. If images present: compute image embedding:
            Nomic nomic-embed-vision-v1.5 on first/primary image
            → vector(768)
            Pass NULL if no images. NULL image_embedding is valid.
       D. Upload all media to GCS, get signed URLs, build p_images JSONB
       E. Upload voice recording to GCS if present

     WHAT HAPPENS AFTER THIS FUNCTION RETURNS:
       The return row tells the WORKFLOW_ENGINE agent:
         - workflow_instance_id: NULL → create new workflow for this infra_node
         - is_new_infra_node: TRUE → first complaint on this asset
         - is_repeat_complaint: TRUE → flag for escalation notification
       WORKFLOW_ENGINE then:
         1. Calls fn_resolve_workflow_version(infra_type_id, jurisdiction_id, city_id)
         2. Creates workflow_instance
         3. Creates workflow_step_instances for each step
         4. Inserts workflow_complaints row
         5. Updates complaints.workflow_instance_id cache
         6. Creates Cloud Tasks jobs for SLA + survey triggers
         7. Publishes WORKFLOW_STARTED to ps-crm-workflow Pub/Sub topic

     TRANSACTION SCOPE:
       This function runs inside a single PG transaction.
       If ANY step fails → entire transaction rolls back.
       No orphan complaints. No broken mappings. No missing embeddings.

     IDEMPOTENCY:
       ON CONFLICT on infra_node (geohash) → use existing node
       ON CONFLICT on workflow_complaints(complaint_id) → DO NOTHING
       Safe to retry on transient Cloud SQL connection failure.
     ═══════════════════════════════════════════════════════════';


-- ============================================================
-- FIX 4 — EMBEDDING PIPELINE GUARANTEES
-- Ensure complaint_embeddings always has a row for every complaint.
-- Three layers of enforcement:
--   A. fn_ingest_complaint always inserts both (text mandatory, image nullable)
--   B. Nightly Cloud Function detects and backfills missing embeddings
--   C. Monitoring view for ops team
-- ============================================================

-- ── A: NOT NULL on text_embedding (text is always computable) ───
-- image_embedding stays nullable — valid when no image was submitted.
ALTER TABLE complaint_embeddings
    ALTER COLUMN text_embedding SET NOT NULL;

COMMENT ON COLUMN complaint_embeddings.text_embedding IS
    'REQUIRED. Nomic nomic-embed-text-v1.5, 768 dimensions.
     Computed from complaints.translated_description (English).
     If original_language != English: translate first via Cloud Translation API.
     Never NULL — fn_ingest_complaint enforces this.
     Used for: semantic duplicate detection, cluster summarisation,
     agent context retrieval ("find similar past complaints").';

COMMENT ON COLUMN complaint_embeddings.image_embedding IS
    'NULLABLE. Nomic nomic-embed-vision-v1.5, 768 dimensions.
     Computed from the first image in complaints.images (if any).
     NULL when complaint was submitted with no images — this is valid.
     Used for: visual duplicate detection, damage severity inference,
     before/after comparison by the SUMMARY_GENERATOR agent.';

-- ── B: Monitoring view — complaints missing embeddings ──────────
-- Polled nightly by Cloud Scheduler → Cloud Run embedding-backfill service.
CREATE OR REPLACE VIEW v_missing_embeddings AS
SELECT
    c.id                    AS complaint_id,
    c.complaint_number,
    c.city_id,
    c.original_language,
    c.translated_description IS NULL    AS needs_translation,
    ce.complaint_id IS NULL             AS missing_all_embeddings,
    ce.text_embedding IS NULL           AS missing_text_embedding,
    ce.image_embedding IS NULL
        AND jsonb_array_length(c.images) > 0
                                        AS missing_image_embedding,
    c.created_at
FROM        complaints         c
LEFT JOIN   complaint_embeddings ce ON ce.complaint_id = c.id
WHERE  c.is_deleted = FALSE
  AND  (
          ce.complaint_id  IS NULL          -- no embedding row at all
       OR ce.text_embedding IS NULL         -- text missing (should not happen post-fix)
       OR (ce.image_embedding IS NULL
           AND jsonb_array_length(c.images) > 0)  -- image present but not embedded
       )
ORDER BY c.created_at DESC;

COMMENT ON VIEW v_missing_embeddings IS
    'Ops monitoring view. Polled by nightly backfill Cloud Function.
     missing_all_embeddings: fn_ingest_complaint failed mid-transaction (should not occur).
     missing_text_embedding: pre-fix legacy data or translation API failure.
     missing_image_embedding: image present but Nomic vision call failed.

     Backfill Cloud Function flow:
       1. SELECT * FROM v_missing_embeddings LIMIT 100
       2. For each row:
          a. If needs_translation: call Cloud Translation API
          b. Call Nomic API for missing embedding(s)
          c. INSERT INTO complaint_embeddings ON CONFLICT (complaint_id)
             DO UPDATE SET text_embedding = ..., image_embedding = ...,
                           embedded_at = NOW()
       3. Write result to domain_events (event_type = EMBEDDINGS_BACKFILLED)';

-- ── C: model_version index (for targeted re-embedding) ──────────
CREATE INDEX idx_ce_model_version ON complaint_embeddings(model_version);

COMMENT ON INDEX idx_ce_model_version IS
    'Used when Nomic releases a new model version.
     Re-embedding query: SELECT complaint_id FROM complaint_embeddings
       WHERE model_version = ''nomic-embed-text-v1.5''
     Batch through the backfill Cloud Function, update to new model.';


-- ============================================================
-- SUMMARY OF v3.2 CHANGES
-- ============================================================
--
-- NEW INDEX:
--   idx_unique_complaint_workflow   UNIQUE ON workflow_complaints(complaint_id)
--                                   One complaint → one workflow, DB-enforced
--
-- MODIFIED COLUMN:
--   infra_nodes.location_hash       ROUND(lat,5)_ROUND(lng,5)
--                                   → ST_GeoHash(location, 8)  ~38m × 19m cell
--
-- NEW FUNCTION:
--   fn_ingest_complaint(...)        Atomic 8-step ingestion transaction.
--                                   Single entry point for all complaint creation.
--                                   Handles: jurisdiction, infra node, repeat check,
--                                   complaint insert, embeddings, workflow mapping,
--                                   domain event. All-or-nothing.
--
-- MODIFIED CONSTRAINT:
--   complaint_embeddings.text_embedding   SET NOT NULL
--
-- NEW VIEW:
--   v_missing_embeddings            Ops monitoring: complaints missing text/image embeddings.
--                                   Polled by nightly backfill Cloud Function.
--
-- NEW INDEX:
--   idx_ce_model_version            Enables targeted re-embedding on model upgrade.
-- ============================================================
