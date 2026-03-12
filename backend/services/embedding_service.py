# backend/services/embedding_service.py
# backend/services/embedding_service.py

from sqlalchemy.orm import Session
from models import ComplaintEmbedding
from nomic import embed
import numpy as np


def create_complaint_embedding(db: Session, complaint_id: int, text: str):
    """
    Generates a 768 dimensional embedding using Nomic.
    """

    output = embed.text(
        texts=[text],
        model="nomic-embed-text-v1.5",
        task_type="search_document",
        dimensionality=768
    )

    vector = np.array(output["embeddings"])[0].tolist()

    embedding = ComplaintEmbedding(
        complaint_id=complaint_id,
        embedding=vector
    )

    db.add(embedding)
    db.commit()

    return embedding