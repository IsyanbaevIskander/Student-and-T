from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.db.models import EventStatusEnum

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    max_attendees: int = 10
    is_public: bool = True

class EventCreate(EventBase):
    hub_id: int

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    max_attendees: Optional[int] = None
    is_public: Optional[bool] = None

class EventStatusUpdate(BaseModel):
    status: EventStatusEnum

class EventRead(EventBase):
    id: int
    creator_id: int
    hub_id: int
    status: EventStatusEnum
    invite_code: str
    attendees_count: int = 0
    qr_code: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
