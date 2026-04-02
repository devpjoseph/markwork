"""Tests for SSEConnectionManager."""

import json
import uuid

import pytest

from src.api.sse.manager import EventType, SSEConnectionManager, SSEEvent


@pytest.mark.asyncio
async def test_connect_and_disconnect():
    manager = SSEConnectionManager()
    user_id = uuid.uuid4()

    queue = manager.connect(user_id)
    assert user_id in manager._connections
    assert queue in manager._connections[user_id]

    manager.disconnect(user_id, queue)
    assert user_id not in manager._connections


@pytest.mark.asyncio
async def test_push_event():
    manager = SSEConnectionManager()
    user_id = uuid.uuid4()
    queue = manager.connect(user_id)

    event = SSEEvent(
        event_type=EventType.COMMENT_ADDED,
        data={"comment_id": "test_id"},
        target_user_id=user_id,
    )

    await manager.push(event)

    payload = await queue.get()
    parsed = json.loads(payload)

    assert parsed["type"] == EventType.COMMENT_ADDED.value
    assert parsed["data"] == {"comment_id": "test_id"}


@pytest.mark.asyncio
async def test_event_generator():
    manager = SSEConnectionManager()
    user_id = uuid.uuid4()
    queue = manager.connect(user_id)

    event = SSEEvent(
        event_type=EventType.COMMENT_ADDED,
        data={"comment_id": "test_id"},
        target_user_id=user_id,
    )
    await manager.push(event)

    generator = manager.event_generator(user_id, queue)
    first_yield = await anext(generator)

    expected_payload = json.dumps(
        {"type": EventType.COMMENT_ADDED.value, "data": {"comment_id": "test_id"}}
    )
    assert first_yield == f"data: {expected_payload}\n\n"


@pytest.mark.asyncio
async def test_push_ignores_unconnected_users():
    manager = SSEConnectionManager()
    user_id = uuid.uuid4()

    event = SSEEvent(
        event_type=EventType.COMMENT_ADDED,
        data={"comment_id": "test_id"},
        target_user_id=user_id,
    )

    # Should not raise any errors
    await manager.push(event)
