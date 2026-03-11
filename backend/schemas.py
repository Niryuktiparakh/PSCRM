# backend/schemas.py
from pydantic import BaseModel, UUID4
from typing import Optional

class ComplaintCreate(BaseModel):
    text: str
    lat: float
    lng: float
    photo_url: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: int
    status: str
    message: str

class TokenData(BaseModel):
    user_id: UUID4
    role: str