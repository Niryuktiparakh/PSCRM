# backend/services/complaint_service.py
import asyncio

from services.realtime_service import broadcast_event
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Complaint, WorkflowEvent, Notification
from services.notification_service import create_notification
from services.infrastructure_service import detect_zone
from services.embedding_service import create_complaint_embedding
from services.image_service import analyze_complaint_image
from agents.orchestrator import run_civic_workflow

def create_workflow_event(
    db: Session,
    complaint_id: int,
    event_type: str,
    agent_name: str,
    payload: dict = None
):
    """
    Logs workflow events so we can visualize system behavior.
    """

    event = WorkflowEvent(
        complaint_id=complaint_id,
        event_type=event_type,
        agent_name=agent_name,
        payload=payload
    )

    db.add(event)


def create_complaint(
    db: Session,
    user_id,
    text: str,
    lat: float,
    lng: float,
    photo_url: str = None
):
    """
    Main complaint ingestion logic.
    """

    # Convert location to PostGIS format
    point_wkt = f"SRID=4326;POINT({lng} {lat})"

    # Detect zone
    zone_id = detect_zone(db, lat, lng)
    
    

    complaint = Complaint(
        user_id=user_id,
        text=text,
        location=point_wkt,
        photo_url=photo_url,
        status="NEW",
        zone_id=zone_id
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    
    create_complaint_embedding(db, complaint.id, text)

    if photo_url:
        image_data = analyze_complaint_image(photo_url, text)

        # Log event
    create_workflow_event(
        db,
        complaint.id,
        "COMPLAINT_RECEIVED",
        "ComplaintService"
    )

    # Notify citizen
    create_notification(
        db,
        user_id,
        "Your complaint has been registered and is being processed.",
        "complaint_created",
        {"complaint_id": complaint.id}
    )

    db.commit()
    
    asyncio.create_task(

    broadcast_event({

        "type": "complaint_created",

        "data": {
            "complaint_id": complaint.id,
            "lat": lat,
            "lng": lng,
            "status": complaint.status
        }

    })
)

    # Trigger routing agent (async style)
    run_civic_workflow(
        complaint_id=complaint.id,
        text=text,
        lat=lat,
        lng=lng
    )

    return complaint

