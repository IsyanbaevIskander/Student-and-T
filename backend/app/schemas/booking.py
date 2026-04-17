from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db.models import BookingStatusEnum, BookingTypeEnum

class BookingCreate(BaseModel):
    hub_id: Optional[int] = None
    seat_ids: Optional[List[int]] = None
    room_id: Optional[int] = None
    start_at: datetime
    end_at: datetime
    booking_type: BookingTypeEnum = BookingTypeEnum.INDIVIDUAL
    # Поля для массовых мероприятий
    event_description: Optional[str] = None
    event_attendees: Optional[int] = None

class UserInBooking(BaseModel):
    id: int
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    middle_name: Optional[str] = ""
    phone_number: Optional[str] = ""
    email: str

class HubInBooking(BaseModel):
    id: int
    name: str

from app.schemas.event import EventRead

class BookingResponse(BaseModel):
    id: int
    user_id: int
    seat_id: Optional[int] = None
    room_id: Optional[int] = None
    hub_id: Optional[int] = None
    start_at: datetime
    end_at: datetime
    status: BookingStatusEnum
    is_checked_in: bool
    booking_type: BookingTypeEnum
    qr_code: Optional[str] = None
    event_description: Optional[str] = None
    event_attendees: Optional[int] = None
    event: Optional[EventRead] = None
    user: Optional[UserInBooking] = None
    hub: Optional[HubInBooking] = None
    mentor: Optional[UserInBooking] = None

    class Config:
        from_attributes = True

class BookingStatusUpdate(BaseModel):
    status: BookingStatusEnum
