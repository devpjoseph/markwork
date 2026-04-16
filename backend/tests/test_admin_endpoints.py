"""Integration tests for admin endpoints (auth guards)."""

import uuid
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from src.api.dependencies.auth import get_current_user
from src.api.dependencies.repositories import get_user_repo
from src.domain.entities.user import UserEntity, UserRole
from src.main import app

client = TestClient(app)


def _user(role: UserRole) -> UserEntity:
    return UserEntity(
        id=uuid.uuid4(),
        email="x@example.com",
        full_name="X",
        role=role,
        is_active=True,
    )


@pytest.fixture
def override_deps():
    yield
    app.dependency_overrides.clear()


def _set_current_user(u: UserEntity) -> None:
    app.dependency_overrides[get_current_user] = lambda: u


def _set_user_repo() -> AsyncMock:
    repo = AsyncMock()
    app.dependency_overrides[get_user_repo] = lambda: repo
    return repo


@pytest.mark.parametrize("role", [UserRole.STUDENT, UserRole.TEACHER])
def test_admin_list_users_forbidden_for_non_admin(override_deps, role):
    _set_current_user(_user(role))
    _set_user_repo()

    r = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": "Bearer fake"},
    )
    assert r.status_code == 403


@pytest.mark.parametrize("role", [UserRole.STUDENT, UserRole.TEACHER])
def test_admin_patch_activation_forbidden_for_non_admin(override_deps, role):
    _set_current_user(_user(role))
    _set_user_repo()

    r = client.patch(
        f"/api/v1/admin/users/{uuid.uuid4()}/activation",
        json={"is_active": True},
        headers={"Authorization": "Bearer fake"},
    )
    assert r.status_code == 403


@pytest.mark.parametrize("role", [UserRole.STUDENT, UserRole.TEACHER])
def test_admin_patch_role_forbidden_for_non_admin(override_deps, role):
    _set_current_user(_user(role))
    _set_user_repo()

    r = client.patch(
        f"/api/v1/admin/users/{uuid.uuid4()}/role",
        json={"role": "TEACHER"},
        headers={"Authorization": "Bearer fake"},
    )
    assert r.status_code == 403


def test_admin_self_deactivation_returns_403(override_deps):
    admin = _user(UserRole.ADMIN)
    _set_current_user(admin)
    repo = _set_user_repo()

    r = client.patch(
        f"/api/v1/admin/users/{admin.id}/activation",
        json={"is_active": False},
        headers={"Authorization": "Bearer fake"},
    )
    assert r.status_code == 403
    repo.set_active.assert_not_called()


def test_admin_can_set_role(override_deps):
    admin = _user(UserRole.ADMIN)
    _set_current_user(admin)
    repo = _set_user_repo()

    target_id = uuid.uuid4()
    updated = UserEntity(
        id=target_id,
        email="t@example.com",
        full_name="T",
        role=UserRole.TEACHER,
        is_active=True,
    )
    repo.set_role.return_value = updated

    r = client.patch(
        f"/api/v1/admin/users/{target_id}/role",
        json={"role": "TEACHER"},
        headers={"Authorization": "Bearer fake"},
    )
    assert r.status_code == 200
    assert r.json()["role"] == "TEACHER"
