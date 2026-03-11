# backend/dependencies.py
import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings
from schemas import TokenData

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> TokenData:
    token = credentials.credentials
    try:
        # Supabase uses HS256 by default, but ES256 (ECC) is supported here if configured
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256", "ES256", "RS256"], 
            audience="authenticated"
        )
        # Supabase stores UUID in 'sub'
        return TokenData(user_id=payload.get("sub"), role=payload.get("role", "citizen"))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")