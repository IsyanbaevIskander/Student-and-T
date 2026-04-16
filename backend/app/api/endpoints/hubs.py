from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud import crud_hub
from app.schemas.hub import HubCreate, HubResponse, RoomCreate, RoomResponse

router = APIRouter()

@router.get("/", response_model=List[HubResponse])
async def read_hubs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    hubs = await crud_hub.get_hubs(db, skip=skip, limit=limit)
    return hubs

@router.post("/", response_model=HubResponse)
async def create_hub(
    *,
    db: AsyncSession = Depends(deps.get_db),
    hub_in: HubCreate,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    # In real app, verify if current_user is ADMIN
    hub = await crud_hub.create_hub(db, obj_in=hub_in)
    return hub

@router.get("/{hub_id}/rooms", response_model=List[RoomResponse])
async def read_hub_rooms(
    hub_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    rooms = await crud_hub.get_rooms_by_hub(db, hub_id=hub_id)
    # Load seats for each room
    for room in rooms:
        room.seats = await crud_hub.get_room_seats(db, room_id=room.id)
    return rooms

@router.post("/{hub_id}/rooms", response_model=RoomResponse)
async def create_room(
    *,
    hub_id: int,
    db: AsyncSession = Depends(deps.get_db),
    room_in: RoomCreate,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    # Verify if ADMIN
    room = await crud_hub.create_room_with_seats(db, hub_id=hub_id, obj_in=room_in)
    room.seats = await crud_hub.get_room_seats(db, room_id=room.id)
    return room
