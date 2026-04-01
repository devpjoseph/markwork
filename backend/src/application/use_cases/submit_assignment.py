import uuid

from src.domain.entities.assignment import AssignmentEntity, AssignmentStatus
from src.domain.exceptions.assignment_exceptions import (
    AssignmentNotFoundError,
    InvalidStatusTransitionError,
    UnauthorizedAssignmentAccessError,
)
from src.domain.repositories.i_assignment_repository import IAssignmentRepository

SUBMITTABLE_STATUSES = {AssignmentStatus.DRAFT, AssignmentStatus.REQUIRES_CHANGES}


async def submit_assignment(
    assignment_id: uuid.UUID,
    student_id: uuid.UUID,
    assignment_repo: IAssignmentRepository,
) -> AssignmentEntity:
    assignment = await assignment_repo.get_by_id(assignment_id)
    if not assignment:
        raise AssignmentNotFoundError(str(assignment_id))

    if assignment.student_id != student_id:
        raise UnauthorizedAssignmentAccessError()

    if assignment.status not in SUBMITTABLE_STATUSES:
        raise InvalidStatusTransitionError(assignment.status.value, AssignmentStatus.PENDING_REVIEW.value)

    return await assignment_repo.update_status(assignment_id, AssignmentStatus.PENDING_REVIEW)
