from pathlib import Path
import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, Header, HTTPException, Query, UploadFile
from services.complaint_service import (
    build_and_store_complaint,
    get_complaint_by_id,
    run_embedding_background_task,
)

router = APIRouter(prefix="/complaints", tags=["Complaints"])

VALID_USERNAME = "admin"
VALID_PASSWORD = "admin123"
BASE_DIR = Path(__file__).resolve().parents[1]
UPLOADS_DIR = BASE_DIR / "data" / "uploads"


def _get_auth_value(
    header_value: Optional[str],
    query_value: Optional[str],
) -> Optional[str]:
    return header_value if header_value is not None else query_value


def verify_simulated_auth(
    username_query: Optional[str] = Query(default=None, alias="username"),
    password_query: Optional[str] = Query(default=None, alias="password"),
    username_header: Optional[str] = Header(default=None, alias="username"),
    password_header: Optional[str] = Header(default=None, alias="password"),
) -> None:
    username = _get_auth_value(username_header, username_query)
    password = _get_auth_value(password_header, password_query)
    if username != VALID_USERNAME or password != VALID_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/")
async def ingest_complaint(
    background_tasks: BackgroundTasks,
    text: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    image: UploadFile = File(...),
    _: None = Depends(verify_simulated_auth),
):
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    cleaned_text = text.strip()
    if not cleaned_text:
        raise HTTPException(status_code=400, detail="Complaint text is required")

    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(status_code=400, detail="Invalid latitude/longitude")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    suffix = Path(image.filename or "upload.bin").suffix
    stored_image_path = UPLOADS_DIR / f"{uuid.uuid4()}{suffix}"
    stored_image_path.write_bytes(image_bytes)

    complaint = build_and_store_complaint(
        text=cleaned_text,
        image_bytes=image_bytes,
        image_content_type=image.content_type or "application/octet-stream",
        image_url=str(stored_image_path),
        lat=lat,
        lng=lng,
    )

    background_tasks.add_task(
        run_embedding_background_task,
        complaint["complaint_id"],
        complaint["text"],
        complaint["image_url"],
    )

    return complaint


@router.get("/{complaint_id}")
def fetch_complaint(
    complaint_id: str,
    _: None = Depends(verify_simulated_auth),
):
    complaint = get_complaint_by_id(complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint
