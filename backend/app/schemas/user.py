from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.models import RoleEnum

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    tg_username: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    phone_number: Optional[str] = None
    tg_username: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: RoleEnum
    tg_username: Optional[str] = None
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    middle_name: Optional[str] = ""
    phone_number: Optional[str] = ""

    class Config:
        from_attributes = True
