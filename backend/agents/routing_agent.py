# backend/agents/routing_agent.py
from sqlalchemy import text

def handle_routing(db,payload):

    complaint_id = payload["complaint_id"]

    db.execute(text("""
        UPDATE complaints
        SET status='ASSIGNED'
        WHERE id=:id
    """),{"id":complaint_id})

    db.execute(text("""
        INSERT INTO workflow_events
        (complaint_id,event_type,agent_name)
        VALUES (:id,'ROUTED','RoutingAgent')
    """),{"id":complaint_id})

    db.commit()