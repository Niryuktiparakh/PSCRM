# backend/services/start_service.py
from models import ComplaintStatusHistory

def log_status_change(db, complaint_id, status, actor):

    history = ComplaintStatusHistory(
        complaint_id=complaint_id,
        status=status,
        changed_by=actor
    )

    db.add(history)