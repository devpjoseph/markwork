import uuid
from dataclasses import dataclass

from src.domain.entities.assignment import AssignmentEntity
from src.domain.entities.user import UserRole
from src.domain.repositories.i_assignment_repository import IAssignmentRepository
from src.domain.repositories.i_user_repository import IUserRepository


@dataclass
class CreateAssignmentInput:
    student_id: uuid.UUID
    teacher_id: uuid.UUID
    title: str
    initial_content: dict


async def create_assignment(
    data: CreateAssignmentInput,
    assignment_repo: IAssignmentRepository,
    user_repo: IUserRepository,
) -> AssignmentEntity:
    teacher = await user_repo.get_by_id(data.teacher_id)
    if not teacher or teacher.role != UserRole.TEACHER or not teacher.is_active:
        raise ValueError(f"Teacher {data.teacher_id} not found or is not an active teacher")

    return await assignment_repo.create(
        student_id=data.student_id,
        teacher_id=data.teacher_id,
        title=data.title,
        initial_content=data.initial_content,
    )
