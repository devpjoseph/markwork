import uuid
from dataclasses import dataclass
from enum import Enum

from src.domain.entities.assignment import AssignmentEntity, AssignmentStatus
from src.domain.entities.user import UserRole
from src.domain.exceptions.assignment_exceptions import (
    AssignmentNotFoundError,
    InvalidStatusTransitionError,
    UnauthorizedAssignmentAccessError,
)
from src.domain.repositories.i_assignment_repository import IAssignmentRepository


class ReviewDecision(str, Enum):
    APPROVE = "APPROVE"
    REQUEST_CHANGES = "REQUEST_CHANGES"


@dataclass
class ReviewAssignmentInput:
    assignment_id: uuid.UUID
    teacher_id: uuid.UUID
    decision: ReviewDecision


async def start_review(
    assignment_id: uuid.UUID,
    teacher_id: uuid.UUID,
    assignment_repo: IAssignmentRepository,
) -> AssignmentEntity:
    """Transitions PENDING_REVIEW → IN_REVIEW when teacher opens the assignment."""
    assignment = await assignment_repo.get_by_id(assignment_id)
    if not assignment:
        raise AssignmentNotFoundError(str(assignment_id))

    if assignment.teacher_id != teacher_id:
        raise UnauthorizedAssignmentAccessError()

    if assignment.status != AssignmentStatus.PENDING_REVIEW:
        raise InvalidStatusTransitionError(assignment.status.value, AssignmentStatus.IN_REVIEW.value)

    return await assignment_repo.update_status(assignment_id, AssignmentStatus.IN_REVIEW)


async def finalize_review(
    data: ReviewAssignmentInput,
    assignment_repo: IAssignmentRepository,
) -> AssignmentEntity:
    """Transitions IN_REVIEW → APPROVED or REQUIRES_CHANGES."""
    assignment = await assignment_repo.get_by_id(data.assignment_id)
    if not assignment:
        raise AssignmentNotFoundError(str(data.assignment_id))

    if assignment.teacher_id != data.teacher_id:
        raise UnauthorizedAssignmentAccessError()

    if assignment.status != AssignmentStatus.IN_REVIEW:
        raise InvalidStatusTransitionError(assignment.status.value, data.decision.value)

    target = (
        AssignmentStatus.APPROVED
        if data.decision == ReviewDecision.APPROVE
        else AssignmentStatus.REQUIRES_CHANGES
    )

    if target == AssignmentStatus.REQUIRES_CHANGES:
        latest = await assignment_repo.get_latest_version(data.assignment_id)
        if latest:
            await assignment_repo.add_version(data.assignment_id, latest.content)

    return await assignment_repo.update_status(data.assignment_id, target)
