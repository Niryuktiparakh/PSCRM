# Backend Architecture

This document describes the backend-only structure and the role of each file.

## Folder Tree

```text
backend/
|-- ARCHITECTURE.md
|-- .env
|-- .gitignore
|-- config.py
|-- db.py
|-- dependencies.py
|-- main.py
|-- models.py
|-- schemas.py
|-- requirements.txt
|-- agents/
|   |-- __init__.py
|   |-- event_worker.py
|   |-- notification_agent.py
|   |-- orchestrator.py
|   |-- predictive_agent.py
|   |-- predictive_node.py
|   |-- routing_agent.py
|   |-- state.py
|   |-- task_agent.py
|   \-- __pycache__/
|-- data/
|   |-- complaints/
|   |   |-- 022c4075-1fca-4275-9213-fb026b2cf197.json
|   |   |-- 473ed5a5-7c00-46bd-9584-fdeb7d3b687a.json
|   |   |-- 557cc27a-e356-4ebd-82cf-aff5f5a6834e.json
|   |   |-- 8ab6eb19-604c-4211-9e52-a059f7472130.json
|   |   \-- cbfe1369-b7a1-4a60-b8f6-07226eda6008.json
|   |-- embeddings/
|   |   |-- 557cc27a-e356-4ebd-82cf-aff5f5a6834e.json
|   |   |-- 8ab6eb19-604c-4211-9e52-a059f7472130.json
|   |   \-- cbfe1369-b7a1-4a60-b8f6-07226eda6008.json
|   \-- uploads/
|       |-- 1beda2b8-d05a-46cd-9f29-f0104b460817.jpg
|       |-- 46c4d3c5-8419-4ca4-b720-c1da89c47c8e.jpg
|       |-- 750d0df9-8a8e-41f6-b990-81afe1b2c3ac.jpg
|       |-- 9626e338-fed6-408e-ada5-4eecfff41187.jpg
|       |-- c3aa223e-f0ba-4fc1-904b-928f64a96520.png
|       |-- e2ea70b9-8334-4097-becc-8e6aaa309226.jpg
|       \-- f1033a11-bd12-4029-ba51-dcf9685de88b.jpg
|-- psrm/
|   |-- pyvenv.cfg
|   |-- Include/
|   |-- Lib/
|   \-- Scripts/
|-- realtime/
|   |-- connection_manager.py
|   \-- __pycache__/
|-- routes/
|   |-- __init__.py
|   |-- admin.py
|   |-- analytics.py
|   |-- assets.py
|   |-- assistant.py
|   |-- auth_router.py
|   |-- complaint_router.py
|   |-- complaints.py
|   |-- dashboard.py
|   |-- surveys.py
|   |-- task.py
|   |-- ws.py
|   \-- __pycache__/
|-- services/
|   |-- __init__.py
|   |-- analytics_service.py
|   |-- assistant_service.py
|   |-- assistant_tools.py
|   |-- complaint_service.py
|   |-- dashboard_service.py
|   |-- embedding_service.py
|   |-- gemini_service.py
|   |-- geo_service.py
|   |-- image_service.py
|   |-- infrastructure_service.py
|   |-- notification_service.py
|   |-- predictive_service.py
|   |-- realtime_service.py
|   |-- rule_engine.py
|   |-- status_service.py
|   |-- survey_service.py
|   |-- task_service.py
|   \-- __pycache__/
\-- __pycache__/
```

## File Responsibilities

### Root backend files

- `.env`: Environment variables for secrets and runtime configuration.
- `.gitignore`: Ignore rules for generated files and local-only artifacts.
- `config.py`: Central settings loader (database URL, API keys, Supabase and model configs).
- `db.py`: SQLAlchemy engine/session setup and declarative base definition.
- `dependencies.py`: Shared FastAPI dependencies, including auth token parsing/validation.
- `main.py`: FastAPI application entrypoint, CORS config, and router registration.
- `models.py`: SQLAlchemy ORM models and enums for core domain entities.
- `schemas.py`: Pydantic schemas used for request validation and response serialization.
- `requirements.txt`: Python dependencies for backend runtime.

### agents/

- `agents/__init__.py`: Package marker for the agents module.
- `agents/event_worker.py`: Background worker that listens/processes complaint events.
- `agents/notification_agent.py`: Agent node that builds and emits notification actions.
- `agents/orchestrator.py`: LangGraph-style orchestrator connecting all agent nodes.
- `agents/predictive_agent.py`: Predictive logic (hotspot/cluster style analysis from complaint data).
- `agents/predictive_node.py`: Wrapper node that integrates predictive agent into the graph flow.
- `agents/routing_agent.py`: Interprets complaint context and decides downstream routing.
- `agents/state.py`: Shared workflow state type/schema for multi-agent execution.
- `agents/task_agent.py`: Agent node that creates/updates task actions from routed state.

### data/

- `data/complaints/`: Stored complaint payloads as JSON.
- `data/embeddings/`: Stored embedding vectors and related metadata JSON.
- `data/uploads/`: Uploaded complaint media files (images).

### psrm/

- `psrm/`: Nested Python virtual environment folder inside backend (interpreter, libs, scripts).

### realtime/

- `realtime/connection_manager.py`: Tracks active WebSocket connections and supports targeted/broadcast sends.

### routes/

- `routes/__init__.py`: Package marker for route modules.
- `routes/admin.py`: Placeholder for admin routes (currently minimal/empty).
- `routes/analytics.py`: API endpoints for analytics dashboards and metric retrieval.
- `routes/assets.py`: Placeholder for infrastructure/assets endpoints (currently minimal/empty).
- `routes/assistant.py`: API endpoint(s) for AI assistant queries.
- `routes/auth_router.py`: Authentication endpoint(s), login and token-related flow.
- `routes/complaint_router.py`: Main complaint submission/retrieval routes.
- `routes/complaints.py`: Additional complaint-related route handlers (legacy/alternate split).
- `routes/dashboard.py`: Dashboard data endpoints by user role/context.
- `routes/surveys.py`: Survey/feedback submission and retrieval endpoints.
- `routes/task.py`: Task assignment/tracking endpoints.
- `routes/ws.py`: WebSocket route endpoint wiring.

### services/

- `services/__init__.py`: Package marker for service layer.
- `services/analytics_service.py`: Business logic for analytics queries and aggregation.
- `services/assistant_service.py`: Orchestrates assistant model calls and response composition.
- `services/assistant_tools.py`: Helper tools/functions exposed to assistant workflows.
- `services/complaint_service.py`: Complaint business logic, persistence, and background processing hooks.
- `services/dashboard_service.py`: Dashboard aggregate generation for role-specific views.
- `services/embedding_service.py`: Embedding generation and storage integration.
- `services/gemini_service.py`: Wrapper utilities for Gemini model interactions.
- `services/geo_service.py`: Geospatial helper logic (lookup, nearest, coordinate operations).
- `services/image_service.py`: Image preprocessing/analysis used in complaint workflows.
- `services/infrastructure_service.py`: Infrastructure-related analysis and zone/asset logic.
- `services/notification_service.py`: Notification creation and delivery coordination.
- `services/predictive_service.py`: Predictive processing loop and model execution flow.
- `services/realtime_service.py`: Realtime message dispatch helpers (WebSocket integration).
- `services/rule_engine.py`: Rule-based routing/classification support logic.
- `services/status_service.py`: Status history updates and complaint lifecycle state handling.
- `services/survey_service.py`: Survey persistence and scoring/feedback processing.
- `services/task_service.py`: Task lifecycle business logic (create, assign, update).

## Notes

- `__pycache__/` directories contain Python bytecode cache files generated at runtime.
- The backend includes both `routes/complaint_router.py` and `routes/complaints.py`; this usually indicates split responsibilities or legacy/transition routing.
