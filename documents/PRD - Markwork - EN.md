# **Product Requirements Document (PRD)**

**Project:** Interactive Review and Feedback Platform (Student-Teacher)

**Version:** 1.0

**Date:** March 30, 2026

## **1. Vision and Goals**

**Vision:** To provide a fluid, centralized, and real-time platform where teachers and students can interact over rich text documents. The system aims to emulate and improve the review experience through precise inline comments, visual version history, and an agile feedback cycle.  
**Success Metrics:**

* Reduction in the average time it takes a teacher to review, comment on, and approve an assignment.  
* Decrease in the number of iterations (versions) required until final approval.  
* High adoption rate of the inline comment system (vs. general or external comments).

## **2. Users and Use Cases**

The system supports data isolation (Logical Multi-tenancy): students only see their data; teachers see assignments assigned to them.

* **Student:**  
  * Creates, edits, and publishes assignments using a rich text editor (Markdown/TipTap).  
  * Selects the teacher who will review their assignment.  
  * Visualizes the *diff* (comparison) of their versions.  
  * Visualizes the teacher's exact feedback anchored to text fragments (inline comments).  
  * Applies corrections and resubmits the document, creating new versions.  
* **Teacher:**  
  * Visualizes a dashboard with assignments that have been assigned to them.  
  * Reads the document and adds inline comments on specific words or paragraphs.  
  * Compares versions using a *diff* view to audit if the student applied the requested changes.  
  * Approves/resolves individual comments and changes the overall assignment status (Approve or Request Changes).  
* **Administrator (Admin):**  
  * Manages access control: activates or deactivates student and teacher accounts.

## **3. Scope and Business Logic**

### **3.1. Core Functional Requirements**

1. **Assignment and Version Management:** Document creation, saving as draft, and publication. Each post-review edit generates a new immutable version.  
2. **Inline Comment Engine:** Ability to select text and anchor a comment. Comments have a lifecycle: *Open, Resolved, Rejected*.  
3. **Visual Comparator (Diff):** Tool to compare the "before" and "after" text between two consecutive versions.  
4. **Real-Time Notifications:** Push alerts (via SSE) to notify the counterpart about publications, new comments, or status changes.  
5. **Single Sign-On (SSO):** Exclusive login via Google Sign-In.

### **3.2. Assignment State Machine**

1. DRAFT: Student editing, invisible to the teacher.  
2. PENDING\_REVIEW: Published by the student and assigned to the teacher.  
3. IN\_REVIEW: Teacher reading/commenting (temporarily blocks student editing).  
4. REQUIRES\_CHANGES: Returned to the student with comments.  
5. APPROVED: Review successfully finalized.

## **4. Architecture and Technology Stack**

The project is fully deployed using **Docker Compose** to ensure consistency between development and production environments. **Clean Architecture** will be applied at both ends.

### **Frontend (Client)**

* **Framework:** React with TypeScript.  
* **Global State Manager:** **Zustand** (for session management, state of the current document, and comments).  
* **Text Editor:** **TipTap** (including the development of a custom extension to link comments to specific nodes).  
* **Change Visualizer:** react-diff-viewer-continue.

### **Backend (API)**

* **Framework:** Python with FastAPI.  
* **Authentication:** Google OAuth2 (google-auth) generating internal JWTs.  
* **Real-Time:** Native Server-Sent Events (SSE) in FastAPI (StreamingResponse).

### **Database**

* **Engine:** PostgreSQL.  
* **ORM and Migrations:** SQLAlchemy \+ Alembic.  
* **Core Storage:** TipTap editor content is stored in a structured manner using PostgreSQL's **JSONB** data type, optimizing rendering and searches.

## **5. Database Design (Relational Schema)**

* **users**: id (UUID), email (Unique), full\_name, role (STUDENT, TEACHER, ADMIN), is\_active (Bool).  
* **assignments**: id (UUID), student\_id (FK), teacher\_id (FK), title, status (Enum), created\_at, updated\_at.  
* **assignment\_versions**: id (UUID), assignment\_id (FK), version\_number (Int), content (**JSONB** \- TipTap structure), created\_at.  
* **comments**: id (UUID), assignment\_id (FK), author\_id (FK), tiptap\_node\_id (Varchar \- node ID in the JSON), selected\_text (Text), content (Text \- feedback), status (OPEN, RESOLVED).

## **6. API Contracts (Main Endpoints)**

* **Auth:** \* POST /api/v1/auth/google (Validates Google token, returns internal JWT).  
* **Assignments:**  
  * POST /api/v1/assignments (Creates draft assignment and first version).  
  * GET /api/v1/assignments (Lists assignments, filtered by tenant/role).  
  * GET /api/v1/assignments/{id} (Retrieves assignment and current version).  
  * PUT /api/v1/assignments/{id} (Updates text, generates new version).  
  * GET /api/v1/assignments/{id}/versions (Lists version history for the Diff).  
* **Comments:**  
  * GET /api/v1/assignments/{id}/comments (Retrieves comments with their tiptap\_node\_id).  
  * POST /api/v1/assignments/{id}/comments (Creates inline comment).  
  * PATCH /api/v1/comments/{id} (Resolves/Approves comment).  
* **Real-time:**  
  * GET /api/v1/notifications/stream (SSE connection for push events).

## **7. Project Structure (Clean Architecture & Docker)**

The project operates under a central docker-compose.yml orchestrator that raises the Database, the Backend (Hot-reload), and the Frontend (Vite).

### **Backend (Python/FastAPI)**

backend/  
├── src/  
│   ├── domain/                  \# Layer 1: Entities and pure business rules  
│   │   ├── entities/            \# Pure models (e.g., Pydantic or Dataclasses for User, Assignment)  
│   │   ├── exceptions/          \# Domain custom exceptions (e.g., AssignmentNotDraftError)  
│   │   └── repositories/        \# Repository interfaces (Abstract Classes)  
│   │  
│   ├── application/             \# Layer 2: Use cases (Logic orchestrating the domain)  
│   │   ├── use\_cases/           \# E.g., submit\_assignment.py, add\_inline\_comment.py  
│   │   └── services/            \# Shared logic between use cases  
│   │  
│   ├── infrastructure/          \# Layer 3: Technical implementations (DB, external tools)  
│   │   ├── database/            \# SQLAlchemy configuration, sessions  
│   │   ├── models/              \# SQLAlchemy ORM models (mapping to tables)  
│   │   ├── repositories/        \# Real implementation of domain interfaces (Postgres)  
│   │   ├── auth/                \# Google OAuth2 logic  
│   │   └── telemetry/           \# APM, OpenTelemetry, and structured logs configuration  
│   │  
│   ├── api/                     \# Layer 4: Web framework (FastAPI)  
│   │   ├── routers/             \# Grouped endpoints (auth.py, assignments.py, comments.py)  
│   │   ├── dependencies/        \# Dependency injection (e.g., get\_db, get\_current\_user)  
│   │   ├── middlewares/         \# FastAPI middlewares (CORS, request tracking)  
│   │   └── sse/                 \# Connection manager for Server-Sent Events  
│   │  
│   ├── main.py                  \# FastAPI entry point (assembles the layers)  
│   └── config.py                \# Environment variables and general configuration (Pydantic BaseSettings)  
├── alembic/                     \# Database migrations  
├── tests/                       \# Layer-by-layer unit and integration tests  
└── requirements.txt / pyproject.toml

### **Frontend (React/Zustand)**

frontend/  
├── src/  
│   ├── domain/                  \# Entities and types  
│   │   ├── models/              \# TypeScript interfaces (User, Assignment, Comment, TipTapNode)  
│   │   └── errors/              \# Standard client error handling  
│   │  
│   ├── application/             \# Application logic and state  
│   │   ├── store/               \# Zustand global state  
│   │   ├── hooks/               \# Custom logic hooks (e.g., useAssignmentDiff, useComments)  
│   │   └── use\_cases/           \# Orchestration of complex logic before state mutation  
│   │  
│   ├── infrastructure/          \# Communication with the outside world  
│   │   ├── api/                 \# Centralized HTTP client (Axios/Fetch) and interceptors  
│   │   ├── repositories/        \# Functions calling endpoints (e.g., assignmentRepository.ts)  
│   │   ├── auth/                \# Google Sign-In SDK integration  
│   │   └── sse/                 \# Client to listen for notification events  
│   │  
│   ├── presentation/            \# UI (Completely ignorant of data source)  
│   │   ├── components/          \# Reusable components (Buttons, Modals, Badges)  
│   │   ├── features/            \# Business-specific components (TipTapEditor, DiffViewer)  
│   │   ├── pages/               \# Routable views (Dashboard, AssignmentReview)  
│   │   └── layouts/             \# Page structures (Sidebar, Navbar)  
│   │  
│   ├── App.tsx                  \# Main router and context providers  
│   └── main.tsx                 \# React entry point  
├── public/  
├── package.json  
└── tsconfig.json
