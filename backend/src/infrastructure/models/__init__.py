# Import all models here so Alembic autogenerate can detect them
from src.infrastructure.models.assignment import Assignment
from src.infrastructure.models.assignment_version import AssignmentVersion
from src.infrastructure.models.comment import Comment
from src.infrastructure.models.user import User

# Re-export enums from domain (single source of truth)
from src.domain.entities.assignment import AssignmentStatus
from src.domain.entities.comment import CommentStatus
from src.domain.entities.user import UserRole

__all__ = [
    "User",
    "UserRole",
    "Assignment",
    "AssignmentStatus",
    "AssignmentVersion",
    "Comment",
    "CommentStatus",
]
