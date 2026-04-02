from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from src.api.dependencies.repositories import get_user_repo
from src.application.use_cases.authenticate_user import authenticate_with_google
from src.domain.entities.user import UserEntity
from src.infrastructure.auth.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleAuthRequest(BaseModel):
    id_token: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserEntity


@router.post("/google", response_model=AuthResponse, status_code=status.HTTP_200_OK)
async def google_login(
    body: GoogleAuthRequest,
    user_repo=Depends(get_user_repo),
) -> AuthResponse:
    auth_service = AuthService()
    try:
        result = await authenticate_with_google(
            google_id_token=body.id_token,
            user_repo=user_repo,
            auth_service=auth_service,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    return AuthResponse(
        access_token=result.access_token, token_type=result.token_type, user=result.user
    )
