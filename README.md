# LearnLoop — University Tutor Platform

LearnLoop is a full-stack peer-learning platform that helps university students find peer tutors, request learning sessions, and manage their bookings.

## Features

- Student and tutor registration and login
- Secure authentication using hashed passwords and JWT
- Search tutors by subject, branch, year, price, and rating
- Book tutoring sessions and view booking history
- Tutor dashboard to accept or manage session requests
- Save favourite tutors
- Add tutor availability
- Review tutors after completed sessions
- Separate dashboards for students and tutors
- Responsive design for desktop and mobile devices

## Tech Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** FastAPI and Python
- **Database:** PostgreSQL for deployment and SQLite for local testing
- **Authentication:** JWT and password hashing
- **Deployment:** Netlify for the frontend and Render for the backend

## Run Locally

### 1. Start the Backend

Create a virtual environment:

```bash
python -m venv backend/.venv
