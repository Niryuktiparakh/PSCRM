import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from services.embedding_service import create_image_embedding_vector, create_text_embedding_vector

BASE_DIR = Path(__file__).resolve().parents[1]
COMPLAINTS_DIR = BASE_DIR / "data" / "complaints"
EMBEDDINGS_DIR = BASE_DIR / "data" / "embeddings"


def _ensure_data_dirs() -> None:
    COMPLAINTS_DIR.mkdir(parents=True, exist_ok=True)
    EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)


def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=True)


def build_and_store_complaint(
    text: str,
    image_bytes: bytes,
    image_content_type: str,
    image_url: str,
    lat: float,
    lng: float,
) -> Dict[str, Any]:
    """Store complaint as JSON without DB/LLM classification dependencies."""
    _ensure_data_dirs()

    complaint_id = str(uuid.uuid4())

    complaint_payload: Dict[str, Any] = {
        "complaint_id": complaint_id,
        "text": text.strip(),
        "image_url": image_url,
        "image_content_type": image_content_type,
        "image_size_bytes": len(image_bytes),
        "lat": lat,
        "lng": lng,
        "status": "INGESTED",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    _write_json(COMPLAINTS_DIR / f"{complaint_id}.json", complaint_payload)
    return complaint_payload


def get_complaint_by_id(complaint_id: str) -> Optional[Dict[str, Any]]:
    _ensure_data_dirs()
    path = COMPLAINTS_DIR / f"{complaint_id}.json"
    if not path.exists():
        return None

    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def run_embedding_background_task(complaint_id: str, text: str, image_url: str) -> None:
    """Generate text and image embeddings in background and persist sidecar JSON."""

    _ensure_data_dirs()

    try:
        text_embedding = create_text_embedding_vector(text)
        image_embedding = create_image_embedding_vector(image_url)

        payload: Dict[str, Any] = {
            "complaint_id": complaint_id,
            "status": "COMPLETED",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "text_embedding": text_embedding,
            "image_embedding": image_embedding,
        }

        _write_json(EMBEDDINGS_DIR / f"{complaint_id}.json", payload)
    except Exception as exc:
        _write_json(
            EMBEDDINGS_DIR / f"{complaint_id}.json",
            {
                "complaint_id": complaint_id,
                "status": "FAILED",
                "error": str(exc),
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )
