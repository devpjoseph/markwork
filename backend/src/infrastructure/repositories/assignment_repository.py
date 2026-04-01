import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.assignment import AssignmentEntity, AssignmentStatus, AssignmentVersionEntity
from src.domain.repositories.i_assignment_repository import IAssignmentRepository
from src.infrastructure.models.assignment import Assignment
from src.infrastructure.models.assignment_version import AssignmentVersion


class AssignmentRepository(IAssignmentRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, assignment_id: uuid.UUID) -> AssignmentEntity | None:
        result = await self._session.execute(select(Assignment).where(Assignment.id == assignment_id))
        row = result.scalar_one_or_none()
        return AssignmentEntity.model_validate(row) if row else None

    async def list_by_student(self, student_id: uuid.UUID) -> list[AssignmentEntity]:
        result = await self._session.execute(
            select(Assignment).where(Assignment.student_id == student_id).order_by(Assignment.updated_at.desc())
        )
        return [AssignmentEntity.model_validate(r) for r in result.scalars().all()]

    async def list_by_teacher(self, teacher_id: uuid.UUID) -> list[AssignmentEntity]:
        result = await self._session.execute(
            select(Assignment)
            .where(Assignment.teacher_id == teacher_id, Assignment.status != AssignmentStatus.DRAFT)
            .order_by(Assignment.updated_at.desc())
        )
        return [AssignmentEntity.model_validate(r) for r in result.scalars().all()]

    async def create(
        self,
        student_id: uuid.UUID,
        teacher_id: uuid.UUID,
        title: str,
        initial_content: dict,
    ) -> AssignmentEntity:
        assignment = Assignment(student_id=student_id, teacher_id=teacher_id, title=title)
        self._session.add(assignment)
        await self._session.flush()

        version = AssignmentVersion(assignment_id=assignment.id, version_number=1, content=initial_content)
        self._session.add(version)
        await self._session.flush()
        await self._session.refresh(assignment)
        return AssignmentEntity.model_validate(assignment)

    async def update_status(self, assignment_id: uuid.UUID, status: AssignmentStatus) -> AssignmentEntity | None:
        result = await self._session.execute(select(Assignment).where(Assignment.id == assignment_id))
        assignment = result.scalar_one_or_none()
        if not assignment:
            return None
        assignment.status = status
        await self._session.flush()
        await self._session.refresh(assignment)
        return AssignmentEntity.model_validate(assignment)

    async def add_version(self, assignment_id: uuid.UUID, content: dict) -> AssignmentVersionEntity:
        count_result = await self._session.execute(
            select(func.count()).select_from(AssignmentVersion).where(AssignmentVersion.assignment_id == assignment_id)
        )
        next_number = (count_result.scalar() or 0) + 1

        version = AssignmentVersion(assignment_id=assignment_id, version_number=next_number, content=content)
        self._session.add(version)
        await self._session.flush()
        await self._session.refresh(version)
        return AssignmentVersionEntity.model_validate(version)

    async def get_versions(self, assignment_id: uuid.UUID) -> list[AssignmentVersionEntity]:
        result = await self._session.execute(
            select(AssignmentVersion)
            .where(AssignmentVersion.assignment_id == assignment_id)
            .order_by(AssignmentVersion.version_number)
        )
        return [AssignmentVersionEntity.model_validate(v) for v in result.scalars().all()]

    async def update_latest_version(self, assignment_id: uuid.UUID, content: dict) -> AssignmentVersionEntity:
        result = await self._session.execute(
            select(AssignmentVersion)
            .where(AssignmentVersion.assignment_id == assignment_id)
            .order_by(AssignmentVersion.version_number.desc())
            .limit(1)
        )
        version = result.scalar_one()
        version.content = content
        await self._session.flush()
        await self._session.refresh(version)
        return AssignmentVersionEntity.model_validate(version)

    async def delete(self, assignment_id: uuid.UUID) -> None:
        result = await self._session.execute(select(Assignment).where(Assignment.id == assignment_id))
        assignment = result.scalar_one_or_none()
        if assignment:
            await self._session.delete(assignment)
            await self._session.flush()

    async def get_latest_version(self, assignment_id: uuid.UUID) -> AssignmentVersionEntity | None:
        result = await self._session.execute(
            select(AssignmentVersion)
            .where(AssignmentVersion.assignment_id == assignment_id)
            .order_by(AssignmentVersion.version_number.desc())
            .limit(1)
        )
        version = result.scalar_one_or_none()
        return AssignmentVersionEntity.model_validate(version) if version else None
