import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.user import UserEntity, UserRole
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

    async def set_active(self, user_id: uuid.UUID, is_active: bool) -> UserEntity | None:
        result = await self._session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None
        user.is_active = is_active
        await self._session.flush()
        await self._session.refresh(user)
        return UserEntity.model_validate(user)

    async def list_by_role(self, role: UserRole) -> list[UserEntity]:
        result = await self._session.execute(select(User).where(User.role == role, User.is_active.is_(True)))
        users = result.scalars().all()
        return [UserEntity.model_validate(u) for u in users]
