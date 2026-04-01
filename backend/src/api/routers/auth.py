from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.use_cases.authenticate_user import authenticate_with_google
from src.domain.entities.user import UserEntity, UserRole
from src.infrastructure.database.session import get_db
from src.infrastructure.repositories.user_repository import UserRepository

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleAuthRequest(BaseModel):
    id_token: str
    role: UserRole = UserRole.STUDENT


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserEntity


@router.post("/google", response_model=AuthResponse, status_code=status.HTTP_200_OK)
async def google_login(
    body: GoogleAuthRequest,
    session: AsyncSession = Depends(get_db),
) -> AuthResponse:
    user_repo = UserRepository(session)
    try:
        result = await authenticate_with_google(
            google_id_token=body.id_token,
            default_role=body.role,
            user_repo=user_repo,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    return AuthResponse(access_token=result.access_token, token_type=result.token_type, user=result.user)
