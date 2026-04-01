from dataclasses import dataclass

from src.domain.entities.user import UserEntity, UserRole
from src.domain.repositories.i_user_repository import IUserRepository
from src.infrastructure.auth.google import verify_google_token
from src.infrastructure.auth.jwt import create_access_token


@dataclass
class AuthOutput:
    access_token: str
    token_type: str
    user: UserEntity


async def authenticate_with_google(
    google_id_token: str,
    default_role: UserRole,
    user_repo: IUserRepository,
) -> AuthOutput:
    google_data = verify_google_token(google_id_token)

    user = await user_repo.get_by_email(google_data["email"])
    if not user:
        user = await user_repo.create(
            email=google_data["email"],
            full_name=google_data["full_name"],
            role=default_role,
        )

    if not user.is_active:
        raise PermissionError("Account is deactivated. Contact an administrator.")

    access_token = create_access_token(user_id=user.id, role=user.role.value)
    return AuthOutput(access_token=access_token, token_type="bearer", user=user)
