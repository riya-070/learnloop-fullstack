from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    role: str
    subject: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=500)
    branch: str | None = Field(default=None, max_length=100)
    year: str | None = Field(default=None, max_length=30)
    hourly_rate: int | None = Field(default=None, ge=0, le=5000)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str):
        value = value.lower()
        if value not in {"student", "tutor"}:
            raise ValueError("Role must be student or tutor")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    role: str


class TutorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    subject: str | None
    bio: str | None
    branch: str | None
    year: str | None
    hourly_rate: int | None
    rating: float = 0
    review_count: int = 0
    is_favorite: bool = False


class BookingCreate(BaseModel):
    tutor_id: int
    subject: str = Field(min_length=2, max_length=100)
    scheduled_at: datetime


class BookingResponse(BaseModel):
    id: int
    student_id: int
    tutor_id: int
    tutor_name: str
    subject: str
    scheduled_at: datetime
    status: str


class BookingStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str):
        value = value.lower()
        if value not in {"pending", "confirmed", "cancelled", "completed"}:
            raise ValueError("Invalid booking status")
        return value


class ReviewCreate(BaseModel):
    tutor_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=800)


class ReviewResponse(BaseModel):
    id: int
    student_name: str
    rating: int
    comment: str
    created_at: datetime


class AvailabilityCreate(BaseModel):
    day: str = Field(min_length=3, max_length=20)
    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    end_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")


class AvailabilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    day: str
    start_time: str
    end_time: str


class DashboardResponse(BaseModel):
    total_bookings: int
    upcoming: int
    completed: int
    favorites: int
