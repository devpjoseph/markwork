import uuid
from abc import ABC, abstractmethod

from src.domain.entities.assignment import (
    AssignmentEntity,
    AssignmentStatus,
    AssignmentVersionEntity,
)


class IAssignmentRepository(ABC):
    @abstractmethod
    async def get_by_id(self, assignment_id: uuid.UUID) -> AssignmentEntity | None: ...

    @abstractmethod
    async def list_by_student(
        self, student_id: uuid.UUID
    ) -> list[AssignmentEntity]: ...

    @abstractmethod
    async def list_by_teacher(
        self, teacher_id: uuid.UUID
    ) -> list[AssignmentEntity]: ...

    @abstractmethod
    async def create(
        self,
        student_id: uuid.UUID,
        teacher_id: uuid.UUID,
        title: str,
        initial_content: dict,
    ) -> AssignmentEntity: ...

    @abstractmethod
    async def update_status(
        self, assignment_id: uuid.UUID, status: AssignmentStatus
    ) -> AssignmentEntity | None: ...

    @abstractmethod
    async def update_title(
        self, assignment_id: uuid.UUID, title: str
    ) -> AssignmentEntity | None: ...

    @abstractmethod
    async def add_version(
        self, assignment_id: uuid.UUID, content: dict
    ) -> AssignmentVersionEntity: ...

    @abstractmethod
    async def update_latest_version(
        self, assignment_id: uuid.UUID, content: dict
    ) -> AssignmentVersionEntity: ...

    @abstractmethod
    async def get_versions(
        self, assignment_id: uuid.UUID
    ) -> list[AssignmentVersionEntity]: ...

    @abstractmethod
    async def get_latest_version(
        self, assignment_id: uuid.UUID
    ) -> AssignmentVersionEntity | None: ...

    @abstractmethod
    async def delete(self, assignment_id: uuid.UUID) -> None: ...
