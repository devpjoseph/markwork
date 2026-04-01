import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi_pagination import Page, paginate
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth import CurrentUser, require_role
from src.api.sse.manager import EventType, SSEEvent, sse_manager
from src.application.use_cases.create_assignment import CreateAssignmentInput, create_assignment
from src.application.use_cases.delete_assignment import delete_assignment
from src.application.use_cases.review_assignment import (
    ReviewAssignmentInput,
    ReviewDecision,
    finalize_review,
    start_review,
)
from src.application.use_cases.submit_assignment import submit_assignment
from src.application.use_cases.update_assignment import UpdateAssignmentInput, update_assignment
from src.domain.entities.assignment import AssignmentEntity, AssignmentVersionEntity
from src.domain.entities.user import UserRole
from src.domain.exceptions.assignment_exceptions import (
    AssignmentNotEditableError,
    AssignmentNotFoundError,
    InvalidStatusTransitionError,
    UnauthorizedAssignmentAccessError,
)
from src.infrastructure.database.session import get_db
from src.infrastructure.repositories.assignment_repository import AssignmentRepository
from src.infrastructure.repositories.user_repository import UserRepository

router = APIRouter(prefix="/assignments", tags=["assignments"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class CreateAssignmentRequest(BaseModel):
    teacher_id: uuid.UUID
    title: str
    initial_content: dict


class UpdateAssignmentRequest(BaseModel):
    content: dict
    title: str | None = None


class ReviewRequest(BaseModel):
    decision: ReviewDecision


# ── Helpers ───────────────────────────────────────────────────────────────────

def _assignment_repo(session: AsyncSession = Depends(get_db)):
    return AssignmentRepository(session)


def _user_repo(session: AsyncSession = Depends(get_db)):
    return UserRepository(session)


def _handle_assignment_errors(exc: Exception) -> HTTPException:
    if isinstance(exc, AssignmentNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, UnauthorizedAssignmentAccessError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    if isinstance(exc, (AssignmentNotEditableError, InvalidStatusTransitionError)):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("", response_model=AssignmentEntity, status_code=status.HTTP_201_CREATED)
async def create(
    body: CreateAssignmentRequest,
    current_user: CurrentUser,
    assignment_repo=Depends(_assignment_repo),
    user_repo=Depends(_user_repo),
):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can create assignments")
    try:
        assignment = await create_assignment(
            CreateAssignmentInput(
                student_id=current_user.id,
                teacher_id=body.teacher_id,
                title=body.title,
                initial_content=body.initial_content,
            ),
            assignment_repo=assignment_repo,
            user_repo=user_repo,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return assignment


@router.get("", response_model=Page[AssignmentEntity])
async def list_assignments(
    current_user: CurrentUser,
    assignment_repo=Depends(_assignment_repo),
):
    if current_user.role == UserRole.STUDENT:
        items = await assignment_repo.list_by_student(current_user.id)
    elif current_user.role == UserRole.TEACHER:
        items = await assignment_repo.list_by_teacher(current_user.id)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins use the admin panel")
    return paginate(items)


@router.get("/{assignment_id}", response_model=AssignmentEntity)
async def get_assignment(
    assignment_id: uuid.UUID,
    current_user: CurrentUser,
    assignment_repo=Depends(_assignment_repo),
):
    assignment = await assignment_repo.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if current_user.role == UserRole.STUDENT and assignment.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == UserRole.TEACHER and assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return assignment


@router.put("/{assignment_id}", response_model=AssignmentEntity)
async def update(
    assignment_id: uuid.UUID,
    body: UpdateAssignmentRequest,
    current_user: Annotated[CurrentUser, Depends(require_role(UserRole.STUDENT))],
    assignment_repo=Depends(_assignment_repo),
):
    try:
        result = await update_assignment(
            UpdateAssignmentInput(
                assignment_id=assignment_id,
                student_id=current_user.id,
                new_content=body.content,
                new_title=body.title,
            ),
            assignment_repo=assignment_repo,
        )
    except Exception as exc:
        raise _handle_assignment_errors(exc)
    return result.assignment


@router.post("/{assignment_id}/submit", response_model=AssignmentEntity)
async def submit(
    assignment_id: uuid.UUID,
    current_user: Annotated[CurrentUser, Depends(require_role(UserRole.STUDENT))],
    assignment_repo=Depends(_assignment_repo),
):
    try:
        assignment = await submit_assignment(assignment_id, current_user.id, assignment_repo)
    except Exception as exc:
        raise _handle_assignment_errors(exc)

    await sse_manager.push(SSEEvent(
        event_type=EventType.ASSIGNMENT_SUBMITTED,
        data={"assignment_id": str(assignment.id), "title": assignment.title},
        target_user_id=assignment.teacher_id,
    ))
    return assignment


@router.post("/{assignment_id}/review/start", response_model=AssignmentEntity)
async def begin_review(
    assignment_id: uuid.UUID,
    current_user: Annotated[CurrentUser, Depends(require_role(UserRole.TEACHER))],
    assignment_repo=Depends(_assignment_repo),
):
    try:
        assignment = await start_review(assignment_id, current_user.id, assignment_repo)
    except Exception as exc:
        raise _handle_assignment_errors(exc)

    await sse_manager.push(SSEEvent(
        event_type=EventType.ASSIGNMENT_STATUS_CHANGED,
        data={"assignment_id": str(assignment.id), "status": assignment.status.value},
        target_user_id=assignment.student_id,
    ))
    return assignment


@router.post("/{assignment_id}/review/finalize", response_model=AssignmentEntity)
async def end_review(
    assignment_id: uuid.UUID,
    body: ReviewRequest,
    current_user: Annotated[CurrentUser, Depends(require_role(UserRole.TEACHER))],
    assignment_repo=Depends(_assignment_repo),
):
    try:
        assignment = await finalize_review(
            ReviewAssignmentInput(
                assignment_id=assignment_id,
                teacher_id=current_user.id,
                decision=body.decision,
            ),
            assignment_repo=assignment_repo,
        )
    except Exception as exc:
        raise _handle_assignment_errors(exc)

    await sse_manager.push(SSEEvent(
        event_type=EventType.ASSIGNMENT_STATUS_CHANGED,
        data={"assignment_id": str(assignment.id), "status": assignment.status.value},
        target_user_id=assignment.student_id,
    ))
    return assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    assignment_id: uuid.UUID,
    current_user: Annotated[CurrentUser, Depends(require_role(UserRole.STUDENT))],
    assignment_repo=Depends(_assignment_repo),
):
    try:
        await delete_assignment(
            assignment_id=assignment_id,
            actor_id=current_user.id,
            actor_role=current_user.role,
            assignment_repo=assignment_repo,
        )
    except Exception as exc:
        raise _handle_assignment_errors(exc)


@router.get("/{assignment_id}/versions", response_model=list[AssignmentVersionEntity])
async def get_versions(
    assignment_id: uuid.UUID,
    current_user: CurrentUser,
    assignment_repo=Depends(_assignment_repo),
):
    assignment = await assignment_repo.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if current_user.role == UserRole.STUDENT and assignment.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == UserRole.TEACHER and assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return await assignment_repo.get_versions(assignment_id)
