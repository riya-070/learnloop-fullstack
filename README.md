# LearnLoop — University Tutor Platform

LearnLoop is a full-stack peer-learning platform that helps university students connect with peer tutors. Students can search for tutors, request sessions, save favourites, and manage their bookings. Tutors can manage their availability and respond to session requests.

## Live Website

[View LearnLoop](https://learnloop2.netlify.app/)

> The backend uses a free Render instance. The first request may take around 50 seconds if the server has been inactive.

## Features

- Student and tutor account registration
- Secure login using JWT authentication
- Password hashing for account security
- Separate student and tutor dashboards
- Search tutors by subject, branch, year, price, and rating
- Request and manage tutoring sessions
- Confirm or cancel booking requests
- Save and remove favourite tutors
- Manage tutor availability
- Review tutors after completed sessions
- View role-based dashboard statistics
- Responsive design for desktop and mobile devices

## Technologies Used

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Python
- FastAPI
- SQL
- REST APIs
- JWT authentication
- Password hashing

### Database and Deployment

- PostgreSQL
- Neon
- Render
- Netlify


## Project Structure

```text
learnloop-fullstack/
├── backend/
│   ├── tests/
│   ├── __init__.py
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── .env.example
├── public/
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── api.js
│   ├── index.css
│   └── main.jsx
├── .env.example
├── .env.production
├── .gitignore
├── index.html
├── package.json
├── render.yaml
├── vite.config.js
└── README.md
