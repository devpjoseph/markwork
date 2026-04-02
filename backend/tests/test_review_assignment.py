"""Unit tests for review_assignment use case."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest

from src.application.use_cases.review_assignment import (
    ReviewAssignmentInput,
    ReviewDecision,
    finalize_review,
    start_review,
)
from src.domain.entities.assignment import AssignmentEntity, AssignmentStatus
from src.domain.exceptions.assignment_exceptions import (
    AssignmentNotFoundError,
    InvalidStatusTransitionError,
    UnauthorizedAssignmentAccessError,
)


def _make_assignment(
    status: AssignmentStatus, teacher_id: uuid.UUID | None = None
) -> AssignmentEntity:
    now = datetime.now(timezone.utc)
    return AssignmentEntity(
        id=uuid.uuid4(),
        student_id=uuid.uuid4(),
        teacher_id=teacher_id or uuid.uuid4(),
        title="Test Assignment",
        status=status,
        created_at=now,
        updated_at=now,
    )


# ── start_review ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_start_review_succeeds():
    teacher_id = uuid.uuid4()
    assignment = _make_assignment(
        AssignmentStatus.PENDING_REVIEW, teacher_id=teacher_id
    )
    in_review = AssignmentEntity(
        **{**assignment.model_dump(), "status": AssignmentStatus.IN_REVIEW}
    )

    repo = AsyncMock()
    repo.get_by_id.return_value = assignment
    repo.update_status.return_value = in_review

    result = await start_review(assignment.id, teacher_id, repo)
    assert result.status == AssignmentStatus.IN_REVIEW


@pytest.mark.asyncio
async def test_start_review_not_found_raises():
    repo = AsyncMock()
    repo.get_by_id.return_value = None

    with pytest.raises(AssignmentNotFoundError):
        await start_review(uuid.uuid4(), uuid.uuid4(), repo)


@pytest.mark.asyncio
async def test_start_review_wrong_teacher_raises():
    assignment = _make_assignment(AssignmentStatus.PENDING_REVIEW)
    repo = AsyncMock()
    repo.get_by_id.return_value = assignment

    with pytest.raises(UnauthorizedAssignmentAccessError):
        await start_review(assignment.id, uuid.uuid4(), repo)


@pytest.mark.asyncio
async def test_start_review_wrong_status_raises():
    teacher_id = uuid.uuid4()
    assignment = _make_assignment(AssignmentStatus.DRAFT, teacher_id=teacher_id)
    repo = AsyncMock()
    repo.get_by_id.return_value = assignment

    with pytest.raises(InvalidStatusTransitionError):
        await start_review(assignment.id, teacher_id, repo)


# ── finalize_review ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_finalize_review_approve():
    teacher_id = uuid.uuid4()
    assignment = _make_assignment(AssignmentStatus.IN_REVIEW, teacher_id=teacher_id)
    approved = AssignmentEntity(
        **{**assignment.model_dump(), "status": AssignmentStatus.APPROVED}
    )

    repo = AsyncMock()
    repo.get_by_id.return_value = assignment
    repo.update_status.return_value = approved

    result = await finalize_review(
        ReviewAssignmentInput(
            assignment_id=assignment.id,
            teacher_id=teacher_id,
            decision=ReviewDecision.APPROVE,
        ),
        assignment_repo=repo,
    )
    assert result.status == AssignmentStatus.APPROVED


@pytest.mark.asyncio
async def test_finalize_review_request_changes():
    teacher_id = uuid.uuid4()
    assignment = _make_assignment(AssignmentStatus.IN_REVIEW, teacher_id=teacher_id)
    changes = AssignmentEntity(
        **{**assignment.model_dump(), "status": AssignmentStatus.REQUIRES_CHANGES}
    )

    repo = AsyncMock()
    repo.get_by_id.return_value = assignment
    repo.update_status.return_value = changes

    result = await finalize_review(
        ReviewAssignmentInput(
            assignment_id=assignment.id,
            teacher_id=teacher_id,
            decision=ReviewDecision.REQUEST_CHANGES,
        ),
        assignment_repo=repo,
    )
    assert result.status == AssignmentStatus.REQUIRES_CHANGES


@pytest.mark.asyncio
async def test_finalize_review_not_in_review_raises():
    teacher_id = uuid.uuid4()
    assignment = _make_assignment(
        AssignmentStatus.PENDING_REVIEW, teacher_id=teacher_id
    )
    repo = AsyncMock()
    repo.get_by_id.return_value = assignment

    with pytest.raises(InvalidStatusTransitionError):
        await finalize_review(
            ReviewAssignmentInput(
                assignment_id=assignment.id,
                teacher_id=teacher_id,
                decision=ReviewDecision.APPROVE,
            ),
            assignment_repo=repo,
        )


@pytest.mark.asyncio
async def test_finalize_review_wrong_teacher_raises():
    assignment = _make_assignment(AssignmentStatus.IN_REVIEW)
    repo = AsyncMock()
    repo.get_by_id.return_value = assignment

    with pytest.raises(UnauthorizedAssignmentAccessError):
        await finalize_review(
            ReviewAssignmentInput(
                assignment_id=assignment.id,
                teacher_id=uuid.uuid4(),
                decision=ReviewDecision.APPROVE,
            ),
            assignment_repo=repo,
        )
