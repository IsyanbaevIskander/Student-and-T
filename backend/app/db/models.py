import enum
from typing import List
from datetime import datetime
from typing import Optional
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

class ApplicationStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class BookingStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class BookingTypeEnum(str, enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    EVENT = "EVENT"

class MentorRequestStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), default=RoleEnum.STUDENT)
    tg_username: Mapped[str | None] = mapped_column(String, nullable=True)
    first_name: Mapped[str | None] = mapped_column(String, nullable=True, default="")
    last_name: Mapped[str | None] = mapped_column(String, nullable=True, default="")
    middle_name: Mapped[str | None] = mapped_column(String, nullable=True, default="")
    phone_number: Mapped[str | None] = mapped_column(String, nullable=True, default="")
    
    bookings: Mapped[List["Booking"]] = relationship(back_populates="user")

class Hub(Base):
    __tablename__ = "hubs"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String)
    location: Mapped[str] = mapped_column(String)
    info: Mapped[str | None] = mapped_column(String, nullable=True)
    
    hub_bookings: Mapped[List["Booking"]] = relationship(back_populates="hub")
    events: Mapped[List["Event"]] = relationship(back_populates="hub")

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

class EventStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Event(Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    hub_id: Mapped[int] = mapped_column(ForeignKey("hubs.id"))
    max_attendees: Mapped[int] = mapped_column(Integer, default=10)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[EventStatusEnum] = mapped_column(Enum(EventStatusEnum), default=EventStatusEnum.PENDING)
    invite_code: Mapped[str] = mapped_column(String, unique=True, index=True)
    
    creator: Mapped["User"] = relationship()
    hub: Mapped["Hub"] = relationship(back_populates="events")
    participants: Mapped[List["Booking"]] = relationship(back_populates="event")

class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    seat_id: Mapped[int | None] = mapped_column(ForeignKey("seats.id"), nullable=True)
    room_id: Mapped[int | None] = mapped_column(ForeignKey("rooms.id"), nullable=True)
    hub_id: Mapped[int | None] = mapped_column(ForeignKey("hubs.id"), nullable=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[BookingStatusEnum] = mapped_column(Enum(BookingStatusEnum), default=BookingStatusEnum.PENDING)
    is_checked_in: Mapped[bool] = mapped_column(Boolean, default=False)
    booking_type: Mapped[BookingTypeEnum] = mapped_column(Enum(BookingTypeEnum), default=BookingTypeEnum.INDIVIDUAL)
    qr_code: Mapped[str | None] = mapped_column(String, nullable=True)
    event_id: Mapped[int | None] = mapped_column(ForeignKey("events.id"), nullable=True)

    user: Mapped["User"] = relationship(back_populates="bookings")
    hub: Mapped["Hub"] = relationship(back_populates="hub_bookings")
    event: Mapped[Optional["Event"]] = relationship(back_populates="participants")
    mentor_requests: Mapped[List["BroadcastMentorRequest"]] = relationship("BroadcastMentorRequest", back_populates="booking")

class MentorRequest(Base):
    """Запрос на встречу от студента к ментору"""
    __tablename__ = "mentor_requests"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    mentor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    slot_id: Mapped[int] = mapped_column(ForeignKey("mentor_slots.id"))
    message: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[MentorRequestStatusEnum] = mapped_column(
        Enum(MentorRequestStatusEnum), default=MentorRequestStatusEnum.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Связи
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id])
    mentor: Mapped["User"] = relationship("User", foreign_keys=[mentor_id])
    slot: Mapped["MentorSlot"] = relationship("MentorSlot")

# Добавим теги для ментора
class MentorTag(Base):
    __tablename__ = "mentor_tags"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    mentor_id: Mapped[int] = mapped_column(ForeignKey("mentor_profiles.user_id"))
    tag_name: Mapped[str] = mapped_column(String, index=True)  # например: "FastAPI", "Docker", "React"

# Дополним MentorProfile
class MentorProfile(Base):
    __tablename__ = "mentor_profiles"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    hub_id: Mapped[int] = mapped_column(ForeignKey("hubs.id"))
    bio: Mapped[str | None] = mapped_column(String, nullable=True)  # О себе
    resume_url: Mapped[str | None] = mapped_column(String, nullable=True)  # Путь к PDF
    skills: Mapped[str | None] = mapped_column(String, nullable=True)  # Оставим для совместимости
    status: Mapped[ApplicationStatusEnum] = mapped_column(
        Enum(ApplicationStatusEnum), default=ApplicationStatusEnum.PENDING
    )
    
    # Связи
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    tags: Mapped[list["MentorTag"]] = relationship("MentorTag", cascade="all, delete-orphan")
    slots: Mapped[list["MentorSlot"]] = relationship("MentorSlot", back_populates="mentor")

# Дополним MentorSlot
class MentorSlot(Base):
    __tablename__ = "mentor_slots"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    mentor_id: Mapped[int] = mapped_column(ForeignKey("mentor_profiles.user_id"))
    start_at: Mapped[datetime] = mapped_column(DateTime)
    end_at: Mapped[datetime] = mapped_column(DateTime)
    is_booked: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Связь
    mentor: Mapped["MentorProfile"] = relationship("MentorProfile", back_populates="slots")

class BroadcastMentorRequest(Base):
    """Запрос на ментора по стеку для бронирования (мероприятия)"""
    __tablename__ = "broadcast_mentor_requests"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"))
    stack: Mapped[str] = mapped_column(String)  # Например, "Python"
    status: Mapped[MentorRequestStatusEnum] = mapped_column(
        Enum(MentorRequestStatusEnum), default=MentorRequestStatusEnum.PENDING
    )
    mentor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    student: Mapped["User"] = relationship("User", foreign_keys=[student_id])
    booking: Mapped["Booking"] = relationship("Booking", back_populates="mentor_requests")
    mentor: Mapped["User"] = relationship("User", foreign_keys=[mentor_id])