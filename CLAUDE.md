# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Markwork** — Plataforma de Revisión y Feedback Interactivo (Alumno-Profesor).
Students submit rich-text assignments; teachers review them inline with anchored comments. The system supports versioning, a visual diff, real-time notifications (SSE), and Google SSO.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.13, FastAPI (async), SQLAlchemy 2 (asyncio), Alembic, asyncpg |
| Database | PostgreSQL 17, JSONB for TipTap content |
| Auth | Google OAuth2 → internal JWT (python-jose) |
| Real-time | Server-Sent Events (FastAPI `StreamingResponse`) |
| Frontend | React 18, TypeScript, Vite, Zustand, TipTap, react-diff-viewer-continued |
| Pagination | fastapi-pagination |
| Config | pydantic-settings (`BaseSettings`) |
| Orchestration | Docker Compose (db + backend + frontend) |

---

## Architecture: Clean Architecture (strict)

### Golden Rule
**Never mix layers.** Database logic stays out of routers. HTTP logic stays out of use cases. UI components never call repositories directly — they go through hooks → use cases → repositories.

### Backend layers (`backend/src/`)

```
domain/          ← Pure Python: entities (Pydantic), repository ABCs, domain exceptions
application/     ← Use cases that orchestrate domain (no ORM, no HTTP)
infrastructure/  ← SQLAlchemy models, repository implementations, auth (JWT + Google), SSE manager
api/             ← FastAPI routers, dependencies (DI), middlewares
```

- **Entities** (`domain/entities/`) are Pydantic models with `from_attributes=True` — they are the return type of all repositories.
- **Repository interfaces** (`domain/repositories/`) are ABCs injected into use cases.
- **Concrete repositories** (`infrastructure/repositories/`) receive an `AsyncSession` in `__init__`, use `await session.execute(select(...))`, and call `session.flush()` before returning entities.
- **Use cases** (`application/use_cases/`) receive repository interfaces and contain all business/state-machine logic.
- **Routers** (`api/routers/`) only: validate input, call use cases, push SSE events, return responses.
- **`get_db()`** yields an `AsyncSession` with commit-on-exit and rollback-on-error.

### Frontend layers (`frontend/src/`)

```
domain/          ← TypeScript interfaces (User, Assignment, Comment, TipTapNode), AppError hierarchy
application/     ← Zustand stores, custom hooks, use cases (orchestration before mutating state)
infrastructure/  ← Axios client (with JWT interceptor + error normalizer), repositories, googleAuth, SSEClient
presentation/    ← React components (pages, layouts, features, components) — data-ignorant
```

- **Stores**: `authStore` (persisted), `assignmentStore` (in-memory)
- **Hooks** call repositories and sync to stores: `useAssignments`, `useComments`, `useAssignmentDiff`, `useSSENotifications`
- **Path aliases**: `@domain/`, `@application/`, `@infrastructure/`, `@presentation/` — always use these, never relative `../../`

---

## Assignment State Machine

```
DRAFT → PENDING_REVIEW → IN_REVIEW → APPROVED
                                   ↘ REQUIRES_CHANGES → PENDING_REVIEW (loop)
```

- Only student can edit in `DRAFT` or `REQUIRES_CHANGES`.
- Teacher opens assignment: `PENDING_REVIEW → IN_REVIEW`.
- Teacher finalizes: `IN_REVIEW → APPROVED | REQUIRES_CHANGES`.

---

## Database Schema (key points)

- All PKs are `UUID` (generated with `uuid.uuid4()`).
- `assignment_versions.content` is `JSONB` storing the TipTap document structure.
- `comments.tiptap_node_id` references the TipTap node where the comment is anchored.
- Alembic migrations live in `backend/alembic/versions/`. Always generate via `alembic revision --autogenerate`.

---

## API Routes (`/api/v1`)

| Method | Path | Actor |
|---|---|---|
| POST | `/auth/google` | Anyone |
| GET | `/users/me` | Authenticated |
| GET | `/users/teachers` | Authenticated |
| GET/POST | `/assignments` | Student/Teacher |
| GET/PUT | `/assignments/{id}` | Owner |
| POST | `/assignments/{id}/submit` | Student |
| POST | `/assignments/{id}/review/start` | Teacher |
| POST | `/assignments/{id}/review/finalize` | Teacher |
| GET | `/assignments/{id}/versions` | Owner |
| GET/POST | `/assignments/{id}/comments` | Owner |
| PATCH | `/comments/{id}` | Owner |
| GET | `/notifications/stream` | Authenticated (SSE) |

---

## Frontend Pages & Routes

| Route | Component | Role |
|---|---|---|
| `/login` | `LoginPage` | Public |
| `/` | `DashboardPage` | Student + Teacher (role-aware) |
| `/assignments/:id/edit` | `AssignmentEditorPage` | Student |
| `/assignments/:id/review` | `AssignmentReviewPage` | Teacher |
| `/assignments/:id/focused` | `FocusedDocumentPage` | Teacher (full-screen, outside MainLayout) |

---

## Design System (from Stitch)

- **Primary accent**: `#e05236` / `#e25336` (coral-red)
- **Background**: `#fdfcf8` (off-white crema)
- **Surface**: `#ffffff`
- **Border**: `#e4e4e7`
- **Text**: `#2d2d2b` / `#27272a`
- **Text muted**: `#a1a1aa`
- **Fonts**: `Newsreader` (serif headings), `Geist` / `Inter` (body)
- **All styles are inline React style objects** — no CSS files, no CSS modules.

---

## Running the Project

```bash
# Start all services
docker compose up --build

# First-time DB setup (run after containers are up)
docker compose exec backend alembic revision --autogenerate -m "initial_schema"
docker compose exec backend alembic upgrade head

# API docs
http://localhost:8000/api/v1/docs

# Frontend
http://localhost:5173
```

---

## Phase Tracking

| Phase | Status | Description |
|---|---|---|
| **Phase 1** | ✅ Done | Docker, DB models, repositories, domain interfaces |
| **Phase 2** | ✅ Done | Use cases, auth (JWT + Google), routers, SSE |
| **Phase 3** | ✅ Done | TipTap editor + read-only viewer, CommentHighlightExtension (ProseMirror decorations), DiffViewer, FocusedDocumentPage wired, SSE token via query param |
| **Phase 4** | ✅ Done | Alembic migration (1818d9d6f6b5_initial), unit tests (pytest-asyncio), CORS configurable via ALLOWED_ORIGINS, .env.example |

---

## Key Conventions

- All backend DB operations are `async/await` — never use synchronous SQLAlchemy.
- `session.flush()` after adds; session commit happens automatically in `get_db()` on request completion.
- SSE events are pushed via `await sse_manager.push(SSEEvent(...))` after state-changing operations in routers.
- Frontend errors are normalized by the Axios interceptor into typed `AppError` subclasses (`UnauthorizedError`, `ForbiddenError`, etc.).
- `fastapi-pagination`'s `add_pagination(app)` is called in `main.py`; list endpoints return `Page[T]` and call `paginate(items)`.
- The `SSEClient` in the frontend passes the JWT as a query param (`?token=...`) because `EventSource` doesn't support custom headers.
