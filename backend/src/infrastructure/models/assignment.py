import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.session import Base


class AssignmentStatus(str, PyEnum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    IN_REVIEW = "IN_REVIEW"
    REQUIRES_CHANGES = "REQUIRES_CHANGES"
    APPROVED = "APPROVED"


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[AssignmentStatus] = mapped_column(default=AssignmentStatus.DRAFT, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    student: Mapped["User"] = relationship(  # noqa: F821
        "User", foreign_keys=[student_id], back_populates="assignments_as_student"
    )
    teacher: Mapped["User"] = relationship(  # noqa: F821
        "User", foreign_keys=[teacher_id], back_populates="assignments_as_teacher"
    )
    versions: Mapped[list["AssignmentVersion"]] = relationship(  # noqa: F821
        "AssignmentVersion", back_populates="assignment", order_by="AssignmentVersion.version_number"
    )
    comments: Mapped[list["Comment"]] = relationship(  # noqa: F821
        "Comment", back_populates="assignment"
    )
