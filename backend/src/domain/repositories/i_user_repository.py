import uuid
from abc import ABC, abstractmethod

from src.domain.entities.user import PaginatedResult, UserEntity, UserRole


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
    async def set_role(
        self, user_id: uuid.UUID, role: UserRole
    ) -> UserEntity | None: ...

    @abstractmethod
    async def list_by_role(self, role: UserRole) -> list[UserEntity]: ...

    @abstractmethod
    async def list_paginated(
        self,
        role: UserRole | None = None,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> PaginatedResult[UserEntity]: ...

    @abstractmethod
    async def delete(self, user_id: uuid.UUID) -> bool: ...
