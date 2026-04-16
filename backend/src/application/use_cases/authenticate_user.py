from dataclasses import dataclass

from src.application.services.i_auth_service import IAuthService
from src.domain.entities.user import UserEntity, UserRole
from src.domain.repositories.i_user_repository import IUserRepository


@dataclass
class AuthOutput:
    access_token: str
    token_type: str
    user: UserEntity


async def authenticate_with_google(
    google_id_token: str,
    user_repo: IUserRepository,
    auth_service: IAuthService,
    requested_role: UserRole,
) -> AuthOutput:
    if requested_role not in (UserRole.STUDENT, UserRole.TEACHER):
        raise ValueError("Only STUDENT or TEACHER roles can be requested at sign-in.")

    google_data = await auth_service.verify_google_token(google_id_token)

    user = await user_repo.get_by_email(google_data["email"])
    created = False
    if not user:
        user = await user_repo.create(
            email=google_data["email"],
            full_name=google_data["full_name"],
            role=requested_role,
        )
        created = True

    if not created and not user.is_active:
        raise PermissionError("Account is deactivated. Contact an administrator.")

    if not created:
        access_token = auth_service.create_access_token(
            user_id=user.id, role=user.role.value
        )
    else:
        access_token = None
    return AuthOutput(access_token=access_token, token_type="bearer", user=user)
