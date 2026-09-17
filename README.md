# LearnLoop — University Tutor Platform

A full-stack peer-learning platform where university students can create accounts, discover peer tutors, request sessions, and manage bookings.

## Features

- Student and tutor signup/login with hashed passwords and JWT authentication
- Searchable tutor marketplace with subject filters, branch, year, pricing and ratings
- Student session requests and booking history
- Tutor request dashboard with confirmation controls
- Student favourites and dashboard statistics
- Tutor weekly availability management
- Verified reviews after completed sessions
- Protected booking APIs and role-based authorization
- Original responsive landing page plus separate student and tutor workspaces

## Technology

- Frontend: React 19, Vite, JavaScript, CSS
- Backend: FastAPI, Python, SQLAlchemy, JWT
- Database: MySQL in production; SQLite works automatically for local demos/tests
- Deployment: Netlify frontend plus any Python-compatible backend host

## Run locally

### Backend

```bash
python -m venv backend/.venv

# Windows PowerShell
backend\\.venv\\Scripts\\Activate.ps1

pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive API documentation is at `http://127.0.0.1:8000/docs`.

SQLite is used automatically for an easy local demo. To use MySQL, create the database and copy the example environment file:

```sql
CREATE DATABASE university_tutor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Copy `backend/.env.example` to `backend/.env`, add the real values, and load them before starting Uvicorn. Never commit the real `.env` file.

### Frontend

In a second terminal:

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`. Its default API is `http://127.0.0.1:8000`. For deployment, set this in Netlify and redeploy:

```text
VITE_API_URL=https://your-backend.example.com
```

## Test and verify

```bash
backend/.venv/bin/pytest backend/tests -q
npm run lint
npm run build
```

The automated API test covers tutor signup, student signup, JWT authentication, tutor retrieval, booking creation, and booking retrieval.

## API routes

| Method | Route | Purpose | Authentication |
|---|---|---|---|
| `GET` | `/health` | Service health | No |
| `POST` | `/auth/signup` | Create student/tutor account | No |
| `POST` | `/auth/login` | Log in and receive JWT | No |
| `GET` | `/tutors` | List/search tutors | No |
| `POST` | `/bookings` | Request a session | Student |
| `GET` | `/bookings/me` | View relevant bookings | Student/Tutor |
| `PATCH` | `/bookings/{id}` | Cancel or confirm a booking | Owner/Tutor |
| `GET/POST/DELETE` | `/favorites` | Manage saved tutors | Student |
| `POST` | `/reviews` | Review a completed session | Student |
| `GET/POST` | `/availability` | View or add tutor hours | Tutor |
| `GET` | `/dashboard` | Role-based session statistics | Student/Tutor |

## Live frontend

[University Tutor Platform](https://university-tutor-site.netlify.app/)
