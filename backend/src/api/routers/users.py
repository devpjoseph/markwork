from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth import CurrentUser, require_role
from src.domain.entities.user import UserEntity, UserRole
from src.infrastructure.database.session import get_db
from src.infrastructure.repositories.user_repository import UserRepository

router = APIRouter(prefix="/users", tags=["users"])


def _user_repo(session: AsyncSession = Depends(get_db)):
    return UserRepository(session)


@router.get("/me", response_model=UserEntity)
async def get_me(current_user: CurrentUser):
    return current_user


@router.get("/teachers", response_model=list[UserEntity])
async def list_teachers(
    current_user: CurrentUser,
    user_repo=Depends(_user_repo),
):
    return await user_repo.list_by_role(UserRole.TEACHER)
