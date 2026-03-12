# backend/models.py
# backend/models.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, DECIMAL, Boolean, ARRAY, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from db import Base


# ---------------- ENUM TYPES ---------------- #

ComplaintStatus = ENUM(
    'NEW',
    'CLASSIFIED',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESOLVED',
    'SURVEY_PENDING',
    'ESCALATED',
    'REOPENED',
    name='complaint_status_enum',
    create_type=False
)

TaskStatus = ENUM(
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    name='task_status_enum',
    create_type=False
)

Urgency = ENUM(
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL',
    name='urgency_enum',
    create_type=False
)


# ---------------- USERS ---------------- #

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    role = Column(String(50), default="citizen")
    name = Column(String(255))
    phone = Column(String(20))

    department_id = Column(Integer, ForeignKey("departments.id"))
    zone_id = Column(Integer, ForeignKey("zones.id"))
    designation = Column(String(100))

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- DEPARTMENTS ---------------- #

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- CONTRACTORS ---------------- #

class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(Integer, primary_key=True)

    name = Column(String(255), nullable=False)
    rating = Column(DECIMAL(3,2), default=5.00)

    department_id = Column(Integer, ForeignKey("departments.id"))

    jobs_completed = Column(Integer, default=0)
    avg_completion_time = Column(Integer, default=0)
    complaints_reopened = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- ZONES ---------------- #

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True)
    name = Column(String(255))

    department_id = Column(Integer, ForeignKey("departments.id"))

    boundary = Column(Geography(geometry_type="POLYGON", srid=4326))

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- ASSETS ---------------- #

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True)

    asset_type = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))

    ward = Column(String(100))

    location = Column(
        Geography(geometry_type="POINT", srid=4326),
        nullable=False
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- COMPLAINTS ---------------- #

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    text = Column(Text, nullable=False)

    urgency = Column(Urgency, default="MEDIUM")
    status = Column(ComplaintStatus, default="NEW")

    location = Column(
        Geography(geometry_type="POINT", srid=4326),
        nullable=False
    )

    asset_id = Column(Integer, ForeignKey("assets.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))

    zone_id = Column(Integer, ForeignKey("zones.id"))

    photo_url = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ---------------- WORKFLOW EVENTS ---------------- #

class WorkflowEvent(Base):
    __tablename__ = "workflow_events"

    id = Column(Integer, primary_key=True)

    complaint_id = Column(Integer, ForeignKey("complaints.id"))

    event_type = Column(String(100), nullable=False)
    agent_name = Column(String(100), nullable=False)

    payload = Column(JSONB)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- TASKS ---------------- #

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)

    complaint_id = Column(Integer, ForeignKey("complaints.id"))

    contractor_id = Column(Integer, ForeignKey("contractors.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))

    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    status = Column(TaskStatus, default="PENDING")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))


# ---------------- FEEDBACK ---------------- #

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True)

    complaint_id = Column(Integer, ForeignKey("complaints.id"))

    rating = Column(Integer)
    comment = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- NOTIFICATIONS ---------------- #

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    message = Column(Text, nullable=False)

    is_read = Column(Boolean, default=False)

    notification_type = Column(String(50))
    
    # FIX: Renamed the Python attribute to meta_data to avoid the reserved keyword collision.
    # It still points to the "metadata" column in your PostgreSQL database.
    meta_data = Column("metadata", JSONB)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- INFRASTRUCTURE ALERTS ---------------- #

class InfrastructureAlert(Base):
    __tablename__ = "infrastructure_alerts"

    id = Column(Integer, primary_key=True)

    issue_type = Column(String(100))
    cluster_size = Column(Integer)

    location = Column(
        Geography(geometry_type="POINT", srid=4326)
    )

    ward = Column(String(100))

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- COMPLAINT ANALYSIS ---------------- #

class ComplaintAnalysis(Base):
    __tablename__ = "complaint_analysis"

    id = Column(Integer, primary_key=True)

    complaint_id = Column(Integer, ForeignKey("complaints.id"))

    asset_type = Column(String(100))
    urgency = Column(String(50))

    departments = Column(ARRAY(Integer))

    llm_output = Column(JSONB)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- EVENT QUEUE ---------------- #

class EventQueue(Base):
    __tablename__ = "event_queue"

    id = Column(Integer, primary_key=True)

    event_type = Column(String(100))

    payload = Column(JSONB)

    processed = Column(Boolean, default=False)

    retries = Column(Integer, default=0)

    last_error = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- COMPLAINT STATUS HISTORY ---------------- #

class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(Integer, primary_key=True)

    complaint_id = Column(Integer, ForeignKey("complaints.id"))

    status = Column(String(50))
    changed_by = Column(String(100))

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------- COMPLAINT EMBEDDINGS ---------------- #

class ComplaintEmbedding(Base):
    __tablename__ = "complaint_embeddings"

    id = Column(Integer, primary_key=True)

    complaint_id = Column(Integer, ForeignKey("complaints.id"))

    # FIX: Uses SQLAlchemy's Float instead of Python's built-in float
    embedding = Column(ARRAY(Float))