# backend/services/geo_service.py
from sqlalchemy import text
from sqlalchemy.orm import Session

def get_nearest_asset_tool(db: Session, lat: float, lng: float, asset_type: str = None):
    """Finds the nearest physical infrastructure asset."""
    base_query = """
        SELECT id, asset_type, department_id, ST_Distance(location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) as dist
        FROM assets
    """
    params = {"lat": lat, "lng": lng}
    
    if asset_type:
        base_query += " WHERE asset_type ILIKE :asset_type"
        params["asset_type"] = f"%{asset_type}%"
        
    base_query += " ORDER BY location <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography LIMIT 1"
    
    result = db.execute(text(base_query), params).fetchone()
    if result:
        return {"asset_id": result[0], "asset_type": result[1], "department_id": result[2], "distance_meters": result[3]}
    return None