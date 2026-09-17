import os
import sys
from pathlib import Path

TEST_DB = Path(__file__).parent / "test.db"
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
if TEST_DB.exists():
    TEST_DB.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["SECRET_KEY"] = "test-secret"

from fastapi.testclient import TestClient
from backend.main import app


client = TestClient(app)


def test_full_student_tutor_booking_flow():
    tutor = client.post("/auth/signup", json={
        "name": "Aman Tutor", "email": "aman@example.com", "password": "Secure123",
        "role": "tutor", "subject": "DBMS", "bio": "Database mentor",
    })
    assert tutor.status_code == 201

    student = client.post("/auth/signup", json={
        "name": "Riya Student", "email": "riya@example.com", "password": "Secure123",
        "role": "student",
    })
    assert student.status_code == 201
    token = student.json()["access_token"]

    tutors = client.get("/tutors")
    assert tutors.status_code == 200
    assert tutors.json()[0]["subject"] == "DBMS"
    assert "password_hash" not in tutors.json()[0]

    booking = client.post("/bookings", headers={"Authorization": f"Bearer {token}"}, json={
        "tutor_id": tutors.json()[0]["id"], "subject": "DBMS",
        "scheduled_at": "2026-09-20T17:00:00",
    })
    assert booking.status_code == 201

    mine = client.get("/bookings/me", headers={"Authorization": f"Bearer {token}"})
    assert mine.status_code == 200
    assert mine.json()[0]["tutor_name"] == "Aman Tutor"
