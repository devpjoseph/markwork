from src.domain.entities.user import PaginatedResult, UserEntity, UserRole
from src.domain.repositories.i_user_repository import IUserRepository


async def list_users(
    user_repo: IUserRepository,
    role: UserRole | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> PaginatedResult[UserEntity]:
    return await user_repo.list_paginated(
        role=role, is_active=is_active, search=search
    )
