from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from typing import AsyncGenerator
from firebase_admin import auth
from app.core.security import get_firebase_app

security = HTTPBearer(auto_error =False)

# ADD Firebase token verification dependency here in the future

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async for db in get_db():
        yield db

# TODO: auth dependency



async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    get_firebase_app()
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code= status.HTTP_401_UNAUTHORIZED, detail = "missing bearer")

    token = credentials.credentials

    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except auth.ExpiredIdTokenError:
        raise HTTPBearer(status_code=401, detail = "Token Expired")
    except auth.RevokedIdTokenError:
        raise HTTPBearer(status_code=401, detail = "Token Revoked")
    except auth.InvalidIdTokenError:
        raise HTTPBearer(status_code=401, detail = "Token Invalid")
    except Exception:
        raise HTTPBearer(status_code=401, detail = "Unauthorized")


