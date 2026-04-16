"""Tests for scripts.create_admin — idempotency."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.domain.entities.user import UserRole
from src.infrastructure.models.user import User


class _FakeSession:
    """In-memory stand-in for AsyncSession that supports the script's needs."""

    def __init__(self, store: dict):
        self._store = store  # keyed by email
        self._pending: list[User] = []

    async def execute(self, stmt):
        # Expect: select(User).where(User.email == email)
        # Extract email from the where clause via compiled params.
        compiled = stmt.compile(compile_kwargs={"literal_binds": True})
        sql = str(compiled)
        # Extract email literal crudely; tests only pass email this way.
        # Fall back to scanning _store for matching email.
        email = None
        for key in self._store:
            if f"'{key}'" in sql:
                email = key
                break

        user = self._store.get(email)

        result = MagicMock()
        result.scalar_one_or_none = MagicMock(return_value=user)
        return result

    def add(self, obj: User) -> None:
        self._pending.append(obj)

    async def flush(self) -> None:
        for obj in self._pending:
            self._store[obj.email] = obj
        self._pending.clear()

    async def refresh(self, obj: User) -> None:
        return None

    async def commit(self) -> None:
        return None

    async def rollback(self) -> None:
        return None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return None


@pytest.fixture
def fake_sessionmaker(monkeypatch):
    store: dict = {}

    def _factory():
        return _FakeSession(store)

    monkeypatch.setattr(
        "src.infrastructure.database.session.AsyncSessionLocal",
        _factory,
    )
    # Also patch the name imported into the script module.
    monkeypatch.setattr(
        "scripts.create_admin.AsyncSessionLocal",
        _factory,
    )
    return store


@pytest.mark.asyncio
async def test_creates_new_admin(fake_sessionmaker):
    from scripts.create_admin import create_or_promote_admin

    user, created = await create_or_promote_admin("a@example.com", "Admin One")

    assert created is True
    assert user.email == "a@example.com"
    assert user.role == UserRole.ADMIN
    assert user.is_active is True
    assert "a@example.com" in fake_sessionmaker


@pytest.mark.asyncio
async def test_promotes_existing_user(fake_sessionmaker):
    from scripts.create_admin import create_or_promote_admin

    # Seed an existing inactive student.
    existing = User(
        email="b@example.com",
        full_name="B",
        role=UserRole.STUDENT,
        is_active=False,
    )
    fake_sessionmaker["b@example.com"] = existing

    user, created = await create_or_promote_admin("b@example.com", "B Updated")
    assert created is False
    assert user.role == UserRole.ADMIN
    assert user.is_active is True


@pytest.mark.asyncio
async def test_idempotent_second_run(fake_sessionmaker):
    from scripts.create_admin import create_or_promote_admin

    u1, created1 = await create_or_promote_admin("c@example.com", "C")
    u2, created2 = await create_or_promote_admin("c@example.com", "C")

    assert created1 is True
    assert created2 is False
    assert u1.email == u2.email == "c@example.com"
    assert u2.role == UserRole.ADMIN
    assert u2.is_active is True
