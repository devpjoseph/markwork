from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from src.config import settings


def verify_google_token(token: str) -> dict:
    """Verifies a Google ID token and returns the payload."""
    request = google_requests.Request()
    id_info = id_token.verify_oauth2_token(token, request, settings.GOOGLE_CLIENT_ID)

    if id_info.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise ValueError("Token audience mismatch")

    return {
        "email": id_info["email"],
        "full_name": id_info.get("name", ""),
        "google_sub": id_info["sub"],
    }
