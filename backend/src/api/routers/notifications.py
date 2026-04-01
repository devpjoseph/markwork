import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.user import UserEntity
from src.infrastructure.auth.jwt import decode_access_token
from src.infrastructure.database.session import get_db
from src.infrastructure.repositories.user_repository import UserRepository
from src.api.sse.manager import sse_manager

router = APIRouter(prefix="/notifications", tags=["notifications"])


async def _user_from_token(
    token: str = Query(..., description="JWT access token"),
    session: AsyncSession = Depends(get_db),
) -> UserEntity:
    """Authenticate via query-param token (EventSource cannot set headers)."""
    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])
    except (ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


@router.get("/stream")
async def sse_stream(current_user: UserEntity = Depends(_user_from_token)):
    queue = sse_manager.connect(current_user.id)

    return StreamingResponse(
        sse_manager.event_generator(current_user.id, queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
