import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.models import Booking, BookingTypeEnum, BookingStatusEnum, Event, BroadcastMentorRequest, MentorRequestStatusEnum
from app.schemas.booking import BookingCreate, BookingStatusUpdate
from datetime import datetime

def _attach_mentor_info(booking: Booking):
    """Вручную прикрепляет mentor из запросов к объекту бронирования"""
    booking.mentor = None
    if hasattr(booking, 'mentor_requests') and booking.mentor_requests:
        for req in booking.mentor_requests:
            if req.status == MentorRequestStatusEnum.ACCEPTED:
                booking.mentor = req.mentor
                break

async def create_booking(db: AsyncSession, obj_in: BookingCreate, user_id: int) -> List[Booking]:
    bookings_list = []
    
    # Проверка на дубликаты (одна бронь в день на пользователя)
    from datetime import datetime, time
    start_at = obj_in.start_at
    day_start = datetime.combine(start_at.date(), time.min)
    day_end = datetime.combine(start_at.date(), time.max)
    
    stmt = select(Booking).where(
        Booking.user_id == user_id,
        Booking.start_at >= day_start,
        Booking.start_at <= day_end,
        Booking.status != BookingStatusEnum.REJECTED
    )
    existing = await db.execute(stmt)
    if existing.scalars().first():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Вы уже забронировали место на этот день")

    # Если бронирование нескольких мест (индивидуальное)
    if obj_in.seat_ids:
        for seat_id in obj_in.seat_ids:
            db_obj = Booking(
                user_id=user_id,
                seat_id=seat_id,
                room_id=obj_in.room_id,
                hub_id=obj_in.hub_id,
                start_at=obj_in.start_at,
                end_at=obj_in.end_at,
                booking_type=obj_in.booking_type,
                status=BookingStatusEnum.APPROVED if obj_in.booking_type == BookingTypeEnum.INDIVIDUAL else BookingStatusEnum.PENDING,
                qr_code=str(uuid.uuid4()),
            )
            db.add(db_obj)
            bookings_list.append(db_obj)
    # Групповая комната или мероприятие
    elif obj_in.room_id or obj_in.hub_id:
        db_obj = Booking(
            user_id=user_id,
            room_id=obj_in.room_id,
            hub_id=obj_in.hub_id,
            seat_id=None,
            start_at=obj_in.start_at,
            end_at=obj_in.end_at,
            booking_type=obj_in.booking_type,
            status=BookingStatusEnum.APPROVED if obj_in.booking_type == BookingTypeEnum.INDIVIDUAL else BookingStatusEnum.PENDING,
            qr_code=str(uuid.uuid4()),
        )
        db.add(db_obj)
        bookings_list.append(db_obj)
        
    await db.commit()
    
    # Подгружаем связи для ответа
    created_ids = [b.id for b in bookings_list]
    stmt = select(Booking).where(Booking.id.in_(created_ids)).options(
        selectinload(Booking.user),
        selectinload(Booking.hub),
        selectinload(Booking.event),
        selectinload(Booking.mentor_requests).selectinload(BroadcastMentorRequest.mentor)
    )
    result = await db.execute(stmt)
    loaded_bookings = list(result.scalars().all())
    for b in loaded_bookings:
        _attach_mentor_info(b)
    return loaded_bookings

async def get_user_bookings(db: AsyncSession, user_id: int) -> List[Booking]:
    stmt = select(Booking).where(Booking.user_id == user_id).options(
        selectinload(Booking.user),
        selectinload(Booking.hub),
        selectinload(Booking.event).selectinload(Event.hub),
        selectinload(Booking.mentor_requests).selectinload(BroadcastMentorRequest.mentor)
    ).order_by(Booking.start_at.desc())
    result = await db.execute(stmt)
    bookings_list = list(result.scalars().all())
    for b in bookings_list:
        _attach_mentor_info(b)
    return bookings_list

async def get_booking(db: AsyncSession, id: int) -> Optional[Booking]:
    stmt = select(Booking).where(Booking.id == id).options(
        selectinload(Booking.user),
        selectinload(Booking.hub),
        selectinload(Booking.event),
        selectinload(Booking.mentor_requests).selectinload(BroadcastMentorRequest.mentor)
    )
    result = await db.execute(stmt)
    booking = result.scalar_one_or_none()
    if booking:
        _attach_mentor_info(booking)
    return booking

async def get_all_bookings(db: AsyncSession) -> List[Booking]:
    # Для админов показываем всё
    stmt = select(Booking).options(
        selectinload(Booking.user),
        selectinload(Booking.hub),
        selectinload(Booking.event),
        selectinload(Booking.mentor_requests).selectinload(BroadcastMentorRequest.mentor)
    ).order_by(Booking.start_at.desc())
    result = await db.execute(stmt)
    bookings_list = list(result.scalars().all())
    for b in bookings_list:
        _attach_mentor_info(b)
    return bookings_list

async def update_booking_status(db: AsyncSession, booking_id: int, obj_in: BookingStatusUpdate) -> Optional[Booking]:
    stmt = select(Booking).where(Booking.id == booking_id)
    db_obj = await db.scalar(stmt)
    if not db_obj:
        return None
    db_obj.status = obj_in.status
    await db.commit()
    
    # Перевыбираем со связями
    return await get_booking(db, booking_id)

async def check_in_booking(db: AsyncSession, booking_id: int, user_id: int) -> Optional[Booking]:
    stmt = select(Booking).where(Booking.id == booking_id).where(Booking.user_id == user_id)
    db_obj = await db.scalar(stmt)
    if not db_obj:
        return None
    db_obj.is_checked_in = True
    await db.commit()
    
    # Перевыбираем со связями
    return await get_booking(db, booking_id)
