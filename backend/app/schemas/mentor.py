from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.db.models import ApplicationStatusEnum

class MentorApplyRequest(BaseModel):
    hub_id: int

class MentorProfileResponse(BaseModel):
    user_id: int
    hub_id: int
    bio: Optional[str] = None
    resume_url: Optional[str] = None
    skills: Optional[str] = None
    status: ApplicationStatusEnum

    class Config:
        from_attributes = True

class MentorProfileUpdate(BaseModel):
    bio: Optional[str] = None
    resume_url: Optional[str] = None
    skills: Optional[str] = None

class MentorSlotBase(BaseModel):
    start_at: datetime
    end_at: datetime

class MentorSlotCreate(MentorSlotBase):
    pass

class MentorSlotResponse(MentorSlotBase):
    id: int
    mentor_id: int
    is_booked: bool

    class Config:
        from_attributes = True

class MentorSearchRequest(BaseModel):
    query: str

class MentorMeetingRequest(BaseModel):
    mentor_id: int
    slot_id: int
    message: str
