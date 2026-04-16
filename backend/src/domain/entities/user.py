import uuid
from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel


class UserRole(str, Enum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    ADMIN = "ADMIN"


class UserEntity(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}


T = TypeVar("T")


class PaginatedResult(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    size: int
    pages: int
