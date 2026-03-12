# backend/routes/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import get_db
from schemas import TokenData
from dependencies import get_current_user
from services.dashboard_service import get_dashboard_data

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    user: TokenData = Depends(get_current_user)
):

    data = get_dashboard_data(db, user)

    return data


