import json
import logging
import os
from functools import lru_cache
from pathlib import Path

import firebase_admin
from fastapi.security import HTTPBearer
from firebase_admin import credentials

security = HTTPBearer()
logger = logging.getLogger(__name__)


def _get_firebase_creds_source() -> str:
    """Resolve Firebase Admin credentials from env or known secret-file locations."""
    env_value = (
        os.getenv("GOOGLE_APPLICATION_CREDS")
        or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    )
    if env_value:
        return env_value.strip()

    # Common runtime locations (Render secrets and local dev symlink/file).
    for candidate in (
        "/etc/secrets/firebaseAccountKey.json",
        "/app/firebaseAccountKey.json",
        "firebaseAccountKey.json",
    ):
        if Path(candidate).exists():
            return candidate

    raise ValueError(
        "Firebase credentials are missing. Set GOOGLE_APPLICATION_CREDS or "
        "GOOGLE_APPLICATION_CREDENTIALS to a valid JSON file path (or JSON value)."
    )


def _build_firebase_certificate(source: str):
    """Create a Firebase Admin certificate from a file path or raw JSON string."""
    raw = source.strip()
    if raw.startswith("{"):
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError("Firebase credentials JSON is invalid") from exc
        return credentials.Certificate(payload)

    path = Path(raw).expanduser()
    if not path.exists():
        raise ValueError(f"Firebase credentials file not found: {path}")
    return credentials.Certificate(str(path))

@lru_cache()
def get_firebase_app():
    if not firebase_admin._apps:
        source = _get_firebase_creds_source()
        try:
            cred = _build_firebase_certificate(source)
        except Exception:
            logger.exception("Failed to load Firebase credentials from source")
            raise
        firebase_admin.initialize_app(cred)
    return firebase_admin.get_app()

