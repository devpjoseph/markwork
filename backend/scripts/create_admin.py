"""Bootstrap script to create or promote an ADMIN user.

Usage:
    python -m scripts.create_admin <email> "<full_name>"

Idempotent: if the user exists it is promoted to ADMIN and activated.
"""

import asyncio
import sys

from sqlalchemy import select

from src.domain.entities.user import UserRole
from src.infrastructure.database.session import AsyncSessionLocal
from src.infrastructure.models.user import User


async def create_or_promote_admin(email: str, full_name: str) -> tuple[User, bool]:
    """Returns (user, created) where created=True if a new row was inserted."""
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            created = False

            if user is None:
                user = User(
                    email=email,
                    full_name=full_name,
                    role=UserRole.ADMIN,
                    is_active=True,
                )
                session.add(user)
                created = True
            else:
                user.role = UserRole.ADMIN
                user.is_active = True

            await session.flush()
            await session.refresh(user)
            await session.commit()
            return user, created
        except Exception:
            await session.rollback()
            raise


async def _main(email: str, full_name: str) -> int:
    user, created = await create_or_promote_admin(email, full_name)
    action = "created" if created else "promoted"
    print(
        f"Admin {action}: id={user.id} email={user.email} "
        f"full_name={user.full_name!r} role={user.role.value} is_active={user.is_active}"
    )
    return 0


def main() -> None:
    if len(sys.argv) != 3:
        print(
            'Usage: python -m scripts.create_admin <email> "<full_name>"',
            file=sys.stderr,
        )
        sys.exit(2)
    email = sys.argv[1].strip()
    full_name = sys.argv[2].strip()
    if not email or not full_name:
        print("email and full_name must be non-empty.", file=sys.stderr)
        sys.exit(2)
    sys.exit(asyncio.run(_main(email, full_name)))


if __name__ == "__main__":
    main()
