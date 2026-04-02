import uuid
from dataclasses import dataclass

from src.domain.entities.assignment import AssignmentStatus
from src.domain.entities.comment import CommentEntity
from src.domain.entities.user import UserRole
from src.domain.exceptions.assignment_exceptions import (
    AssignmentNotFoundError,
    UnauthorizedAssignmentAccessError,
)
from src.domain.repositories.i_assignment_repository import IAssignmentRepository
from src.domain.repositories.i_comment_repository import ICommentRepository

COMMENTABLE_STATUSES = {AssignmentStatus.IN_REVIEW, AssignmentStatus.PENDING_REVIEW}


@dataclass
class AddCommentInput:
    assignment_id: uuid.UUID
    author_id: uuid.UUID
    author_role: UserRole
    tiptap_node_id: str
    selected_text: str
    content: str
    parent_id: uuid.UUID | None = None


async def add_comment(
    data: AddCommentInput,
    assignment_repo: IAssignmentRepository,
    comment_repo: ICommentRepository,
) -> CommentEntity:
    assignment = await assignment_repo.get_by_id(data.assignment_id)
    if not assignment:
        raise AssignmentNotFoundError(str(data.assignment_id))

    # Only the assigned teacher can comment while in review
    if data.author_role == UserRole.TEACHER and assignment.teacher_id != data.author_id:
        raise UnauthorizedAssignmentAccessError()

    if assignment.status not in COMMENTABLE_STATUSES:
        raise ValueError(
            f"Cannot add comments to assignment in status {assignment.status.value}"
        )

    # Validate parent if provided (only 1 level deep allowed)
    if data.parent_id is not None:
        parent = await comment_repo.get_by_id(data.parent_id)
        if not parent:
            raise ValueError(f"Parent comment {data.parent_id} not found")
        if parent.assignment_id != data.assignment_id:
            raise ValueError("Parent comment belongs to a different assignment")
        if parent.parent_id is not None:
            raise ValueError("Replies cannot be nested more than one level deep")

    return await comment_repo.create(
        assignment_id=data.assignment_id,
        author_id=data.author_id,
        tiptap_node_id=data.tiptap_node_id,
        selected_text=data.selected_text,
        content=data.content,
        parent_id=data.parent_id,
    )
