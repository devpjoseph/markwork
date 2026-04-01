# Import all models here so Alembic autogenerate can detect them
from src.infrastructure.models.assignment import Assignment, AssignmentStatus
from src.infrastructure.models.assignment_version import AssignmentVersion
from src.infrastructure.models.comment import Comment, CommentStatus
from src.infrastructure.models.user import User, UserRole

__all__ = [
    "User",
    "UserRole",
    "Assignment",
    "AssignmentStatus",
    "AssignmentVersion",
    "Comment",
    "CommentStatus",
]
