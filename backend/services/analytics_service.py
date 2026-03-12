# backend/services/analytics_service.py
from sqlalchemy.orm import Session
from sqlalchemy import text


def complaints_heatmap(db: Session):
    """
    Returns complaint coordinates for map heatmap.
    """

    query = text("""
        SELECT
        id,
        ST_X(location::geometry) as lng,
        ST_Y(location::geometry) as lat,
        status,
        urgency
        FROM complaints
    """)

    rows = db.execute(query).fetchall()

    return [
        {
            "id": r[0],
            "lat": r[2],
            "lng": r[1],
            "status": r[3],
            "urgency": r[4]
        }
        for r in rows
    ]


def complaints_by_department(db: Session):
    """
    Department workload stats.
    """

    query = text("""
        SELECT
        d.name,
        COUNT(c.id) as total_complaints,
        SUM(CASE WHEN c.status='RESOLVED' THEN 1 ELSE 0 END) as resolved
        FROM complaints c
        JOIN departments d ON c.department_id=d.id
        GROUP BY d.name
    """)

    rows = db.execute(query).fetchall()

    return [
        {
            "department": r[0],
            "total": r[1],
            "resolved": r[2]
        }
        for r in rows
    ]


def zone_complaint_distribution(db: Session):
    """
    Shows workload across zones.
    """

    query = text("""
        SELECT
        z.name,
        COUNT(c.id)
        FROM complaints c
        JOIN zones z ON c.zone_id=z.id
        GROUP BY z.name
    """)

    rows = db.execute(query).fetchall()

    return [
        {
            "zone": r[0],
            "complaints": r[1]
        }
        for r in rows
    ]


def contractor_performance(db: Session):
    """
    Contractor efficiency metrics.
    """

    query = text("""
        SELECT
        name,
        rating,
        jobs_completed,
        avg_completion_time,
        complaints_reopened
        FROM contractors
    """)

    rows = db.execute(query).fetchall()

    return [
        {
            "contractor": r[0],
            "rating": float(r[1]),
            "jobs_completed": r[2],
            "avg_completion_time": r[3],
            "reopened": r[4]
        }
        for r in rows
    ]


def infrastructure_alerts(db: Session):
    """
    Returns cluster alerts detected by predictive agent.
    """

    query = text("""
        SELECT
        id,
        issue_type,
        cluster_size,
        ST_X(location::geometry) as lng,
        ST_Y(location::geometry) as lat
        FROM infrastructure_alerts
    """)

    rows = db.execute(query).fetchall()

    return [
        {
            "alert_id": r[0],
            "issue": r[1],
            "cluster_size": r[2],
            "lat": r[4],
            "lng": r[3]
        }
        for r in rows
    ]


def sla_metrics(db: Session):
    """
    Basic resolution performance.
    """

    query = text("""
        SELECT
        COUNT(*) FILTER (WHERE status='RESOLVED') as resolved,
        COUNT(*) FILTER (WHERE status!='RESOLVED') as pending,
        COUNT(*) as total
        FROM complaints
    """)

    row = db.execute(query).fetchone()

    return {
        "resolved": row[0],
        "pending": row[1],
        "total": row[2]
    }