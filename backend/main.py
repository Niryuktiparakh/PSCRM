# backend/main.py
import logging
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError

from db import SessionLocal
from routes import complaint_router, auth_router, stats_router
from routes.admin_router import router as admin_router
from routes import survey_router, worker_router
from routes import pubsub_router
from routes import infra_router

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

app = FastAPI(
    title="PSCRM Civic Intelligence API",
    description="Multi-Agent Event-Driven Civic Infrastructure Platform",
    version="1.0",
)

# ── CORS ──────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────

app.include_router(admin_router)
app.include_router(complaint_router.router)
app.include_router(auth_router.router)
app.include_router(stats_router.router)
app.include_router(survey_router.router)
app.include_router(worker_router.router)
app.include_router(pubsub_router.router)
app.include_router(infra_router.router)


# ── Startup schema check ──────────────────────────────────────────

@app.on_event("startup")
def startup_schema_check():
    sentinel_queries = [
        "SELECT 1 FROM complaints LIMIT 0",
        "SELECT 1 FROM infra_nodes LIMIT 0",
        "SELECT 1 FROM tasks LIMIT 0",
        "SELECT 1 FROM workflow_instances LIMIT 0",
        "SELECT 1 FROM users LIMIT 0",
    ]
    db = SessionLocal()
    try:
        for q in sentinel_queries:
            db.execute(text(q))
        logger.info("✅ Schema compatibility check passed")
    except (ProgrammingError, OperationalError) as exc:
        logger.critical("❌ Schema check FAILED — %s", exc)
        sys.exit(1)
    except Exception as exc:
        logger.warning("Schema check warning (non-fatal): %s", exc)
    finally:
        db.close()


# ── Health ────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "online", "message": "PSCRM Core Nervous System Active"}


@app.get("/health")
def health():
    return {"status": "ok"}