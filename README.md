# Markwork

Interactive and Collaborative Feedback Platform for Students and Teachers.

## Overview

**Markwork** is a centralized, real-time platform designed to streamline the academic review process. It enables students and teachers to interact directly within rich text documents, providing an experience that goes beyond traditional file sharing and static comments.

Built with **Clean Architecture** principles and containerized with **Docker**, Markwork ensures a robust, scalable, and consistent development environment.

## Key Features

- **Rich Text Editing:** Full Markdown-supported editor powered by TipTap.
- **Precise Inline Comments:** Anchor feedback to specific words or paragraphs.
- **Comment Lifecycle:** Track feedback from "Open" to "Resolved" or "Rejected".
- **Visual Version Comparison (Diff):** Instantly compare changes between document versions.
- **Real-Time Synergy:** Notification system using Server-Sent Events (SSE) for immediate updates on publication and feedback.
- **Secure Authentication:** Seamless Single Sign-On (SSO) with Google.

## Technology Stack

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **Real-Time:** Native SSE (Server-Sent Events)

### Frontend
- **Framework:** [React](https://react.dev/) with TypeScript
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Text Editor:** TipTap
- **Diff Viewer:** react-diff-viewer-continue
- **Build Tool:** Vite

## Project Structure

The project follows the **Clean Architecture** pattern to separate concerns and maintain testability.

### Backend Structure
- `src/domain`: Core business entities and rules.
- `src/application`: Use cases and orchestration logic.
- `src/infrastructure`: Technical implementations (DB, Auth, Telemetry).
- `src/api`: Framework and presentation layer (FastAPI routers, SSE).

### Frontend Structure
- `src/domain`: Core types and business rules.
- `src/application`: Global state (Zustand stores) and coordination logic.
- `src/infrastructure`: API clients and repository implementations.
- `src/presentation`: UI components, pages, and layouts.

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Google OAuth Credentials (for Google Sign-In)

### Setup and Running

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/markwork.git
   cd markwork
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the `backend/` directory based on provided documentation:
   ```env
   # Example backend/.env
   DATABASE_URL=postgresql://markwork:markwork_secret@db:5432/markwork_db
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   JWT_SECRET=your-random-secret
   ```

3. **Start the Application:**
   ```bash
   docker-compose up --build
   ```

   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:8000
   - **API Docs (Swagger):** http://localhost:8000/docs

## Documentation

For detailed product specifications and technical design, refer to the `documents/` folder.
- [English Product Requirements (PRD)](documents/PRD%20-%20Markwork%20-%20EN.md)

## License

This project is licensed under the GNU General Public License v3 - see the [LICENSE](LICENSE) file for details.
