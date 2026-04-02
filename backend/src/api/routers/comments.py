import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from src.api.dependencies.auth import CurrentUser, require_role
from src.api.dependencies.assignment_access import get_authorized_assignment
from src.api.dependencies.repositories import get_assignment_repo, get_comment_repo
from src.api.sse.manager import EventType, SSEEvent, sse_manager
from src.application.use_cases.add_comment import AddCommentInput, add_comment
from src.application.use_cases.delete_comment import delete_comment
from src.application.use_cases.resolve_comment import resolve_comment
from src.application.use_cases.update_comment import update_comment
from src.domain.entities.comment import CommentEntity, CommentStatus
from src.domain.entities.user import UserRole
from src.domain.exceptions.assignment_exceptions import (
    UnauthorizedAssignmentAccessError,
)

router = APIRouter(prefix="/assignments/{assignment_id}/comments", tags=["comments"])
standalone_router = APIRouter(prefix="/comments", tags=["comments"])


class CreateCommentRequest(BaseModel):
    tiptap_node_id: str = Field(..., max_length=255)
    selected_text: str = Field(..., max_length=5000)
    content: str = Field(..., min_length=1, max_length=10000)
    parent_id: uuid.UUID | None = None


class UpdateCommentRequest(BaseModel):
    status: CommentStatus | None = None
    content: str | None = Field(default=None, min_length=1, max_length=10000)


@router.get("", response_model=list[CommentEntity])
async def list_comments(
    assignment_id: uuid.UUID,
    current_user: CurrentUser,
    comment_repo=Depends(get_comment_repo),
    assignment_repo=Depends(get_assignment_repo),
):
    await get_authorized_assignment(assignment_id, current_user, assignment_repo)
    return await comment_repo.list_by_assignment(assignment_id)


@router.post("", response_model=CommentEntity, status_code=status.HTTP_201_CREATED)
async def create_comment(
    assignment_id: uuid.UUID,
    body: CreateCommentRequest,
    current_user: Annotated[CurrentUser, Depends(require_role(UserRole.TEACHER))],
    comment_repo=Depends(get_comment_repo),
    assignment_repo=Depends(get_assignment_repo),
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
        await sse_manager.push(
            SSEEvent(
                event_type=EventType.COMMENT_ADDED,
                data={
                    "comment_id": str(comment.id),
                    "assignment_id": str(assignment_id),
                },
                target_user_id=assignment.student_id,
            )
        )

    return comment


@standalone_router.patch("/{comment_id}", response_model=CommentEntity)
async def update_comment_endpoint(
    comment_id: uuid.UUID,
    body: UpdateCommentRequest,
    current_user: CurrentUser,
    comment_repo=Depends(get_comment_repo),
    assignment_repo=Depends(get_assignment_repo),
):
    if body.status is not None:
        try:
            comment = await resolve_comment(
                comment_id=comment_id,
                actor_id=current_user.id,
                actor_role=current_user.role,
                new_status=body.status,
                comment_repo=comment_repo,
                assignment_repo=assignment_repo,
            )
        except UnauthorizedAssignmentAccessError as exc:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
        except (ValueError, PermissionError) as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
            )

        # Notify the other party (not the actor)
        assignment = await assignment_repo.get_by_id(comment.assignment_id)
        if assignment:
            target_id = (
                assignment.student_id
                if current_user.id == assignment.teacher_id
                else assignment.teacher_id
            )
            await sse_manager.push(
                SSEEvent(
                    event_type=EventType.COMMENT_STATUS_CHANGED,
                    data={
                        "comment_id": str(comment.id),
                        "status": comment.status.value,
                    },
                    target_user_id=target_id,
                )
            )
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
            )
        return comment

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Provide status or content to update",
    )


@standalone_router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment_endpoint(
    comment_id: uuid.UUID,
    current_user: CurrentUser,
    comment_repo=Depends(get_comment_repo),
    assignment_repo=Depends(get_assignment_repo),
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
