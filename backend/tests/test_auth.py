"""Integration tests for authentication flows."""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from src.api.dependencies.repositories import get_user_repo
from src.domain.entities.user import UserEntity, UserRole
from src.main import app

client = TestClient(app)


def _make_user(role: UserRole) -> UserEntity:
    return UserEntity(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        role=role,
        is_active=True,
    )


@pytest.fixture
def mock_user_repo():
    repo = AsyncMock()
    app.dependency_overrides[get_user_repo] = lambda: repo
    yield repo
    app.dependency_overrides.clear()


def test_student_register(mock_user_repo):
    """Test registration of a new student via Google Auth."""
    mock_user_repo.get_by_email.return_value = None
    new_user = _make_user(UserRole.STUDENT)
    mock_user_repo.create.return_value = new_user

    google_data = {
        "email": "new.student@example.com",
        "full_name": "New Student",
    }

    with patch(
        "src.infrastructure.auth.auth_service.AuthService.verify_google_token",
        new_callable=AsyncMock,
    ) as mock_verify:
        mock_verify.return_value = google_data

        # We need to mock create_access_token because we don't have a real SECRET_KEY available that isn't expired
        # However, testing router directly, so we just patch verify_google_token.
        # Actually JWT uses a SECRET_KEY, which conftest sets to "test_secret_key_for_unit_tests_only"

        response = client.post("/api/v1/auth/google", json={"id_token": "valid_token"})

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] is not None
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["role"] == "STUDENT"

        mock_verify.assert_called_once_with("valid_token")
        mock_user_repo.get_by_email.assert_awaited_once_with(google_data["email"])
        mock_user_repo.create.assert_awaited_once_with(
            email=google_data["email"],
            full_name=google_data["full_name"],
            role=UserRole.STUDENT,
        )


def test_student_login(mock_user_repo):
    """Test login of an existing student via Google Auth."""
    existing_user = _make_user(UserRole.STUDENT)
    mock_user_repo.get_by_email.return_value = existing_user

    google_data = {
        "email": "test@example.com",
        "full_name": "Test User",
    }

    with patch(
        "src.infrastructure.auth.auth_service.AuthService.verify_google_token",
        new_callable=AsyncMock,
    ) as mock_verify:
        mock_verify.return_value = google_data

        response = client.post("/api/v1/auth/google", json={"id_token": "valid_token"})

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] is not None
        assert data["user"]["role"] == "STUDENT"

        mock_user_repo.get_by_email.assert_awaited_once_with(google_data["email"])
        mock_user_repo.create.assert_not_called()


def test_teacher_login(mock_user_repo):
    """Test login of an existing teacher via Google Auth."""
    existing_teacher = _make_user(UserRole.TEACHER)
    mock_user_repo.get_by_email.return_value = existing_teacher

    google_data = {
        "email": "test@example.com",
        "full_name": "Test User",
    }

    with patch(
        "src.infrastructure.auth.auth_service.AuthService.verify_google_token",
        new_callable=AsyncMock,
    ) as mock_verify:
        mock_verify.return_value = google_data

        response = client.post("/api/v1/auth/google", json={"id_token": "valid_token"})

        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] is not None
        assert data["user"]["role"] == "TEACHER"

        mock_user_repo.get_by_email.assert_awaited_once_with(google_data["email"])
        mock_user_repo.create.assert_not_called()


def test_inactive_user_login(mock_user_repo):
    """Test login attempt by an inactive user."""
    inactive_user = _make_user(UserRole.STUDENT)
    inactive_user.is_active = False
    mock_user_repo.get_by_email.return_value = inactive_user

    with patch(
        "src.infrastructure.auth.auth_service.AuthService.verify_google_token",
        new_callable=AsyncMock,
    ) as mock_verify:
        mock_verify.return_value = {
            "email": "test@example.com",
            "full_name": "Test User",
        }

        response = client.post("/api/v1/auth/google", json={"id_token": "valid_token"})

        assert response.status_code == 403
        assert "Account is deactivated" in response.json()["detail"]
