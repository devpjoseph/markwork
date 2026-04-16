"""Unit tests for admin use cases."""

import uuid
from unittest.mock import AsyncMock

import pytest

from src.application.use_cases.admin import (
    list_users,
    set_user_activation,
    set_user_role,
)
from src.domain.entities.user import UserEntity, UserRole


def _user(role: UserRole = UserRole.STUDENT, is_active: bool = True) -> UserEntity:
    return UserEntity(
        id=uuid.uuid4(),
        email=f"u{uuid.uuid4().hex[:6]}@example.com",
        full_name="Test User",
        role=role,
        is_active=is_active,
    )


@pytest.mark.asyncio
async def test_list_users_passes_filters_to_repo():
    repo = AsyncMock()
    repo.list_paginated.return_value = "PAGE_SENTINEL"

    result = await list_users(
        user_repo=repo,
        role=UserRole.TEACHER,
        is_active=False,
        search="foo",
    )

    assert result == "PAGE_SENTINEL"
    repo.list_paginated.assert_awaited_once_with(
        role=UserRole.TEACHER, is_active=False, search="foo"
    )


@pytest.mark.asyncio
async def test_list_users_no_filters():
    repo = AsyncMock()
    repo.list_paginated.return_value = "ALL"
    result = await list_users(user_repo=repo)
    assert result == "ALL"
    repo.list_paginated.assert_awaited_once_with(
        role=None, is_active=None, search=None
    )


@pytest.mark.asyncio
async def test_set_user_activation_happy_path():
    admin = _user(UserRole.ADMIN)
    target = _user(UserRole.STUDENT, is_active=False)
    reactivated = UserEntity(**{**target.model_dump(), "is_active": True})

    repo = AsyncMock()
    repo.set_active.return_value = reactivated

    result = await set_user_activation(
        user_repo=repo,
        target_id=target.id,
        is_active=True,
        current_admin=admin,
    )

    assert result.is_active is True
    repo.set_active.assert_awaited_once_with(target.id, True)


@pytest.mark.asyncio
async def test_set_user_activation_self_deactivation_blocked():
    admin = _user(UserRole.ADMIN)
    repo = AsyncMock()

    with pytest.raises(PermissionError):
        await set_user_activation(
            user_repo=repo,
            target_id=admin.id,
            is_active=False,
            current_admin=admin,
        )
    repo.set_active.assert_not_called()


@pytest.mark.asyncio
async def test_set_user_activation_self_reactivation_allowed():
    admin = _user(UserRole.ADMIN)
    reactivated = UserEntity(**{**admin.model_dump(), "is_active": True})
    repo = AsyncMock()
    repo.set_active.return_value = reactivated

    result = await set_user_activation(
        user_repo=repo,
        target_id=admin.id,
        is_active=True,
        current_admin=admin,
    )
    assert result.is_active is True


@pytest.mark.asyncio
async def test_set_user_activation_not_found():
    admin = _user(UserRole.ADMIN)
    repo = AsyncMock()
    repo.set_active.return_value = None

    with pytest.raises(LookupError):
        await set_user_activation(
            user_repo=repo,
            target_id=uuid.uuid4(),
            is_active=True,
            current_admin=admin,
        )


@pytest.mark.asyncio
async def test_set_user_role_happy_path():
    admin = _user(UserRole.ADMIN)
    target = _user(UserRole.STUDENT)
    promoted = UserEntity(**{**target.model_dump(), "role": UserRole.TEACHER})
    repo = AsyncMock()
    repo.set_role.return_value = promoted

    result = await set_user_role(
        user_repo=repo, target_id=target.id, role=UserRole.TEACHER, current_admin=admin
    )
    assert result.role == UserRole.TEACHER
    repo.set_role.assert_awaited_once_with(target.id, UserRole.TEACHER)


@pytest.mark.asyncio
async def test_set_user_role_not_found():
    admin = _user(UserRole.ADMIN)
    repo = AsyncMock()
    repo.set_role.return_value = None
    with pytest.raises(LookupError):
        await set_user_role(
            user_repo=repo, target_id=uuid.uuid4(), role=UserRole.ADMIN, current_admin=admin
        )


@pytest.mark.asyncio
async def test_set_user_role_self_change_rejected():
    admin = _user(UserRole.ADMIN)
    repo = AsyncMock()
    with pytest.raises(PermissionError):
        await set_user_role(
            user_repo=repo, target_id=admin.id, role=UserRole.STUDENT, current_admin=admin
        )
    repo.set_role.assert_not_called()
