from fastapi import APIRouter, Depends

from src.api.dependencies.auth import CurrentUser
from src.api.dependencies.repositories import get_user_repo
from src.domain.entities.user import UserEntity, UserRole

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserEntity)
async def get_me(current_user: CurrentUser):
    return current_user


@router.get("/teachers", response_model=list[UserEntity])
async def list_teachers(
    current_user: CurrentUser,
    user_repo=Depends(get_user_repo),
):
    return await user_repo.list_by_role(UserRole.TEACHER)
