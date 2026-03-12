# backend/services/assistant_tools.py
from sqlalchemy.orm import Session
from services.analytics_service import (
    complaints_by_department,
    zone_complaint_distribution,
    contractor_performance,
    complaints_heatmap
)

def tool_department_stats(db: Session):
    return complaints_by_department(db)

def tool_zone_stats(db: Session):
    return zone_complaint_distribution(db)

def tool_contractor_stats(db: Session):
    return contractor_performance(db)

def tool_complaint_heatmap(db: Session):
    return complaints_heatmap(db)

def tool_slowest_contractors(db):

    rows = db.execute(text("""
    SELECT name, avg_completion_time
    FROM contractors
    ORDER BY avg_completion_time DESC
    LIMIT 5
    """)).fetchall()

    return rows

def tool_unresolved_complaints(db):

    rows = db.execute(text("""
    SELECT id, text
    FROM complaints
    WHERE status!='RESOLVED'
    LIMIT 20
    """)).fetchall()

    return rows

