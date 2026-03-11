# backend/models.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, DECIMAL, Boolean, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from db import Base

# Enums
ComplaintStatus = ENUM('NEW', 'CLASSIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'SURVEY_PENDING', 'ESCALATED', 'REOPENED', name='complaint_status_enum', create_type=False)
TaskStatus = ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', name='task_status_enum', create_type=False)
Urgency = ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='urgency_enum', create_type=False)

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    role = Column(String(50), default="citizen")
    name = Column(String(255))
    phone = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    department_id = Column(Integer, ForeignKey("departments.id"))
    zone_id = Column(Integer, ForeignKey("zones.id"))
    designation = Column(String(100))

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Contractor(Base):
    __tablename__ = "contractors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    rating = Column(DECIMAL(3,2), default=5.00)
    department_id = Column(Integer, ForeignKey("departments.id"))
    jobs_completed = Column(Integer, default=0)
    avg_completion_time = Column(Integer, default=0)
    complaints_reopened = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    asset_type = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    ward = Column(String(100))
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    text = Column(Text, nullable=False)
    urgency = Column(Urgency, default='MEDIUM')
    status = Column(ComplaintStatus, default='NEW')
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    photo_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    zone_id = Column(Integer, ForeignKey("zones.id"))

class WorkflowEvent(Base):
    __tablename__ = "workflow_events"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    event_type = Column(String(100), nullable=False)
    agent_name = Column(String(100), nullable=False)
    payload = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    contractor_id = Column(Integer, ForeignKey("contractors.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    status = Column(TaskStatus, default='PENDING')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

class InfrastructureAlert(Base):
    __tablename__ = "infrastructure_alerts"
    id = Column(Integer, primary_key=True, index=True)
    issue_type = Column(String(100))
    cluster_size = Column(Integer)
    location = Column(Geography(geometry_type='POINT', srid=4326))
    ward = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ComplaintAnalysis(Base):
    __tablename__ = "complaint_analysis"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    asset_type = Column(String(100))
    urgency = Column(String(50))
    departments = Column(ARRAY(Integer))
    llm_output = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    
    
class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    department_id = Column(Integer, ForeignKey("departments.id"))
    boundary = Column(Geography(geometry_type="POLYGON", srid=4326))
    created_at = Column(DateTime(timezone=True), server_default=func.now())