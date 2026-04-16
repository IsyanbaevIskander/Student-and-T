from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.models import RoleEnum

class UserBase(BaseModel):
    email: EmailStr
    role: RoleEnum = RoleEnum.STUDENT
    tg_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True
