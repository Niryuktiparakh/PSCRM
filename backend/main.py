# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import complaints,task,analytics,ws,dashboard,assistant
from db import Base, engine
from routes import surveys

from services.predictive_service import predictive_loop
import threading

threading.Thread(target=predictive_loop, daemon=True).start()
# Ensure tables are created (though you already ran the raw SQL, this is good practice)
Base.metadata.create_all(bind=engine)


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
app.include_router(complaints.router)
app.include_router(task.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(surveys.router)

app.include_router(assistant.router)
@app.get("/")
def root():
    return {"status": "online", "message": "PSCRM Core Nervous System Active"}