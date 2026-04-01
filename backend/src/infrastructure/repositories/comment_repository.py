import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.comment import CommentEntity, CommentStatus
from src.domain.repositories.i_comment_repository import ICommentRepository
from src.infrastructure.models.comment import Comment


class CommentRepository(ICommentRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, comment_id: uuid.UUID) -> CommentEntity | None:
        result = await self._session.execute(select(Comment).where(Comment.id == comment_id))
        comment = result.scalar_one_or_none()
        return CommentEntity.model_validate(comment) if comment else None

    async def list_by_assignment(self, assignment_id: uuid.UUID) -> list[CommentEntity]:
        result = await self._session.execute(
            select(Comment)
            .where(Comment.assignment_id == assignment_id)
            .order_by(Comment.created_at)
        )
        return [CommentEntity.model_validate(c) for c in result.scalars().all()]

    async def create(
        self,
        assignment_id: uuid.UUID,
        author_id: uuid.UUID,
        tiptap_node_id: str,
        selected_text: str,
        content: str,
        parent_id: uuid.UUID | None = None,
    ) -> CommentEntity:
        comment = Comment(
            assignment_id=assignment_id,
            author_id=author_id,
            tiptap_node_id=tiptap_node_id,
            selected_text=selected_text,
            content=content,
            parent_id=parent_id,
        )
        self._session.add(comment)
        await self._session.flush()
        await self._session.refresh(comment)
        return CommentEntity.model_validate(comment)

    async def update_status(self, comment_id: uuid.UUID, status: CommentStatus) -> CommentEntity | None:
        result = await self._session.execute(select(Comment).where(Comment.id == comment_id))
        comment = result.scalar_one_or_none()
        if not comment:
            return None
        comment.status = status
        await self._session.flush()
        await self._session.refresh(comment)
        return CommentEntity.model_validate(comment)

    async def update_content(self, comment_id: uuid.UUID, content: str) -> CommentEntity | None:
        result = await self._session.execute(select(Comment).where(Comment.id == comment_id))
        comment = result.scalar_one_or_none()
        if not comment:
            return None
        comment.content = content
        await self._session.flush()
        await self._session.refresh(comment)
        return CommentEntity.model_validate(comment)

    async def delete(self, comment_id: uuid.UUID) -> None:
        result = await self._session.execute(select(Comment).where(Comment.id == comment_id))
        comment = result.scalar_one_or_none()
        if comment:
            await self._session.delete(comment)
            await self._session.flush()
