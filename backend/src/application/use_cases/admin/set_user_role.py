import uuid

from src.domain.entities.user import UserEntity, UserRole
from src.domain.repositories.i_user_repository import IUserRepository


async def set_user_role(
    user_repo: IUserRepository,
    target_id: uuid.UUID,
    role: UserRole,
    current_admin: UserEntity,
) -> UserEntity:
    if target_id == current_admin.id:
        raise PermissionError("Admins cannot change their own role.")

    updated = await user_repo.set_role(target_id, role)
    if updated is None:
        raise LookupError(f"User {target_id} not found.")
    return updated
