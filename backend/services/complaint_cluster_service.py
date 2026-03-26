# backend/services/complaint_cluster_service.py
"""
Maintains complaint_clusters and complaint_cluster_members tables.

Each infra_node has at most one active cluster.
On every new complaint for a node we:
  1. Upsert the complaint_clusters row (one per infra_node)
  2. Insert the complaint into complaint_cluster_members
  3. Update cluster_summary on the cluster row (AI summary is stored on infra_nodes,
     the cluster row keeps a lightweight text summary)

Schema:
  complaint_clusters       : id, infra_node_id, primary_complaint_id,
                             complaint_count, cluster_summary, created_at, updated_at
  complaint_cluster_members: cluster_id (PK), complaint_id (PK), joined_at
"""
import logging
import uuid as _uuid
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def upsert_complaint_cluster(
    db: Session,
    *,
    infra_node_id: str,
    complaint_id: str,
    complaint_title: str,
    complaint_priority: str = "normal",
) -> Optional[str]:
    """
    Upsert the cluster for an infra_node and add the complaint as a member.
    Returns the cluster_id.

    Safe to call multiple times for the same complaint (ON CONFLICT DO NOTHING
    on the members table).
    """
    try:
        # ── 1. Does a cluster already exist for this node? ────────
        existing = db.execute(
            text("""
                SELECT id, complaint_count
                FROM complaint_clusters
                WHERE infra_node_id = CAST(:nid AS uuid)
                LIMIT 1
            """),
            {"nid": infra_node_id},
        ).mappings().first()

        if existing:
            cluster_id = str(existing["id"])
            new_count  = int(existing["complaint_count"] or 0) + 1

            # Update count + summary
            db.execute(
                text("""
                    UPDATE complaint_clusters
                    SET complaint_count = :cnt,
                        cluster_summary = :summary,
                        updated_at      = NOW()
                    WHERE id = CAST(:cid AS uuid)
                """),
                {
                    "cid":     cluster_id,
                    "cnt":     new_count,
                    "summary": f"Cluster with {new_count} complaints. Latest: {complaint_title[:80]}",
                },
            )
        else:
            # Create new cluster for this node
            cluster_id = str(_uuid.uuid4())
            db.execute(
                text("""
                    INSERT INTO complaint_clusters (
                        id, infra_node_id, primary_complaint_id,
                        complaint_count, cluster_summary
                    ) VALUES (
                        CAST(:id  AS uuid),
                        CAST(:nid AS uuid),
                        CAST(:pcid AS uuid),
                        1,
                        :summary
                    )
                """),
                {
                    "id":      cluster_id,
                    "nid":     infra_node_id,
                    "pcid":    complaint_id,
                    "summary": f"New cluster. First complaint: {complaint_title[:80]}",
                },
            )

        # ── 2. Add complaint as cluster member ────────────────────
        db.execute(
            text("""
                INSERT INTO complaint_cluster_members (cluster_id, complaint_id, joined_at)
                VALUES (CAST(:cid AS uuid), CAST(:comp AS uuid), NOW())
                ON CONFLICT DO NOTHING
            """),
            {"cid": cluster_id, "comp": complaint_id},
        )

        logger.info(
            "Cluster upserted: cluster=%s node=%s complaint=%s",
            cluster_id, infra_node_id, complaint_id,
        )
        return cluster_id

    except Exception as exc:
        logger.error(
            "upsert_complaint_cluster failed for node=%s complaint=%s: %s",
            infra_node_id, complaint_id, exc,
        )
        return None


def get_cluster_for_node(db: Session, infra_node_id: str) -> Optional[dict]:
    """
    Returns the cluster row + member complaints for an infra_node.
    Used by admin views to show the full cluster.
    """
    cluster = db.execute(
        text("""
            SELECT id, primary_complaint_id, complaint_count, cluster_summary,
                   created_at, updated_at
            FROM complaint_clusters
            WHERE infra_node_id = CAST(:nid AS uuid)
            LIMIT 1
        """),
        {"nid": infra_node_id},
    ).mappings().first()

    if not cluster:
        return None

    members = db.execute(
        text("""
            SELECT
                c.id, c.complaint_number, c.title, c.status, c.priority,
                c.agent_summary, c.is_repeat_complaint,
                c.created_at,
                ccm.joined_at
            FROM complaint_cluster_members ccm
            JOIN complaints c ON c.id = ccm.complaint_id
            WHERE ccm.cluster_id = CAST(:cid AS uuid)
              AND c.is_deleted = FALSE
            ORDER BY ccm.joined_at DESC
            LIMIT 50
        """),
        {"cid": str(cluster["id"])},
    ).mappings().all()

    return {
        "cluster_id":         str(cluster["id"]),
        "complaint_count":    cluster["complaint_count"],
        "cluster_summary":    cluster["cluster_summary"],
        "created_at":         cluster["created_at"].isoformat() if cluster["created_at"] else None,
        "updated_at":         cluster["updated_at"].isoformat() if cluster["updated_at"] else None,
        "members": [
            {
                "id":                  str(m["id"]),
                "complaint_number":    m["complaint_number"],
                "title":               m["title"],
                "status":              m["status"],
                "priority":            m["priority"],
                "agent_summary":       m["agent_summary"],
                "is_repeat_complaint": bool(m["is_repeat_complaint"]),
                "created_at":          m["created_at"].isoformat() if m["created_at"] else None,
            }
            for m in members
        ],
    }
