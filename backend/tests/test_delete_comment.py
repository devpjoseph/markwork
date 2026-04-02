"""Unit tests for delete_comment use case."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from src.application.use_cases.delete_comment import delete_comment
from src.domain.entities.assignment import AssignmentEntity, AssignmentStatus
from src.domain.entities.comment import CommentEntity, CommentStatus
from src.domain.entities.user import UserRole
from src.domain.exceptions.assignment_exceptions import (
    AssignmentNotFoundError,
    UnauthorizedAssignmentAccessError,
)


def _make_assignment(teacher_id: uuid.UUID) -> AssignmentEntity:
    now = datetime.now(timezone.utc)
    return AssignmentEntity(
        id=uuid.uuid4(),
        student_id=uuid.uuid4(),
        teacher_id=teacher_id,
        title="Test",
        status=AssignmentStatus.IN_REVIEW,
        created_at=now,
        updated_at=now,
    )


def _make_comment(assignment_id: uuid.UUID, author_id: uuid.UUID) -> CommentEntity:
    now = datetime.now(timezone.utc)
    return CommentEntity(
        id=uuid.uuid4(),
        assignment_id=assignment_id,
        author_id=author_id,
        tiptap_node_id=str(uuid.uuid4()),
        selected_text="text",
        content="Content to delete",
        status=CommentStatus.OPEN,
        created_at=now,
    )


@pytest.mark.asyncio
async def test_delete_comment_succeeds():
    teacher_id = uuid.uuid4()
    assignment = _make_assignment(teacher_id)
    comment = _make_comment(assignment.id, teacher_id)

    comment_repo = AsyncMock()
    comment_repo.get_by_id.return_value = comment

    assignment_repo = AsyncMock()
    assignment_repo.get_by_id.return_value = assignment

    await delete_comment(
        comment_id=comment.id,
        actor_id=teacher_id,
        actor_role=UserRole.TEACHER,
        comment_repo=comment_repo,
        assignment_repo=assignment_repo,
    )

    comment_repo.delete.assert_awaited_once_with(comment.id)


@pytest.mark.asyncio
async def test_delete_comment_not_found_raises():
    comment_repo = AsyncMock()
    comment_repo.get_by_id.return_value = None

    with pytest.raises(ValueError, match="not found"):
        await delete_comment(
            comment_id=uuid.uuid4(),
            actor_id=uuid.uuid4(),
            actor_role=UserRole.TEACHER,
            comment_repo=comment_repo,
            assignment_repo=AsyncMock(),
        )


@pytest.mark.asyncio
async def test_delete_comment_assignment_not_found_raises():
    comment = _make_comment(uuid.uuid4(), uuid.uuid4())
    comment_repo = AsyncMock()
    comment_repo.get_by_id.return_value = comment

    assignment_repo = AsyncMock()
    assignment_repo.get_by_id.return_value = None

    with pytest.raises(AssignmentNotFoundError):
        await delete_comment(
            comment_id=comment.id,
            actor_id=uuid.uuid4(),
            actor_role=UserRole.TEACHER,
            comment_repo=comment_repo,
            assignment_repo=assignment_repo,
        )


@pytest.mark.asyncio
async def test_delete_comment_unauthorized_raises():
    teacher_id = uuid.uuid4()
    assignment = _make_assignment(teacher_id)
    comment = _make_comment(assignment.id, teacher_id)

    comment_repo = AsyncMock()
    comment_repo.get_by_id.return_value = comment

    assignment_repo = AsyncMock()
    assignment_repo.get_by_id.return_value = assignment

    with pytest.raises(UnauthorizedAssignmentAccessError):
        await delete_comment(
            comment_id=comment.id,
            actor_id=uuid.uuid4(),  # Different actor
            actor_role=UserRole.TEACHER,
            comment_repo=comment_repo,
            assignment_repo=assignment_repo,
        )
