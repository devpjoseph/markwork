import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi_pagination import Page
from pydantic import BaseModel

from src.api.dependencies.auth import CurrentUser, require_role
from src.api.dependencies.repositories import get_user_repo
from src.application.use_cases.admin import (
    delete_user,
    list_users,
    set_user_activation,
    set_user_role,
)
from src.domain.entities.user import UserEntity, UserRole

router = APIRouter(prefix="/admin", tags=["admin"])


class ActivationRequest(BaseModel):
    is_active: bool


class RoleRequest(BaseModel):
    role: UserRole


@router.get(
    "/users",
    response_model=Page[UserEntity],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def get_users(
    role: UserRole | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    user_repo=Depends(get_user_repo),
) -> Page[UserEntity]:
    result = await list_users(
        user_repo=user_repo, role=role, is_active=is_active, search=search
    )
    return Page(
        items=result.items,
        total=result.total,
        page=result.page,
        size=result.size,
        pages=result.pages,
    )


@router.patch("/users/{user_id}/activation", response_model=UserEntity)
async def patch_activation(
    user_id: uuid.UUID,
    body: ActivationRequest,
    current_admin: Annotated[CurrentUser, Depends(require_role(UserRole.ADMIN))],
    user_repo=Depends(get_user_repo),
) -> UserEntity:
    try:
        return await set_user_activation(
            user_repo=user_repo,
            target_id=user_id,
            is_active=body.is_active,
            current_admin=current_admin,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch("/users/{user_id}/role", response_model=UserEntity)
async def patch_role(
    user_id: uuid.UUID,
    body: RoleRequest,
    current_admin: Annotated[CurrentUser, Depends(require_role(UserRole.ADMIN))],
    user_repo=Depends(get_user_repo),
) -> UserEntity:
    try:
        return await set_user_role(
            user_repo=user_repo,
            target_id=user_id,
            role=body.role,
            current_admin=current_admin,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def delete_user_endpoint(
    user_id: uuid.UUID,
    current_admin: Annotated[CurrentUser, Depends(require_role(UserRole.ADMIN))],
    user_repo=Depends(get_user_repo),
) -> None:
    try:
        await delete_user(
            user_repo=user_repo, target_id=user_id, current_admin=current_admin
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

