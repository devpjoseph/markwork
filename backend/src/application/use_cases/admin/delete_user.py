import uuid

from src.domain.entities.user import UserEntity
from src.domain.repositories.i_user_repository import IUserRepository


async def delete_user(
    user_repo: IUserRepository,
    target_id: uuid.UUID,
    current_admin: UserEntity,
) -> None:
    if target_id == current_admin.id:
        raise PermissionError("You cannot delete yourself via this endpoint.")

    target_user = await user_repo.get_by_id(target_id)
    if not target_user:
        raise LookupError(f"User with id {target_id} not found")

    deleted = await user_repo.delete(target_id)
    if not deleted:
        raise LookupError(f"User with id {target_id} could not be deleted")
