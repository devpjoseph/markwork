class AssignmentNotFoundError(Exception):
    def __init__(self, assignment_id: str) -> None:
        super().__init__(f"Assignment {assignment_id} not found")


class AssignmentNotDraftError(Exception):
    def __init__(self, assignment_id: str) -> None:
        super().__init__(f"Assignment {assignment_id} is not in DRAFT status")


class AssignmentNotEditableError(Exception):
    def __init__(self, assignment_id: str, status: str) -> None:
        super().__init__(f"Assignment {assignment_id} cannot be edited in status {status}")


class UnauthorizedAssignmentAccessError(Exception):
    def __init__(self) -> None:
        super().__init__("You do not have permission to access this assignment")


class InvalidStatusTransitionError(Exception):
    def __init__(self, from_status: str, to_status: str) -> None:
        super().__init__(f"Cannot transition assignment from {from_status} to {to_status}")
