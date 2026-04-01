import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class AssignmentStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    IN_REVIEW = "IN_REVIEW"
    REQUIRES_CHANGES = "REQUIRES_CHANGES"
    APPROVED = "APPROVED"


class AssignmentEntity(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    teacher_id: uuid.UUID
    title: str
    status: AssignmentStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AssignmentVersionEntity(BaseModel):
    id: uuid.UUID
    assignment_id: uuid.UUID
    version_number: int
    content: dict
    created_at: datetime

    model_config = {"from_attributes": True}
