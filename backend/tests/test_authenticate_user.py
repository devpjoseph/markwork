"""Unit tests for authenticate_with_google use case."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.application.use_cases.authenticate_user import authenticate_with_google
from src.domain.entities.user import UserEntity, UserRole


def _make_auth_service(email: str, full_name: str) -> AsyncMock:
    svc = MagicMock()
    svc.verify_google_token = AsyncMock(
        return_value={"email": email, "full_name": full_name}
    )
    svc.create_access_token = MagicMock(return_value="jwt-token")
    return svc


@pytest.mark.asyncio
async def test_creates_user_with_requested_role_teacher():
    repo = AsyncMock()
    repo.get_by_email.return_value = None

    created = UserEntity(
        id=uuid.uuid4(),
        email="new@x.com",
        full_name="New One",
        role=UserRole.TEACHER,
        is_active=True,
    )
    repo.create.return_value = created

    auth_svc = _make_auth_service("new@x.com", "New One")
    result = await authenticate_with_google(
        google_id_token="tok",
        user_repo=repo,
        auth_service=auth_svc,
        requested_role=UserRole.TEACHER,
    )

    repo.create.assert_awaited_once_with(
        email="new@x.com", full_name="New One", role=UserRole.TEACHER
    )
    assert result.user.role == UserRole.TEACHER


@pytest.mark.asyncio
async def test_ignores_requested_role_if_user_exists():
    existing = UserEntity(
        id=uuid.uuid4(),
        email="old@x.com",
        full_name="Old",
        role=UserRole.STUDENT,
        is_active=True,
    )
    repo = AsyncMock()
    repo.get_by_email.return_value = existing

    auth_svc = _make_auth_service("old@x.com", "Old")
    result = await authenticate_with_google(
        google_id_token="tok",
        user_repo=repo,
        auth_service=auth_svc,
        requested_role=UserRole.TEACHER,
    )

    repo.create.assert_not_called()
    assert result.user.role == UserRole.STUDENT


@pytest.mark.asyncio
async def test_rejects_admin_requested_role():
    repo = AsyncMock()
    auth_svc = _make_auth_service("x@x.com", "X")
    with pytest.raises(ValueError):
        await authenticate_with_google(
            google_id_token="tok",
            user_repo=repo,
            auth_service=auth_svc,
            requested_role=UserRole.ADMIN,
        )
    repo.get_by_email.assert_not_called()


@pytest.mark.asyncio
async def test_inactive_existing_user_raises_permission_error():
    existing = UserEntity(
        id=uuid.uuid4(),
        email="off@x.com",
        full_name="Off",
        role=UserRole.STUDENT,
        is_active=False,
    )
    repo = AsyncMock()
    repo.get_by_email.return_value = existing
    auth_svc = _make_auth_service("off@x.com", "Off")

    with pytest.raises(PermissionError):
        await authenticate_with_google(
            google_id_token="tok",
            user_repo=repo,
            auth_service=auth_svc,
            requested_role=UserRole.STUDENT,
        )


@pytest.mark.asyncio
async def test_new_user_created_inactive_returns_token():
    """New users get a token even when inactive so the frontend can redirect to pending-approval."""
    repo = AsyncMock()
    repo.get_by_email.return_value = None
    inactive = UserEntity(
        id=uuid.uuid4(),
        email="new@x.com",
        full_name="New",
        role=UserRole.STUDENT,
        is_active=False,
    )
    repo.create.return_value = inactive
    auth_svc = _make_auth_service("new@x.com", "New")

    result = await authenticate_with_google(
        google_id_token="tok",
        user_repo=repo,
        auth_service=auth_svc,
        requested_role=UserRole.STUDENT,
    )
    assert result.user.is_active is False
    assert result.access_token is None
