from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.db.models import Hub, Room, Seat
from app.schemas.hub import HubCreate, RoomCreate, SeatCreate

async def get_hubs(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Hub]:
    stmt = select(Hub).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_room_by_id(db: AsyncSession, room_id: int) -> Optional[Room]:
    stmt = select(Room).where(Room.id == room_id)
    return await db.scalar(stmt)

async def create_hub(db: AsyncSession, obj_in: HubCreate) -> Hub:
    db_obj = Hub(name=obj_in.name, location=obj_in.location, info=obj_in.info)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_rooms_by_hub(db: AsyncSession, hub_id: int) -> List[Room]:
    stmt = select(Room).where(Room.hub_id == hub_id)
    # Eager load seats if needed, but schema handles lazy well depending on config
    # We will use selectinload just to be robust if the schema expects seats immediately
    # Wait, seats are a separate table, we should load them. Let's add relationships to models later or fetch manually.
    result = await db.execute(stmt)
    return list(result.scalars().all())
    

async def create_room_with_seats(db: AsyncSession, hub_id: int, obj_in: RoomCreate) -> Room:
    db_obj = Room(
        hub_id=hub_id,
        type=obj_in.type,
        capacity=obj_in.capacity,
        map_schema=obj_in.map_schema
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)

    if obj_in.seats:
        for seat_in in obj_in.seats:
            db_seat = Seat(room_id=db_obj.id, position_x=seat_in.position_x, position_y=seat_in.position_y)
            db.add(db_seat)
        await db.commit()
    
    return db_obj

async def get_room_seats(db: AsyncSession, room_id: int) -> List[Seat]:
    stmt = select(Seat).where(Seat.room_id == room_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_hub(db: AsyncSession, hub_id: int, obj_in: HubCreate) -> Optional[Hub]:
    """Обновить хаб"""
    stmt = select(Hub).where(Hub.id == hub_id)
    hub = await db.scalar(stmt)
    if not hub:
        return None
    
    hub.name = obj_in.name
    hub.location = obj_in.location
    hub.info = obj_in.info
    
    await db.commit()
    await db.refresh(hub)
    return hub


async def delete_hub(db: AsyncSession, hub_id: int) -> bool:
    """Удалить хаб"""
    stmt = delete(Hub).where(Hub.id == hub_id)
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0


async def get_hub_by_id(db: AsyncSession, hub_id: int) -> Optional[Hub]:
    """Получить хаб по ID"""
    stmt = select(Hub).where(Hub.id == hub_id)
    return await db.scalar(stmt)