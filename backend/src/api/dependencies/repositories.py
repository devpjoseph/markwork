from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.repositories.i_assignment_repository import IAssignmentRepository
from src.domain.repositories.i_comment_repository import ICommentRepository
from src.domain.repositories.i_user_repository import IUserRepository
from src.infrastructure.database.session import get_db
from src.infrastructure.repositories.assignment_repository import AssignmentRepository
from src.infrastructure.repositories.comment_repository import CommentRepository
from src.infrastructure.repositories.user_repository import UserRepository


def get_user_repo(session: AsyncSession = Depends(get_db)) -> IUserRepository:
    return UserRepository(session)


def get_assignment_repo(
    session: AsyncSession = Depends(get_db),
) -> IAssignmentRepository:
    return AssignmentRepository(session)


def get_comment_repo(session: AsyncSession = Depends(get_db)) -> ICommentRepository:
    return CommentRepository(session)
