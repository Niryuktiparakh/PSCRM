# backend/services/infrastructure_service.py
from sqlalchemy.orm import Session
from sqlalchemy import text


def detect_zone(db: Session, lat: float, lng: float):
    """
    Detect which administrative zone contains the complaint.
    """

    query = text("""
        SELECT id, name
        FROM zones
        WHERE ST_Contains(
            boundary,
            ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography
        )
        LIMIT 1
    """)

    result = db.execute(query, {"lat": lat, "lng": lng}).fetchone()

    if result:
        return {
            "zone_id": result[0],
            "zone_name": result[1]
        }

    return None


def get_nearest_asset(
    db: Session,
    lat: float,
    lng: float,
    asset_type: str = None
):
    """
    Finds the nearest infrastructure asset to the complaint.
    Optionally filtered by asset type.
    """

    base_query = """
        SELECT
            id,
            asset_type,
            department_id,
            ward,
            ST_Distance(
                location,
                ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography
            ) as distance
        FROM assets
    """

    params = {"lat": lat, "lng": lng}

    if asset_type:
        base_query += " WHERE asset_type ILIKE :asset_type"
        params["asset_type"] = f"%{asset_type}%"

    base_query += """
        ORDER BY location <-> ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography
        LIMIT 1
    """

    result = db.execute(text(base_query), params).fetchone()

    if not result:
        return None

    return {
        "asset_id": result[0],
        "asset_type": result[1],
        "department_id": result[2],
        "ward": result[3],
        "distance_meters": float(result[4])
    }


def get_asset_details(db: Session, asset_id: int):
    """
    Fetch asset details for dashboard display.
    """

    result = db.execute(text("""
        SELECT
            id,
            asset_type,
            ward,
            ST_X(location::geometry) as lng,
            ST_Y(location::geometry) as lat
        FROM assets
        WHERE id=:id
    """), {"id": asset_id}).fetchone()

    if not result:
        return None

    return {
        "asset_id": result[0],
        "asset_type": result[1],
        "ward": result[2],
        "lng": result[3],
        "lat": result[4]
    }


def map_complaint_to_asset(
    db: Session,
    complaint_id: int,
    asset_id: int,
    department_id: int
):
    """
    Updates complaint after infrastructure mapping.
    """

    db.execute(text("""
        UPDATE complaints
        SET
            asset_id = :asset,
            department_id = :dept,
            status = 'CLASSIFIED'
        WHERE id = :cid
    """), {
        "asset": asset_id,
        "dept": department_id,
        "cid": complaint_id
    })

    db.commit()


def get_assets_for_map(db: Session, zone_id: int = None):
    """
    Returns infrastructure markers for dashboard map.
    """

    query = """
        SELECT
            id,
            asset_type,
            ward,
            ST_X(location::geometry) as lng,
            ST_Y(location::geometry) as lat
        FROM assets
    """

    params = {}

    if zone_id:
        query += """
            WHERE ST_Contains(
                (SELECT boundary FROM zones WHERE id=:zone),
                location
            )
        """
        params["zone"] = zone_id

    results = db.execute(text(query), params).fetchall()

    assets = []

    for r in results:
        assets.append({
            "id": r[0],
            "type": r[1],
            "ward": r[2],
            "lng": r[3],
            "lat": r[4]
        })

    return assets