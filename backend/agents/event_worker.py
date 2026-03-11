# backend/agents/event_worker.py
import time
from sqlalchemy import text
from db import SessionLocal
from agents.routing_agent import handle_routing

def run_worker():

    db = SessionLocal()

    while True:

        events = db.execute(text("""
            SELECT id,event_type,payload
            FROM event_queue
            WHERE processed=false
            LIMIT 5
        """)).fetchall()

        for e in events:

            if e.event_type == "COMPLAINT_RECEIVED":
                handle_routing(db,e.payload)

            db.execute(text("""
                UPDATE event_queue
                SET processed=true
                WHERE id=:id
            """),{"id":e.id})

            db.commit()

        time.sleep(2)