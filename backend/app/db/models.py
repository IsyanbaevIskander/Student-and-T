import enum
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, DateTime, Boolean, Enum, JSON
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.db.base import Base

class RoleEnum(str, enum.Enum):
    STUDENT = "STUDENT"
    MENTOR = "MENTOR"
    ADMIN = "ADMIN"

class RoomTypeEnum(str, enum.Enum):
    GROUP = "GROUP"
    SOLO = "SOLO"

class BookingStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), default=RoleEnum.STUDENT)
    tg_username: Mapped[str | None] = mapped_column(String, nullable=True)

class MentorProfile(Base):
    __tablename__ = "mentor_profiles"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    bio: Mapped[str | None] = mapped_column(String, nullable=True)
    resume_url: Mapped[str | None] = mapped_column(String, nullable=True)
    skills: Mapped[str | None] = mapped_column(String, nullable=True)  # Comma separated or JSON array

class Hub(Base):
    __tablename__ = "hubs"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String)
    location: Mapped[str] = mapped_column(String)
    info: Mapped[str | None] = mapped_column(String, nullable=True)

class Room(Base):
    __tablename__ = "rooms"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    hub_id: Mapped[int] = mapped_column(ForeignKey("hubs.id"))
    type: Mapped[RoomTypeEnum] = mapped_column(Enum(RoomTypeEnum))
    capacity: Mapped[int] = mapped_column(Integer)
    map_schema: Mapped[dict | None] = mapped_column(JSON, nullable=True)

class Seat(Base):
    __tablename__ = "seats"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"))
    position_x: Mapped[int | None] = mapped_column(Integer, nullable=True)
    position_y: Mapped[int | None] = mapped_column(Integer, nullable=True)

class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    seat_id: Mapped[int | None] = mapped_column(ForeignKey("seats.id"), nullable=True)
    room_id: Mapped[int | None] = mapped_column(ForeignKey("rooms.id"), nullable=True)
    start_at: Mapped[datetime] = mapped_column(DateTime)
    end_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[BookingStatusEnum] = mapped_column(Enum(BookingStatusEnum), default=BookingStatusEnum.PENDING)
    is_checked_in: Mapped[bool] = mapped_column(Boolean, default=False)

class MentorSlot(Base):
    __tablename__ = "mentor_slots"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    mentor_id: Mapped[int] = mapped_column(ForeignKey("mentor_profiles.user_id"))
    start_at: Mapped[datetime] = mapped_column(DateTime)
    end_at: Mapped[datetime] = mapped_column(DateTime)
    is_booked: Mapped[bool] = mapped_column(Boolean, default=False)
