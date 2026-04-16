import uuid

from src.domain.entities.user import UserEntity
from src.domain.repositories.i_user_repository import IUserRepository


async def set_user_activation(
    user_repo: IUserRepository,
    target_id: uuid.UUID,
    is_active: bool,
    current_admin: UserEntity,
) -> UserEntity:
    if target_id == current_admin.id and not is_active:
        raise PermissionError("Admins cannot deactivate their own account.")

    updated = await user_repo.set_active(target_id, is_active)
    if updated is None:
        raise LookupError(f"User {target_id} not found.")
    return updated
