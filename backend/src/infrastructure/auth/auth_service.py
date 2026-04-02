"""Concrete implementation of IAuthService using Google + JWT."""

from src.application.services.i_auth_service import IAuthService
from src.infrastructure.auth.google import verify_google_token as _verify_google_token
from src.infrastructure.auth.jwt import create_access_token as _create_access_token


class AuthService(IAuthService):
    async def verify_google_token(self, id_token: str) -> dict:
        # The underlying function is sync (makes a blocking HTTP call).
        # Wrapping in async to conform to the interface; for production
        # scale, consider running in an executor.
        return _verify_google_token(id_token)

    def create_access_token(self, user_id: str, role: str) -> str:
        return _create_access_token(user_id=user_id, role=role)
