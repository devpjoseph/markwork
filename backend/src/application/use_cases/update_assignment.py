import uuid
from dataclasses import dataclass

from src.domain.entities.assignment import AssignmentEntity, AssignmentVersionEntity
from src.domain.exceptions.assignment_exceptions import (
    AssignmentNotEditableError,
    AssignmentNotFoundError,
    UnauthorizedAssignmentAccessError,
)
from src.domain.repositories.i_assignment_repository import IAssignmentRepository

EDITABLE_STATUSES = {"DRAFT", "REQUIRES_CHANGES"}


@dataclass
class UpdateAssignmentInput:
    assignment_id: uuid.UUID
    student_id: uuid.UUID
    new_content: dict
    new_title: str | None = None


@dataclass
class UpdateAssignmentOutput:
    assignment: AssignmentEntity
    version: AssignmentVersionEntity


async def update_assignment(
    data: UpdateAssignmentInput,
    assignment_repo: IAssignmentRepository,
) -> UpdateAssignmentOutput:
    assignment = await assignment_repo.get_by_id(data.assignment_id)
    if not assignment:
        raise AssignmentNotFoundError(str(data.assignment_id))

    if assignment.student_id != data.student_id:
        raise UnauthorizedAssignmentAccessError()

    if assignment.status.value not in EDITABLE_STATUSES:
        raise AssignmentNotEditableError(str(data.assignment_id), assignment.status.value)

    version = await assignment_repo.update_latest_version(data.assignment_id, data.new_content)
    return UpdateAssignmentOutput(assignment=assignment, version=version)
