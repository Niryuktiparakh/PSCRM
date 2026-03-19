from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])

VALID_USERNAME = "admin"
VALID_PASSWORD = "admin123"
SIMULATED_TOKEN = "simulated-token-abc123"


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(payload: LoginRequest):
    if payload.username != VALID_USERNAME or payload.password != VALID_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "token": SIMULATED_TOKEN,
        "token_type": "Bearer",
    }
