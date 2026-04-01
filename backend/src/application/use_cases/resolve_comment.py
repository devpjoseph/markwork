import uuid

from src.domain.entities.comment import CommentEntity, CommentStatus
from src.domain.entities.user import UserRole
from src.domain.repositories.i_comment_repository import ICommentRepository


async def resolve_comment(
    comment_id: uuid.UUID,
    actor_id: uuid.UUID,
    actor_role: UserRole,
    new_status: CommentStatus,
    comment_repo: ICommentRepository,
) -> CommentEntity:
    comment = await comment_repo.get_by_id(comment_id)
    if not comment:
        raise ValueError(f"Comment {comment_id} not found")

    if comment.status != CommentStatus.OPEN:
        raise ValueError(f"Comment is already {comment.status.value}")

    # Only the teacher (author) or the student who owns the assignment can change status
    if actor_role not in (UserRole.TEACHER, UserRole.STUDENT):
        raise PermissionError("Only teachers and students can update comment status")

    return await comment_repo.update_status(comment_id, new_status)
