from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db.models import BookingStatusEnum

class BookingCreate(BaseModel):
    seat_ids: Optional[List[int]] = None
    room_id: Optional[int] = None
    start_at: datetime
    end_at: datetime

class BookingResponse(BaseModel):
    id: int
    user_id: int
    seat_id: Optional[int] = None
    room_id: Optional[int] = None
    start_at: datetime
    end_at: datetime
    status: BookingStatusEnum
    is_checked_in: bool

    class Config:
        from_attributes = True

class BookingStatusUpdate(BaseModel):
    status: BookingStatusEnum
