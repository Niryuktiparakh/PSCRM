# backend/main.py
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import complaint_router, auth_router, stats_router
from routes.admin_router import router as admin_router
from routes import survey_router, worker_router
from routes import pubsub_router
from routes import infra_router

app = FastAPI(
    title="PSCRM Civic Intelligence API",
    description="Multi-Agent Event-Driven Civic Infrastructure Platform",
    version="1.0"
)

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


app.include_router(admin_router)
app.include_router(complaint_router.router)
app.include_router(auth_router.router)
app.include_router(stats_router.router)
app.include_router(survey_router.router)
app.include_router(worker_router.router)
app.include_router(pubsub_router.router)
app.include_router(infra_router.router)

@app.get("/")
def root():
    return {"status": "online", "message": "PSCRM Core Nervous System Active"}