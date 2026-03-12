# backend/routes/analytics.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db import get_db
from dependencies import get_current_user
from schemas import TokenData

from services.analytics_service import (
    complaints_heatmap,
    complaints_by_department,
    zone_complaint_distribution,
    contractor_performance,
    infrastructure_alerts,
    sla_metrics
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/heatmap")
def heatmap(
    db: Session = Depends(get_db),
    user: TokenData = Depends(get_current_user)
):
    return complaints_heatmap(db)


@router.get("/departments")
def department_stats(
    db: Session = Depends(get_db),
    user: TokenData = Depends(get_current_user)
):
    return complaints_by_department(db)


@router.get("/zones")
def zone_stats(
    db: Session = Depends(get_db),
    user: TokenData = Depends(get_current_user)
):
    return zone_complaint_distribution(db)


@router.get("/contractors")
def contractor_stats(
    db: Session = Depends(get_db),
    user: TokenData = Depends(get_current_user)
):
    return contractor_performance(db)


@router.get("/alerts")
def alerts(
    db: Session = Depends(get_db),
    user: TokenData = Depends(get_current_user)
):
    return infrastructure_alerts(db)


@router.get("/sla")
def sla(
    db: Session = Depends(get_db),
    user: TokenData = Depends(get_current_user)
):
    return sla_metrics(db)