import uuid

from src.domain.entities.assignment import AssignmentStatus
from src.domain.entities.user import UserRole
from src.domain.exceptions.assignment_exceptions import (
    AssignmentNotFoundError,
    AssignmentNotEditableError,
    UnauthorizedAssignmentAccessError,
)
from src.domain.repositories.i_assignment_repository import IAssignmentRepository


async def delete_assignment(
    assignment_id: uuid.UUID,
    actor_id: uuid.UUID,
    actor_role: UserRole,
    assignment_repo: IAssignmentRepository,
) -> None:
    assignment = await assignment_repo.get_by_id(assignment_id)
    if not assignment:
        raise AssignmentNotFoundError(str(assignment_id))

    if actor_role != UserRole.STUDENT or assignment.student_id != actor_id:
        raise UnauthorizedAssignmentAccessError()

    if assignment.status != AssignmentStatus.DRAFT:
        raise AssignmentNotEditableError(str(assignment_id), assignment.status.value)

    await assignment_repo.delete(assignment_id)
