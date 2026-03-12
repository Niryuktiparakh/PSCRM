# backend/services/dashboard_service.py
from sqlalchemy.orm import Session
from sqlalchemy import text
from schemas import TokenData


def get_dashboard_data(db: Session, user: TokenData):

    role = user.role

    if role == "super_admin":
        return super_admin_dashboard(db, user)

    if role == "admin":
        return admin_dashboard(db, user)

    if role == "employee":
        return employee_dashboard(db, user)

    return citizen_dashboard(db, user)


# ---------------- SUPER ADMIN ---------------- #

def super_admin_dashboard(db: Session, user: TokenData):

    query = text("""
        SELECT
        COUNT(*) FILTER (WHERE status='NEW') as new,
        COUNT(*) FILTER (WHERE status='IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE status='RESOLVED') as resolved
        FROM complaints
        WHERE department_id = (
            SELECT department_id FROM users WHERE id=:uid
        )
    """)

    row = db.execute(query, {"uid": str(user.user_id)}).fetchone()

    return {
        "new": row[0],
        "in_progress": row[1],
        "resolved": row[2]
    }


# ---------------- ZONE ADMIN ---------------- #

def admin_dashboard(db: Session, user: TokenData):

    query = text("""
        SELECT
        COUNT(*) FILTER (WHERE status='NEW'),
        COUNT(*) FILTER (WHERE status='IN_PROGRESS'),
        COUNT(*) FILTER (WHERE status='RESOLVED')
        FROM complaints
        WHERE zone_id = (
            SELECT zone_id FROM users WHERE id=:uid
        )
    """)

    row = db.execute(query, {"uid": str(user.user_id)}).fetchone()

    return {
        "new": row[0],
        "in_progress": row[1],
        "resolved": row[2]
    }


# ---------------- EMPLOYEE ---------------- #

def employee_dashboard(db: Session, user: TokenData):

    query = text("""
        SELECT
        COUNT(*) FILTER (WHERE status='ASSIGNED'),
        COUNT(*) FILTER (WHERE status='IN_PROGRESS'),
        COUNT(*) FILTER (WHERE status='COMPLETED')
        FROM tasks
        WHERE employee_id=:uid
    """)

    row = db.execute(query, {"uid": str(user.user_id)}).fetchone()

    return {
        "assigned": row[0],
        "in_progress": row[1],
        "completed": row[2]
    }


# ---------------- CITIZEN ---------------- #

def citizen_dashboard(db: Session, user: TokenData):

    query = text("""
        SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status='RESOLVED')
        FROM complaints
        WHERE user_id=:uid
    """)

    row = db.execute(query, {"uid": str(user.user_id)}).fetchone()

    return {
        "total_complaints": row[0],
        "resolved": row[1]
    }