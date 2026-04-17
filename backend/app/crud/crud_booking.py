import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.db.models import Booking, BookingTypeEnum, BookingStatusEnum
from app.schemas.booking import BookingCreate, BookingStatusUpdate
from datetime import datetime

async def create_booking(db: AsyncSession, obj_in: BookingCreate, user_id: int) -> List[Booking]:
    bookings = []
    qr_code = str(uuid.uuid4())
    
    # Передаем даты как есть, SQLAlchemy с timezone=True сам все обработает
    start_at = obj_in.start_at
    end_at = obj_in.end_at

    # Проверка на дубликаты (одна бронь в день на пользователя)
    from datetime import datetime, time
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
                start_at=start_at,
                end_at=end_at,
                booking_type=obj_in.booking_type,
                status=BookingStatusEnum.APPROVED if obj_in.booking_type == BookingTypeEnum.INDIVIDUAL else BookingStatusEnum.PENDING,
                qr_code=str(uuid.uuid4()),  # Уникальный QR для каждого места
                event_description=obj_in.event_description,
                event_attendees=obj_in.event_attendees,
            )
            db.add(db_obj)
            bookings.append(db_obj)
    # Групповая комната или мероприятие
    elif obj_in.room_id or obj_in.hub_id:
        db_obj = Booking(
            user_id=user_id,
            room_id=obj_in.room_id,
            hub_id=obj_in.hub_id,
            seat_id=None,
            start_at=start_at,
            end_at=end_at,
            booking_type=obj_in.booking_type,
            status=BookingStatusEnum.APPROVED if obj_in.booking_type == BookingTypeEnum.INDIVIDUAL else BookingStatusEnum.PENDING,
            qr_code=qr_code,
            event_description=obj_in.event_description,
            event_attendees=obj_in.event_attendees,
        )
        db.add(db_obj)
        bookings.append(db_obj)
        
    await db.commit()
    
    # Подгружаем связи для ответа, чтобы избежать ошибок ленивой загрузки в асинхронном режиме
    created_ids = [b.id for b in bookings]
    stmt = select(Booking).where(Booking.id.in_(created_ids)).options(
        selectinload(Booking.user),
        selectinload(Booking.hub)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

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
    stmt = select(Booking).where(Booking.user_id == user_id).options(
        selectinload(Booking.user),
        selectinload(Booking.hub)
    ).order_by(Booking.start_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_all_bookings(db: AsyncSession) -> List[Booking]:
    stmt = select(Booking).where(Booking.booking_type == BookingTypeEnum.EVENT).options(
        selectinload(Booking.user),
        selectinload(Booking.hub)
    ).order_by(Booking.start_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def update_booking_status(db: AsyncSession, booking_id: int, obj_in: BookingStatusUpdate) -> Optional[Booking]:
    stmt = select(Booking).where(Booking.id == booking_id)
    db_obj = await db.scalar(stmt)
    if not db_obj:
        return None
    db_obj.status = obj_in.status
    await db.commit()
    
    # Перевыбираем со связями
    stmt = select(Booking).where(Booking.id == booking_id).options(
        selectinload(Booking.user),
        selectinload(Booking.hub)
    )
    return await db.scalar(stmt)

async def check_in_booking(db: AsyncSession, booking_id: int, user_id: int) -> Optional[Booking]:
    stmt = select(Booking).where(Booking.id == booking_id).where(Booking.user_id == user_id)
    db_obj = await db.scalar(stmt)
    if not db_obj:
        return None
    db_obj.is_checked_in = True
    await db.commit()
    
    # Перевыбираем со связями
    stmt = select(Booking).where(Booking.id == booking_id).options(
        selectinload(Booking.user),
        selectinload(Booking.hub)
    )
    return await db.scalar(stmt)


async def get_booking_by_id(db: AsyncSession, booking_id: int) -> Optional[Booking]:
    """Получить бронирование по ID"""
    stmt = select(Booking).where(Booking.id == booking_id).options(
        selectinload(Booking.user),
        selectinload(Booking.hub)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_pending_bookings(db: AsyncSession) -> List[Booking]:
    """Получить все бронирования, ожидающие подтверждения"""
    stmt = select(Booking).where(
        Booking.status == BookingStatusEnum.PENDING
    ).options(
        selectinload(Booking.user),
        selectinload(Booking.hub)
    ).order_by(Booking.start_at)
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_hub_pending_bookings(db: AsyncSession, hub_id: int) -> List[Booking]:
    """Получить ожидающие подтверждения бронирования хаба"""
    stmt = select(Booking).where(
        and_(
            Booking.hub_id == hub_id,
            Booking.status == BookingStatusEnum.PENDING
        )
    ).options(
        selectinload(Booking.user),
        selectinload(Booking.hub)
    ).order_by(Booking.start_at)
    
    result = await db.execute(stmt)
    return list(result.scalars().all())
