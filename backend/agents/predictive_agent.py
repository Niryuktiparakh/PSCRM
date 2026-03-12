# backend/agents/predictive_agent.py
from sklearn.cluster import DBSCAN
import numpy as np
from sqlalchemy import text

def detect_clusters(db):

    complaints = db.execute(text("""
        SELECT
        id,
        ST_X(location::geometry),
        ST_Y(location::geometry)
        FROM complaints
    """)).fetchall()

    if not complaints:
        return

    coords = np.array([[c[1], c[2]] for c in complaints])

    clustering = DBSCAN(eps=0.002, min_samples=3).fit(coords)

    labels = clustering.labels_

    for cluster_id in set(labels):

        if cluster_id == -1:
            continue

        cluster_points = coords[labels == cluster_id]

        centroid = cluster_points.mean(axis=0)

        db.execute(text("""
        INSERT INTO infrastructure_alerts
        (issue_type, cluster_size, location)
        VALUES (
            'ComplaintCluster',
            :size,
            ST_SetSRID(ST_MakePoint(:lng,:lat),4326)
        )
        """), {
            "size": len(cluster_points),
            "lng": float(centroid[0]),
            "lat": float(centroid[1])
        })

    db.commit()