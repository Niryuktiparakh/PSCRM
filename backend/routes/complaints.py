# backend/routes/complaints.py
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db
from schemas import ComplaintCreate, ComplaintResponse, TokenData
from dependencies import get_current_user
from models import Complaint
from agents.routing_agent import run_routing_agent

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

@router.post("/", response_model=ComplaintResponse)
def create_complaint(
    data: ComplaintCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user) # JWT Auth injected here
):
    # 1. Insert Raw Complaint (NEW Status)
    point_wkt = f"SRID=4326;POINT({data.lng} {data.lat})"
    
    new_complaint = Complaint(
        user_id=current_user.user_id,
        text=data.text,
        location=point_wkt,
        status='NEW'
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    # 2. Trigger LangGraph Orchestrator Asynchronously
    background_tasks.add_task(
        run_routing_agent, 
        complaint_id=new_complaint.id, 
        text=data.text, 
        lat=data.lat, 
        lng=data.lng
    )

    return ComplaintResponse(
        id=new_complaint.id, 
        status="NEW", 
        message="Complaint received. AI Routing Agent activated."
    )