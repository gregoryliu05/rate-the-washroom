from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.session import get_db
from typing import Generator
from firebase_admin import auth
from app.core.security import get_firebase_app

security = HTTPBearer(auto_error =False)

def get_db_session() -> Generator:
    for db in get_db():
        yield db

# TODO: auth dependency



def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        get_firebase_app()
    except Exception:
        # Treat missing/invalid Firebase Admin credentials as a service configuration issue,
        # not an authentication failure. This avoids confusing client-side "CORS" errors
        # caused by server-side crashes.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured on the server",
        )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail = "missing bearer")

    token = credentials.credentials

    try:
        decoded = auth.verify_id_token(token)
        if "id" not in decoded:
            decoded["id"] = decoded.get("uid") or decoded.get("user_id")
        if not decoded.get("id"):
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return decoded
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail = "Token Expired")
    except auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail = "Token Revoked")
    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail = "Token Invalid")
    except Exception:
        raise HTTPException(status_code=401, detail = "Unauthorized")
