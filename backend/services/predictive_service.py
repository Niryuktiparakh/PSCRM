# backend/services/predictive_service.py
import threading
import time
from agents.predictive_agent import detect_clusters
from db import SessionLocal

def predictive_loop():

    while True:

        db = SessionLocal()

        try:
            detect_clusters(db)
        finally:
            db.close()

        time.sleep(600)