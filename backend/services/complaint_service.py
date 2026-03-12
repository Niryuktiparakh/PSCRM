# backend/services/complaint_service.py
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Complaint, WorkflowEvent, Notification
from agents.routing_agent import run_routing_agent


def detect_zone(db: Session, lat: float, lng: float):
    """
    Finds which zone the complaint belongs to using spatial containment.
    """

    query = text("""
        SELECT id
        FROM zones
        WHERE ST_Contains(
            boundary,
            ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography
        )
        LIMIT 1
    """)

    result = db.execute(query, {"lat": lat, "lng": lng}).fetchone()

    if result:
        return result[0]

    return None


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


def create_notification(
    db: Session,
    user_id,
    message: str,
    notification_type: str = "info",
    metadata: dict = None
):
    """
    Stores notifications for citizen/admin dashboards.
    """

    notification = Notification(
        user_id=user_id,
        message=message,
        notification_type=notification_type,
        metadata=metadata
    )

    db.add(notification)


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

    # Trigger routing agent (async style)
    run_routing_agent(
        complaint_id=complaint.id,
        text=text,
        lat=lat,
        lng=lng
    )

    return complaint