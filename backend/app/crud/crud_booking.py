from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import Booking
from app.schemas.booking import BookingCreate, BookingStatusUpdate
from datetime import datetime

async def create_booking(db: AsyncSession, obj_in: BookingCreate, user_id: int) -> List[Booking]:
    bookings = []
    
    # If booking multiple seats
    if obj_in.seat_ids:
        for seat_id in obj_in.seat_ids:
            db_obj = Booking(
                user_id=user_id,
                seat_id=seat_id,
                room_id=obj_in.room_id,
                start_at=obj_in.start_at,
                end_at=obj_in.end_at
            )
            db.add(db_obj)
            bookings.append(db_obj)
    # If booking a group room without specific seats
    elif obj_in.room_id:
        db_obj = Booking(
            user_id=user_id,
            room_id=obj_in.room_id,
            seat_id=None,
            start_at=obj_in.start_at,
            end_at=obj_in.end_at
        )
        db.add(db_obj)
        bookings.append(db_obj)
        
    await db.commit()
    for b in bookings:
        await db.refresh(b)
    return bookings

async def create_booking_with_status(
    db: AsyncSession, 
    user_id: int,
    room_id: int,
    start_at: datetime,
    end_at: datetime,
    status: str = "PENDING"
) -> Booking:
    db_obj = Booking(
        user_id=user_id,
        room_id=room_id,
        start_at=start_at,
        end_at=end_at,
        status=status
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_user_bookings(db: AsyncSession, user_id: int) -> List[Booking]:
    stmt = select(Booking).where(Booking.user_id == user_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def update_booking_status(db: AsyncSession, booking_id: int, obj_in: BookingStatusUpdate) -> Optional[Booking]:
    stmt = select(Booking).where(Booking.id == booking_id)
    db_obj = await db.scalar(stmt)
    if not db_obj:
        return None
    db_obj.status = obj_in.status
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def check_in_booking(db: AsyncSession, booking_id: int, user_id: int) -> Optional[Booking]:
    stmt = select(Booking).where(Booking.id == booking_id).where(Booking.user_id == user_id)
    db_obj = await db.scalar(stmt)
    if not db_obj:
        return None
    db_obj.is_checked_in = True
    await db.commit()
    await db.refresh(db_obj)
    return db_obj
