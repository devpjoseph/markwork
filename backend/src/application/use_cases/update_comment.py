import uuid

from src.domain.entities.comment import CommentEntity
from src.domain.entities.user import UserRole
from src.domain.exceptions.assignment_exceptions import AssignmentNotFoundError, UnauthorizedAssignmentAccessError
from src.domain.repositories.i_assignment_repository import IAssignmentRepository
from src.domain.repositories.i_comment_repository import ICommentRepository


async def update_comment(
    comment_id: uuid.UUID,
    actor_id: uuid.UUID,
    actor_role: UserRole,
    new_content: str,
    comment_repo: ICommentRepository,
    assignment_repo: IAssignmentRepository,
) -> CommentEntity:
    comment = await comment_repo.get_by_id(comment_id)
    if not comment:
        raise ValueError(f"Comment {comment_id} not found")

    assignment = await assignment_repo.get_by_id(comment.assignment_id)
    if not assignment:
        raise AssignmentNotFoundError(str(comment.assignment_id))

    if actor_role != UserRole.TEACHER or assignment.teacher_id != actor_id:
        raise UnauthorizedAssignmentAccessError()

    updated = await comment_repo.update_content(comment_id, new_content)
    return updated
