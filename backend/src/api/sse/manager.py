import asyncio
import json
import uuid
from dataclasses import dataclass
from enum import Enum


class EventType(str, Enum):
    ASSIGNMENT_SUBMITTED = "assignment.submitted"
    ASSIGNMENT_STATUS_CHANGED = "assignment.status_changed"
    COMMENT_ADDED = "comment.added"
    COMMENT_STATUS_CHANGED = "comment.status_changed"


@dataclass
class SSEEvent:
    event_type: EventType
    data: dict
    target_user_id: uuid.UUID


class SSEConnectionManager:
    def __init__(self) -> None:
        # user_id -> list of queues (one per open tab/connection)
        self._connections: dict[uuid.UUID, list[asyncio.Queue]] = {}

    def connect(self, user_id: uuid.UUID) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._connections.setdefault(user_id, []).append(queue)
        return queue

    def disconnect(self, user_id: uuid.UUID, queue: asyncio.Queue) -> None:
        queues = self._connections.get(user_id)
        if queues is None:
            return
        try:
            queues.remove(queue)
        except ValueError:
            pass
        if not queues:
            del self._connections[user_id]

    async def push(self, event: SSEEvent) -> None:
        queues = self._connections.get(event.target_user_id, [])
        payload = json.dumps({"type": event.event_type, "data": event.data})
        for queue in queues:
            await queue.put(payload)

    async def event_generator(self, user_id: uuid.UUID, queue: asyncio.Queue):
        """Async generator that yields SSE-formatted strings."""
        try:
            while True:
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {payload}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive ping
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            self.disconnect(user_id, queue)


sse_manager = SSEConnectionManager()
