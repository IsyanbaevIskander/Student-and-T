from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.db.models import ApplicationStatusEnum, MentorRequestStatusEnum

# ---- Заявка на менторство ----
class MentorApplyRequest(BaseModel):
    hub_id: int

# ---- Теги ----
class MentorTagCreate(BaseModel):
    tag_name: str

class MentorTagResponse(BaseModel):
    id: int
    tag_name: str
    
    class Config:
        from_attributes = True

# ---- Профиль ментора с тегами ----
class MentorProfileResponse(BaseModel):
    user_id: int
    hub_id: int
    bio: Optional[str] = None
    resume_url: Optional[str] = None
    skills: Optional[str] = None
    status: ApplicationStatusEnum
    tags: List[MentorTagResponse] = []

    class Config:
        from_attributes = True

class MentorProfileUpdate(BaseModel):
    bio: Optional[str] = None
    resume_url: Optional[str] = None
    skills: Optional[str] = None
    tags: Optional[List[str]] = None

# ---- Слоты ----
class MentorSlotCreate(BaseModel):
    start_at: datetime
    end_at: datetime

class MentorSlotResponse(BaseModel):
    id: int
    mentor_id: int
    start_at: datetime
    end_at: datetime
    is_booked: bool
    mentor_name: Optional[str] = None

    class Config:
        from_attributes = True

# ---- Поиск менторов (RAG) ----
class MentorSearchRequest(BaseModel):
    query: str

# ---- Запрос на встречу ----
class MentorMeetingRequest(BaseModel):
    mentor_id: int
    slot_id: int
    message: Optional[str] = None

class MentorRequestResponse(BaseModel):
    id: int
    student_id: int
    mentor_id: int
    slot_id: int
    message: Optional[str] = None
    status: MentorRequestStatusEnum
    created_at: datetime
    
    # Денормализованные данные для отображения
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    slot_start: Optional[datetime] = None
    slot_end: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class MentorRequestUpdate(BaseModel):
    status: MentorRequestStatusEnum