# backend/routes/complaints.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db import get_db
from schemas import ComplaintCreate, ComplaintResponse, TokenData
from dependencies import get_current_user
from services.complaint_service import create_complaint

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


@router.post("/", response_model=ComplaintResponse)
def create_new_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):

    complaint = create_complaint(
        db=db,
        user_id=current_user.user_id,
        text=data.text,
        lat=data.lat,
        lng=data.lng,
        photo_url=data.photo_url
    )

    return ComplaintResponse(
        id=complaint.id,
        status=complaint.status,
        message="Complaint received. Routing agent activated."
    )