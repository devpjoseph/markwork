import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth import CurrentUser, require_role
from src.api.sse.manager import EventType, SSEEvent, sse_manager
from src.application.use_cases.add_comment import AddCommentInput, add_comment
from src.application.use_cases.delete_comment import delete_comment
from src.application.use_cases.resolve_comment import resolve_comment
from src.application.use_cases.update_comment import update_comment
from src.domain.entities.comment import CommentEntity, CommentStatus
from src.domain.entities.user import UserRole
from src.infrastructure.database.session import get_db
from src.infrastructure.repositories.assignment_repository import AssignmentRepository
from src.infrastructure.repositories.comment_repository import CommentRepository

router = APIRouter(prefix="/assignments/{assignment_id}/comments", tags=["comments"])
standalone_router = APIRouter(prefix="/comments", tags=["comments"])


class CreateCommentRequest(BaseModel):
    tiptap_node_id: str
    selected_text: str
    content: str
    parent_id: uuid.UUID | None = None


class UpdateCommentRequest(BaseModel):
    status: CommentStatus | None = None
    content: str | None = None


def _comment_repo(session: AsyncSession = Depends(get_db)):
    return CommentRepository(session)


def _assignment_repo(session: AsyncSession = Depends(get_db)):
    return AssignmentRepository(session)


@router.get("", response_model=list[CommentEntity])
async def list_comments(
    assignment_id: uuid.UUID,
    current_user: CurrentUser,
    comment_repo=Depends(_comment_repo),
    assignment_repo=Depends(_assignment_repo),
):
    assignment = await assignment_repo.get_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if current_user.role == UserRole.STUDENT and assignment.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == UserRole.TEACHER and assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return await comment_repo.list_by_assignment(assignment_id)


@router.post("", response_model=CommentEntity, status_code=status.HTTP_201_CREATED)
async def create_comment(
    assignment_id: uuid.UUID,
    body: CreateCommentRequest,
    current_user: Annotated[CurrentUser, Depends(require_role(UserRole.TEACHER))],
    comment_repo=Depends(_comment_repo),
    assignment_repo=Depends(_assignment_repo),
):
    try:
        comment = await add_comment(
            AddCommentInput(
                assignment_id=assignment_id,
                author_id=current_user.id,
                author_role=current_user.role,
                tiptap_node_id=body.tiptap_node_id,
                selected_text=body.selected_text,
                content=body.content,
                parent_id=body.parent_id,
            ),
            assignment_repo=assignment_repo,
            comment_repo=comment_repo,
        )
    except (ValueError, PermissionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    assignment = await assignment_repo.get_by_id(assignment_id)
    if assignment:
        await sse_manager.push(SSEEvent(
            event_type=EventType.COMMENT_ADDED,
            data={"comment_id": str(comment.id), "assignment_id": str(assignment_id)},
            target_user_id=assignment.student_id,
        ))

    return comment


@standalone_router.patch("/{comment_id}", response_model=CommentEntity)
async def update_comment_endpoint(
    comment_id: uuid.UUID,
    body: UpdateCommentRequest,
    current_user: CurrentUser,
    comment_repo=Depends(_comment_repo),
    assignment_repo=Depends(_assignment_repo),
):
    if body.status is not None:
        try:
            comment = await resolve_comment(
                comment_id=comment_id,
                actor_id=current_user.id,
                actor_role=current_user.role,
                new_status=body.status,
                comment_repo=comment_repo,
            )
        except (ValueError, PermissionError) as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

        await sse_manager.push(SSEEvent(
            event_type=EventType.COMMENT_STATUS_CHANGED,
            data={"comment_id": str(comment.id), "status": comment.status.value},
            target_user_id=current_user.id,
        ))
        return comment

    if body.content is not None:
        try:
            comment = await update_comment(
                comment_id=comment_id,
                actor_id=current_user.id,
                actor_role=current_user.role,
                new_content=body.content,
                comment_repo=comment_repo,
                assignment_repo=assignment_repo,
            )
        except (ValueError, PermissionError) as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
        return comment

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide status or content to update")


@standalone_router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment_endpoint(
    comment_id: uuid.UUID,
    current_user: CurrentUser,
    comment_repo=Depends(_comment_repo),
    assignment_repo=Depends(_assignment_repo),
):
    try:
        await delete_comment(
            comment_id=comment_id,
            actor_id=current_user.id,
            actor_role=current_user.role,
            comment_repo=comment_repo,
            assignment_repo=assignment_repo,
        )
    except (ValueError, PermissionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
