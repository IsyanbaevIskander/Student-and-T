from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.db.models import RoomTypeEnum

class SeatBase(BaseModel):
    position_x: Optional[int] = None
    position_y: Optional[int] = None

class SeatCreate(SeatBase):
    pass

class SeatResponse(SeatBase):
    id: int
    room_id: int
    
    class Config:
        from_attributes = True

class RoomBase(BaseModel):
    type: RoomTypeEnum
    capacity: int
    map_schema: Optional[Dict[str, Any]] = None

class RoomCreate(RoomBase):
    seats: Optional[List[SeatCreate]] = None

class RoomResponse(RoomBase):
    id: int
    hub_id: int
    seats: List[SeatResponse] = []

    class Config:
        from_attributes = True

class HubBase(BaseModel):
    name: str
    location: str
    info: Optional[str] = None

class HubCreate(HubBase):
    pass

class HubUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    info: Optional[str] = None

class HubResponse(HubBase):
    id: int

    class Config:
        from_attributes = True
