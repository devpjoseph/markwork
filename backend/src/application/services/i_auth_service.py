"""Auth service interface — keeps use cases free of infrastructure imports."""

from abc import ABC, abstractmethod


class IAuthService(ABC):
    @abstractmethod
    async def verify_google_token(self, id_token: str) -> dict:
        """Verify a Google ID token and return claims (email, name, etc.)."""
        ...

    @abstractmethod
    def create_access_token(self, user_id: str, role: str) -> str:
        """Create a JWT access token for the given user."""
        ...
