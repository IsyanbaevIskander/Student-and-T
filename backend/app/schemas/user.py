from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.models import RoleEnum

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    tg_username: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: RoleEnum
    tg_username: Optional[str] = None

    class Config:
        from_attributes = True
