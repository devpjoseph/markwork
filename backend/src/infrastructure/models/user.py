import uuid
from enum import Enum as PyEnum

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.session import Base


class UserRole(str, PyEnum):
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    assignments_as_student: Mapped[list["Assignment"]] = relationship(  # noqa: F821
        "Assignment", foreign_keys="Assignment.student_id", back_populates="student"
    )
    assignments_as_teacher: Mapped[list["Assignment"]] = relationship(  # noqa: F821
        "Assignment", foreign_keys="Assignment.teacher_id", back_populates="teacher"
    )
    comments: Mapped[list["Comment"]] = relationship(  # noqa: F821
        "Comment", back_populates="author"
    )
