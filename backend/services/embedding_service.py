# backend/services/embedding_service.py
from sqlalchemy.orm import Session
from models import ComplaintEmbedding
from langchain_nomic import NomicEmbeddings
from config import settings

embedder = NomicEmbeddings(
    model="nomic-embed-text-v1",
    api_key=settings.NOMIC_API_KEY
)

def create_complaint_embedding(db: Session, complaint_id: int, text: str):

    vector = embedder.embed_query(text)

    embedding = ComplaintEmbedding(
        complaint_id=complaint_id,
        embedding=vector
    )

    db.add(embedding)
    db.commit()