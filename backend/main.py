# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import task,analytics,ws,dashboard,assistant
from routes import complaint_router, auth_router
from routes import surveys


app = FastAPI(
    title="PSCRM Civic Intelligence API",
    description="Multi-Agent Event-Driven Civic Infrastructure Platform",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(ws.router)
app.include_router(complaint_router.router)
app.include_router(auth_router.router)
app.include_router(task.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(surveys.router)

app.include_router(assistant.router)
@app.get("/")
def root():
    return {"status": "online", "message": "PSCRM Core Nervous System Active"}