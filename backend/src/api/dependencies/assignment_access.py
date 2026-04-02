"""Shared dependency that fetches an assignment and verifies ownership."""

import uuid

from fastapi import HTTPException, status

from src.domain.entities.assignment import AssignmentEntity
from src.domain.entities.user import UserEntity, UserRole
from src.domain.repositories.i_assignment_repository import IAssignmentRepository


async def get_authorized_assignment(
    assignment_id: uuid.UUID,
    current_user: UserEntity,
    assignment_repo: IAssignmentRepository,
) -> AssignmentEntity:
    """Fetch an assignment and verify the current user has access to it.

    Raises:
        HTTPException 404 if assignment does not exist.
        HTTPException 403 if the user is not the owner (student or teacher).
    """
    assignment = await assignment_repo.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    is_owner = (
        current_user.role == UserRole.STUDENT
        and assignment.student_id == current_user.id
    ) or (
        current_user.role == UserRole.TEACHER
        and assignment.teacher_id == current_user.id
    )
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return assignment
