import uuid

from fastapi_pagination.ext.sqlalchemy import apaginate
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.user import PaginatedResult, UserEntity, UserRole
from src.domain.repositories.i_user_repository import IUserRepository
from src.infrastructure.models.user import User


class UserRepository(IUserRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: uuid.UUID) -> UserEntity | None:
        result = await self._session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        return UserEntity.model_validate(user) if user else None

    async def get_by_email(self, email: str) -> UserEntity | None:
        result = await self._session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        return UserEntity.model_validate(user) if user else None

    async def create(self, email: str, full_name: str, role: UserRole) -> UserEntity:
        user = User(email=email, full_name=full_name, role=role)
        self._session.add(user)
        await self._session.flush()
        await self._session.refresh(user)
        return UserEntity.model_validate(user)

    async def set_active(
        self, user_id: uuid.UUID, is_active: bool
    ) -> UserEntity | None:
        result = await self._session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None
        user.is_active = is_active
        await self._session.flush()
        await self._session.refresh(user)
        return UserEntity.model_validate(user)

    async def set_role(
        self, user_id: uuid.UUID, role: UserRole
    ) -> UserEntity | None:
        result = await self._session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None
        user.role = role
        await self._session.flush()
        await self._session.refresh(user)
        return UserEntity.model_validate(user)

    async def list_by_role(self, role: UserRole) -> list[UserEntity]:
        result = await self._session.execute(
            select(User).where(User.role == role, User.is_active.is_(True))
        )
        users = result.scalars().all()
        return [UserEntity.model_validate(u) for u in users]

    async def list_paginated(
        self,
        role: UserRole | None = None,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> PaginatedResult[UserEntity]:
        stmt = select(User)
        if role is not None:
            stmt = stmt.where(User.role == role)
        if is_active is not None:
            stmt = stmt.where(User.is_active.is_(is_active))
        if search:
            pattern = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    User.email.ilike(pattern),
                    User.full_name.ilike(pattern),
                )
            )
        stmt = stmt.order_by(User.email.asc())
        page = await apaginate(
            self._session,
            stmt,
            transformer=lambda rows: [UserEntity.model_validate(r) for r in rows],
        )
        return PaginatedResult(
            items=page.items,
            total=page.total,
            page=page.page,
            size=page.size,
            pages=page.pages,
        )

    async def delete(self, user_id: uuid.UUID) -> bool:
        result = await self._session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return False
        await self._session.delete(user)
        await self._session.flush()
        return True
