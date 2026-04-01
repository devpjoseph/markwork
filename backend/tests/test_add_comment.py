"""Unit tests for add_comment use case."""
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from src.application.use_cases.add_comment import AddCommentInput, add_comment
from src.domain.entities.assignment import AssignmentEntity, AssignmentStatus
from src.domain.entities.comment import CommentEntity, CommentStatus
from src.domain.entities.user import UserRole
from src.domain.exceptions.assignment_exceptions import (
    AssignmentNotFoundError,
    UnauthorizedAssignmentAccessError,
)


def _make_assignment(status: AssignmentStatus, teacher_id: uuid.UUID | None = None) -> AssignmentEntity:
    now = datetime.now(timezone.utc)
    return AssignmentEntity(
        id=uuid.uuid4(),
        student_id=uuid.uuid4(),
        teacher_id=teacher_id or uuid.uuid4(),
        title="Test",
        status=status,
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
        selected_text="some text",
        content="Great point here.",
        status=CommentStatus.OPEN,
        created_at=now,
    )


@pytest.mark.asyncio
async def test_add_comment_in_review_succeeds():
    teacher_id = uuid.uuid4()
    assignment = _make_assignment(AssignmentStatus.IN_REVIEW, teacher_id=teacher_id)
    comment = _make_comment(assignment.id, teacher_id)

    assignment_repo = AsyncMock()
    assignment_repo.get_by_id.return_value = assignment

    comment_repo = AsyncMock()
    comment_repo.create.return_value = comment

    result = await add_comment(
        AddCommentInput(
            assignment_id=assignment.id,
            author_id=teacher_id,
            author_role=UserRole.TEACHER,
            tiptap_node_id=comment.tiptap_node_id,
            selected_text=comment.selected_text,
            content=comment.content,
        ),
        assignment_repo=assignment_repo,
        comment_repo=comment_repo,
    )
    assert result.status == CommentStatus.OPEN
    comment_repo.create.assert_awaited_once()


@pytest.mark.asyncio
async def test_add_comment_assignment_not_found_raises():
    assignment_repo = AsyncMock()
    assignment_repo.get_by_id.return_value = None

    with pytest.raises(AssignmentNotFoundError):
        await add_comment(
            AddCommentInput(
                assignment_id=uuid.uuid4(),
                author_id=uuid.uuid4(),
                author_role=UserRole.TEACHER,
                tiptap_node_id=str(uuid.uuid4()),
                selected_text="text",
                content="comment",
            ),
            assignment_repo=assignment_repo,
            comment_repo=AsyncMock(),
        )


@pytest.mark.asyncio
async def test_add_comment_wrong_teacher_raises():
    assignment = _make_assignment(AssignmentStatus.IN_REVIEW)
    assignment_repo = AsyncMock()
    assignment_repo.get_by_id.return_value = assignment

    with pytest.raises(UnauthorizedAssignmentAccessError):
        await add_comment(
            AddCommentInput(
                assignment_id=assignment.id,
                author_id=uuid.uuid4(),  # different teacher
                author_role=UserRole.TEACHER,
                tiptap_node_id=str(uuid.uuid4()),
                selected_text="text",
                content="comment",
            ),
            assignment_repo=assignment_repo,
            comment_repo=AsyncMock(),
        )


@pytest.mark.asyncio
async def test_add_comment_draft_status_raises():
    teacher_id = uuid.uuid4()
    assignment = _make_assignment(AssignmentStatus.DRAFT, teacher_id=teacher_id)
    assignment_repo = AsyncMock()
    assignment_repo.get_by_id.return_value = assignment

    with pytest.raises(ValueError, match="Cannot add comments"):
        await add_comment(
            AddCommentInput(
                assignment_id=assignment.id,
                author_id=teacher_id,
                author_role=UserRole.TEACHER,
                tiptap_node_id=str(uuid.uuid4()),
                selected_text="text",
                content="comment",
            ),
            assignment_repo=assignment_repo,
            comment_repo=AsyncMock(),
        )
