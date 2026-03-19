# backend/services/embedding_service.py

from pathlib import Path
from typing import Any, Dict, List

from nomic import embed
import numpy as np
from PIL import Image


def _extract_first_embedding(result: Dict[str, Any]) -> List[float]:
    vectors = result.get("embeddings")
    if not vectors:
        raise ValueError("No embeddings returned by model")
    return np.array(vectors)[0].tolist()


def create_text_embedding_vector(text: str) -> List[float]:
    """Generate a 768D text embedding with Nomic text model."""
    output = embed.text(
        texts=[text],
        model="nomic-embed-text-v1.5",
        task_type="search_document",
        dimensionality=768,
    )
    return _extract_first_embedding(output)


def create_image_embedding_vector(image_path: str) -> List[float]:
    """Generate image embedding with Nomic vision model using path/PIL fallbacks."""
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    errors: List[str] = []

    # First attempt: file path string input
    try:
        output = embed.image(
            images=[str(path)],
            model="nomic-embed-vision-v1.5",
        )
        return _extract_first_embedding(output)
    except Exception as exc:
        errors.append(f"path-input failed: {exc}")

    # Second attempt: PIL image input
    try:
        with Image.open(path) as img:
            output = embed.image(
                images=[img.convert("RGB")],
                model="nomic-embed-vision-v1.5",
            )
        return _extract_first_embedding(output)
    except Exception as exc:
        errors.append(f"pil-input failed: {exc}")

    raise RuntimeError("Image embedding failed. " + " | ".join(errors))