from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MentorProfileBase(BaseModel):
    bio: Optional[str] = None
    resume_url: Optional[str] = None
    skills: Optional[str] = None

class MentorProfileUpdate(MentorProfileBase):
    pass

class MentorProfileResponse(MentorProfileBase):
    user_id: int

    class Config:
        from_attributes = True

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
