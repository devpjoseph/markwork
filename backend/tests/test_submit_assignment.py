"""Unit tests for submit_assignment use case."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from src.application.use_cases.submit_assignment import submit_assignment
from src.domain.entities.assignment import AssignmentEntity, AssignmentStatus
from src.domain.exceptions.assignment_exceptions import (
    AssignmentNotFoundError,
    InvalidStatusTransitionError,
    UnauthorizedAssignmentAccessError,
)


def _make_assignment(
    status: AssignmentStatus, student_id: uuid.UUID | None = None
) -> AssignmentEntity:
    now = datetime.now(timezone.utc)
    return AssignmentEntity(
        id=uuid.uuid4(),
        student_id=student_id or uuid.uuid4(),
        teacher_id=uuid.uuid4(),
        title="Test Assignment",
        status=status,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_submit_draft_succeeds():
    student_id = uuid.uuid4()
    assignment = _make_assignment(AssignmentStatus.DRAFT, student_id=student_id)
    submitted = AssignmentEntity(
        **{**assignment.model_dump(), "status": AssignmentStatus.PENDING_REVIEW}
    )

    repo = AsyncMock()
    repo.get_by_id.return_value = assignment
    repo.update_status.return_value = submitted

    result = await submit_assignment(assignment.id, student_id, repo)

    assert result.status == AssignmentStatus.PENDING_REVIEW
    repo.update_status.assert_awaited_once_with(
        assignment.id, AssignmentStatus.PENDING_REVIEW
    )


@pytest.mark.asyncio
async def test_submit_requires_changes_succeeds():
    student_id = uuid.uuid4()
    assignment = _make_assignment(
        AssignmentStatus.REQUIRES_CHANGES, student_id=student_id
    )
    submitted = AssignmentEntity(
        **{**assignment.model_dump(), "status": AssignmentStatus.PENDING_REVIEW}
    )

    repo = AsyncMock()
    repo.get_by_id.return_value = assignment
    repo.update_status.return_value = submitted

    result = await submit_assignment(assignment.id, student_id, repo)
    assert result.status == AssignmentStatus.PENDING_REVIEW


@pytest.mark.asyncio
async def test_submit_not_found_raises():
    repo = AsyncMock()
    repo.get_by_id.return_value = None

    with pytest.raises(AssignmentNotFoundError):
        await submit_assignment(uuid.uuid4(), uuid.uuid4(), repo)


@pytest.mark.asyncio
async def test_submit_wrong_student_raises():
    assignment = _make_assignment(AssignmentStatus.DRAFT)
    repo = AsyncMock()
    repo.get_by_id.return_value = assignment

    with pytest.raises(UnauthorizedAssignmentAccessError):
        await submit_assignment(assignment.id, uuid.uuid4(), repo)  # different student


@pytest.mark.asyncio
async def test_submit_already_in_review_raises():
    student_id = uuid.uuid4()
    assignment = _make_assignment(AssignmentStatus.IN_REVIEW, student_id=student_id)
    repo = AsyncMock()
    repo.get_by_id.return_value = assignment

    with pytest.raises(InvalidStatusTransitionError):
        await submit_assignment(assignment.id, student_id, repo)


@pytest.mark.asyncio
async def test_submit_approved_raises():
    student_id = uuid.uuid4()
    assignment = _make_assignment(AssignmentStatus.APPROVED, student_id=student_id)
    repo = AsyncMock()
    repo.get_by_id.return_value = assignment

    with pytest.raises(InvalidStatusTransitionError):
        await submit_assignment(assignment.id, student_id, repo)
