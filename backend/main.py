import os

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, schemas
from .auth import create_access_token, get_current_user, hash_password, verify_password
from .database import Base, engine, get_db


Base.metadata.create_all(bind=engine)
app = FastAPI(title="LearnLoop University Tutor API", version="1.0.0")

origins = [item.strip() for item in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,https://university-tutor-site.netlify.app",
).split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/signup", response_model=schemas.TokenResponse, status_code=201)
def signup(data: schemas.SignupRequest, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=409, detail="Email is already registered")
    if data.role == "tutor" and not data.subject:
        raise HTTPException(status_code=422, detail="Tutors must enter a subject")
    user = models.User(
        name=data.name.strip(), email=email, password_hash=hash_password(data.password),
        role=data.role, subject=data.subject, bio=data.bio, branch=data.branch,
        year=data.year, hourly_rate=data.hourly_rate,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.TokenResponse(
        access_token=create_access_token(user), user_id=user.id, name=user.name, role=user.role
    )


@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return schemas.TokenResponse(
        access_token=create_access_token(user), user_id=user.id, name=user.name, role=user.role
    )


@app.get("/tutors", response_model=list[schemas.TutorResponse])
def tutors(subject: str | None = None, search: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.User).filter(models.User.role == "tutor")
    if subject:
        query = query.filter(models.User.subject.ilike(f"%{subject}%"))
    if search:
        query = query.filter(
            models.User.name.ilike(f"%{search}%") | models.User.subject.ilike(f"%{search}%")
        )
    results = []
    for tutor in query.order_by(models.User.name).all():
        rating, count = db.query(func.avg(models.Review.rating), func.count(models.Review.id)).filter(
            models.Review.tutor_id == tutor.id
        ).one()
        results.append(schemas.TutorResponse(
            id=tutor.id, name=tutor.name, subject=tutor.subject, bio=tutor.bio,
            branch=tutor.branch, year=tutor.year, hourly_rate=tutor.hourly_rate,
            rating=round(float(rating or 0), 1), review_count=count,
        ))
    return results


def serialize_booking(booking: models.Booking):
    return schemas.BookingResponse(
        id=booking.id, student_id=booking.student_id, tutor_id=booking.tutor_id,
        tutor_name=booking.tutor.name, subject=booking.subject,
        scheduled_at=booking.scheduled_at, status=booking.status,
    )


@app.post("/bookings", response_model=schemas.BookingResponse, status_code=201)
def create_booking(
    data: schemas.BookingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can book sessions")
    tutor = db.get(models.User, data.tutor_id)
    if not tutor or tutor.role != "tutor":
        raise HTTPException(status_code=404, detail="Tutor not found")
    booking = models.Booking(
        student_id=current_user.id, tutor_id=tutor.id,
        subject=data.subject, scheduled_at=data.scheduled_at,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)


@app.get("/dashboard", response_model=schemas.DashboardResponse)
def dashboard(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Booking)
    query = query.filter(
        models.Booking.student_id == current_user.id if current_user.role == "student"
        else models.Booking.tutor_id == current_user.id
    )
    items = query.all()
    return schemas.DashboardResponse(
        total_bookings=len(items), upcoming=sum(i.status in {"pending", "confirmed"} for i in items),
        completed=sum(i.status == "completed" for i in items),
        favorites=db.query(models.Favorite).filter(models.Favorite.student_id == current_user.id).count()
        if current_user.role == "student" else 0,
    )


@app.get("/favorites", response_model=list[int])
def favorites(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [row.tutor_id for row in db.query(models.Favorite).filter(
        models.Favorite.student_id == current_user.id
    ).all()]


@app.post("/favorites/{tutor_id}", status_code=201)
def add_favorite(tutor_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can save tutors")
    if not db.query(models.Favorite).filter_by(student_id=current_user.id, tutor_id=tutor_id).first():
        db.add(models.Favorite(student_id=current_user.id, tutor_id=tutor_id)); db.commit()
    return {"message": "Tutor saved"}


@app.delete("/favorites/{tutor_id}", status_code=204)
def remove_favorite(tutor_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(models.Favorite).filter_by(student_id=current_user.id, tutor_id=tutor_id).first()
    if row:
        db.delete(row); db.commit()


@app.post("/reviews", response_model=schemas.ReviewResponse, status_code=201)
def create_review(data: schemas.ReviewCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    completed = db.query(models.Booking).filter_by(
        student_id=current_user.id, tutor_id=data.tutor_id, status="completed"
    ).first()
    if not completed:
        raise HTTPException(status_code=403, detail="Complete a session before reviewing this tutor")
    review = db.query(models.Review).filter_by(student_id=current_user.id, tutor_id=data.tutor_id).first()
    if review:
        review.rating, review.comment = data.rating, data.comment
    else:
        review = models.Review(student_id=current_user.id, tutor_id=data.tutor_id, rating=data.rating, comment=data.comment)
        db.add(review)
    db.commit(); db.refresh(review)
    return schemas.ReviewResponse(id=review.id, student_name=current_user.name, rating=review.rating, comment=review.comment, created_at=review.created_at)


@app.get("/tutors/{tutor_id}/reviews", response_model=list[schemas.ReviewResponse])
def tutor_reviews(tutor_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.Review).filter_by(tutor_id=tutor_id).order_by(models.Review.created_at.desc()).all()
    return [schemas.ReviewResponse(id=r.id, student_name=r.student.name, rating=r.rating, comment=r.comment, created_at=r.created_at) for r in rows]


@app.get("/availability/{tutor_id}", response_model=list[schemas.AvailabilityResponse])
def get_availability(tutor_id: int, db: Session = Depends(get_db)):
    return db.query(models.Availability).filter_by(tutor_id=tutor_id).all()


@app.post("/availability", response_model=schemas.AvailabilityResponse, status_code=201)
def add_availability(data: schemas.AvailabilityCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Only tutors can add availability")
    slot = models.Availability(tutor_id=current_user.id, **data.model_dump())
    db.add(slot); db.commit(); db.refresh(slot)
    return slot


@app.get("/bookings/me", response_model=list[schemas.BookingResponse])
def my_bookings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Booking)
    if current_user.role == "student":
        query = query.filter(models.Booking.student_id == current_user.id)
    else:
        query = query.filter(models.Booking.tutor_id == current_user.id)
    return [serialize_booking(item) for item in query.order_by(models.Booking.scheduled_at.desc()).all()]


@app.patch("/bookings/{booking_id}", response_model=schemas.BookingResponse)
def update_booking(
    booking_id: int,
    data: schemas.BookingStatusUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(models.Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    owns_booking = current_user.id in {booking.student_id, booking.tutor_id}
    if not owns_booking:
        raise HTTPException(status_code=403, detail="You cannot update this booking")
    if current_user.role == "student" and data.status != "cancelled":
        raise HTTPException(status_code=403, detail="Students can only cancel bookings")
    booking.status = data.status
    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)
