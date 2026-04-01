import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class CommentStatus(str, Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class CommentEntity(BaseModel):
    id: uuid.UUID
    assignment_id: uuid.UUID
    author_id: uuid.UUID
    tiptap_node_id: str
    selected_text: str
    content: str
    status: CommentStatus
    created_at: datetime
    parent_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}
