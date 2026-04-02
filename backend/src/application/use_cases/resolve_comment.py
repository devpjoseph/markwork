import uuid

from src.domain.entities.comment import CommentEntity, CommentStatus
from src.domain.entities.user import UserRole
from src.domain.exceptions.assignment_exceptions import (
    UnauthorizedAssignmentAccessError,
)
from src.domain.repositories.i_assignment_repository import IAssignmentRepository
from src.domain.repositories.i_comment_repository import ICommentRepository


async def resolve_comment(
    comment_id: uuid.UUID,
    actor_id: uuid.UUID,
    actor_role: UserRole,
    new_status: CommentStatus,
    comment_repo: ICommentRepository,
    assignment_repo: IAssignmentRepository,
) -> CommentEntity:
    comment = await comment_repo.get_by_id(comment_id)
    if not comment:
        raise ValueError(f"Comment {comment_id} not found")

    if comment.status != CommentStatus.OPEN:
        raise ValueError(f"Comment is already {comment.status.value}")

    if actor_role not in (UserRole.TEACHER, UserRole.STUDENT):
        raise PermissionError("Only teachers and students can update comment status")

    # Verify actor owns the assignment (as teacher or student)
    assignment = await assignment_repo.get_by_id(comment.assignment_id)
    if not assignment:
        raise ValueError("Assignment not found")
    if actor_role == UserRole.TEACHER and assignment.teacher_id != actor_id:
        raise UnauthorizedAssignmentAccessError()
    if actor_role == UserRole.STUDENT and assignment.student_id != actor_id:
        raise UnauthorizedAssignmentAccessError()

    return await comment_repo.update_status(comment_id, new_status)
