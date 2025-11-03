import os
import firebase_admin
from firebase_admin import credentials
from fastapi.security import HTTPBearer
from functools import lru_cache

security = HTTPBearer()

@lru_cache()
def get_firebase_app():
    if not firebase_admin._apps:
        creds_path = os.getenv("GOOGLE_APPLICATION_CREDS")
        if not creds_path or not os.path.exists(creds_path):
            raise ValueError(f"Firebase credentials missing: {creds_path}")
        cred = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(cred)
    return firebase_admin.get_app()


