# app/schemas/hub_admin.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class HubAdminBase(BaseModel):
    user_id: int
    hub_id: int


class HubAdminCreate(HubAdminBase):
    pass


class HubAdminResponse(HubAdminBase):
    created_at: datetime
    
    class Config:
        from_attributes = True


class HubAdminWithDetailsResponse(HubAdminResponse):
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    hub_name: Optional[str] = None
    hub_location: Optional[str] = None


class AssignHubAdminRequest(BaseModel):
    user_id: int
    hub_id: int


class RemoveHubAdminRequest(BaseModel):
    user_id: int
    hub_id: int