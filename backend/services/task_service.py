# backend/services/task_service.py
import asyncio

from services.realtime_service import broadcast_event
from sqlalchemy.orm import Session
from sqlalchemy import text
from models import Task, Complaint, Contractor, WorkflowEvent, Notification
from datetime import datetime


def log_event(db: Session, complaint_id: int, event_type: str, agent: str, payload=None):
    event = WorkflowEvent(
        complaint_id=complaint_id,
        event_type=event_type,
        agent_name=agent,
        payload=payload
    )
    db.add(event)


def create_notification(db: Session, user_id, message, notification_type="task_update", meta=None):
    notification = Notification(
        user_id=user_id,
        message=message,
        notification_type=notification_type,
        meta=meta
    )
    db.add(notification)


def select_best_contractor(db: Session, department_id: int):
    """
    Simple heuristic for prototype.
    In production this becomes ML scoring.
    """

    contractor = db.query(Contractor)\
        .filter(Contractor.department_id == department_id)\
        .order_by(Contractor.rating.desc())\
        .first()

    return contractor


def select_employee_for_zone(db: Session, department_id: int, zone_id: int):
    """
    Finds an employee assigned to this zone + department.
    """

    query = text("""
        SELECT id
        FROM users
        WHERE role='employee'
        AND department_id=:department_id
        AND zone_id=:zone_id
        LIMIT 1
    """)

    result = db.execute(query, {
        "department_id": department_id,
        "zone_id": zone_id
    }).fetchone()

    if result:
        return result[0]

    return None


def create_task_for_complaint(db: Session, complaint_id: int):
    """
    Converts a complaint into a municipal task.
    """

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        return None

    contractor = select_best_contractor(db, complaint.department_id)

    employee_id = select_employee_for_zone(
        db,
        complaint.department_id,
        complaint.zone_id
    )

    task = Task(
        complaint_id=complaint.id,
        contractor_id=contractor.id if contractor else None,
        department_id=complaint.department_id,
        employee_id=employee_id,
        status="ASSIGNED"
    )

    db.add(task)

    complaint.status = "ASSIGNED"

    log_event(
        db,
        complaint.id,
        "TASK_CREATED",
        "TaskService",
        {
            "contractor_id": contractor.id if contractor else None,
            "employee_id": str(employee_id)
        }
    )

    create_notification(
        db,
        complaint.user_id,
        "Your complaint has been assigned to a repair team.",
        meta={"complaint_id": complaint.id}
    )

    db.commit()
    db.refresh(task)
    
    asyncio.create_task(

    broadcast_event({

        "type": "task_created",

        "data": {
            "task_id": task.id,
        }

    })
)

    return task


def update_task_status(db: Session, task_id: int, new_status: str, employee_id=None):
    """
    Employees update progress.
    """

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        return None

    task.status = new_status

    complaint = db.query(Complaint).filter(Complaint.id == task.complaint_id).first()

    if new_status == "IN_PROGRESS":
        complaint.status = "IN_PROGRESS"

    if new_status == "COMPLETED":

        complaint.status = "SURVEY_PENDING"
        task.completed_at = datetime.utcnow()

        contractor = db.query(Contractor).filter(
            Contractor.id == task.contractor_id
        ).first()

        if contractor:
            contractor.jobs_completed += 1

        create_notification(
            db,
            complaint.user_id,
            "Your complaint has been resolved. Please submit feedback.",
            "survey_request",
            {"complaint_id": complaint.id}
        )

    log_event(
        db,
        complaint.id,
        "TASK_STATUS_UPDATED",
        "TaskService",
        {"status": new_status}
    )

    db.commit()
    
    asyncio.create_task(

    broadcast_event({

        "type": "task_update",

        "data": {
            "task_id": task.id,
            "status": new_status
        }

    })
)

    return task