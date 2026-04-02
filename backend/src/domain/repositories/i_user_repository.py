import uuid
from abc import ABC, abstractmethod

from src.domain.entities.user import UserEntity, UserRole


class IUserRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: uuid.UUID) -> UserEntity | None: ...

    @abstractmethod
    async def get_by_email(self, email: str) -> UserEntity | None: ...

    @abstractmethod
    async def create(
        self, email: str, full_name: str, role: UserRole
    ) -> UserEntity: ...

    @abstractmethod
    async def set_active(
        self, user_id: uuid.UUID, is_active: bool
    ) -> UserEntity | None: ...

    @abstractmethod
    async def list_by_role(self, role: UserRole) -> list[UserEntity]: ...
