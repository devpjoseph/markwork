import uuid
from abc import ABC, abstractmethod

from src.domain.entities.comment import CommentEntity, CommentStatus


class ICommentRepository(ABC):
    @abstractmethod
    async def get_by_id(self, comment_id: uuid.UUID) -> CommentEntity | None: ...

    @abstractmethod
    async def list_by_assignment(
        self, assignment_id: uuid.UUID
    ) -> list[CommentEntity]: ...

    @abstractmethod
    async def create(
        self,
        assignment_id: uuid.UUID,
        author_id: uuid.UUID,
        tiptap_node_id: str,
        selected_text: str,
        content: str,
        parent_id: uuid.UUID | None = None,
    ) -> CommentEntity: ...

    @abstractmethod
    async def update_status(
        self, comment_id: uuid.UUID, status: CommentStatus
    ) -> CommentEntity | None: ...

    @abstractmethod
    async def update_content(
        self, comment_id: uuid.UUID, content: str
    ) -> CommentEntity | None: ...

    @abstractmethod
    async def delete(self, comment_id: uuid.UUID) -> None: ...
