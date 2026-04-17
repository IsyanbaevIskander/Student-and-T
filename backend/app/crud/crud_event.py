import uuid
import secrets
import string
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.db.models import Event, EventStatusEnum, Booking, BookingTypeEnum, BookingStatusEnum
from app.schemas.event import EventCreate, EventStatusUpdate

def generate_invite_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

async def create_event(db: AsyncSession, obj_in: EventCreate, creator_id: int) -> Event:
    invite_code = generate_invite_code()
    # Ensure uniqueness (simple retry logic)
    while True:
        stmt = select(Event).where(Event.invite_code == invite_code)
        existing = await db.execute(stmt)
        if not existing.scalar():
            break
        invite_code = generate_invite_code()

    # Все мероприятия требуют модерации по умолчанию
    initial_status = EventStatusEnum.PENDING

    db_obj = Event(
        title=obj_in.title,
        description=obj_in.description,
        start_time=obj_in.start_time,
        end_time=obj_in.end_time,
        creator_id=creator_id,
        hub_id=obj_in.hub_id,
        max_attendees=obj_in.max_attendees,
        is_public=obj_in.is_public,
        status=initial_status,
        invite_code=invite_code
    )
    db.add(db_obj)
    await db.flush() # Получаем ID мероприятия

    # Создаем бронирование для организатора
    creator_booking = Booking(
        user_id=creator_id,
        event_id=db_obj.id,
        hub_id=obj_in.hub_id,
        start_at=obj_in.start_time,
        end_at=obj_in.end_time,
        booking_type=BookingTypeEnum.EVENT,
        # Статус брони организатора совпадает со статусом мероприятия
        status=BookingStatusEnum.APPROVED if initial_status == EventStatusEnum.APPROVED else BookingStatusEnum.PENDING,
        qr_code=str(uuid.uuid4())
    )
    db.add(creator_booking)
    
    await db.commit()
    await db.refresh(db_obj)
    
    # Добавляем qr_code в объект для возврата (чтобы pydantic его увидел)
    db_obj.qr_code = creator_booking.qr_code
    return db_obj

async def get_public_events(db: AsyncSession) -> List[Event]:
    stmt = select(Event).where(
        Event.status == EventStatusEnum.APPROVED,
        Event.is_public == True
    ).options(
        selectinload(Event.creator),
        selectinload(Event.hub),
        selectinload(Event.participants)
    ).order_by(Event.start_time.asc())
    
    result = await db.execute(stmt)
    events = result.scalars().all()
    return list(events)

async def get_my_events(db: AsyncSession, user_id: int) -> List[Event]:
    stmt = select(Event).where(Event.creator_id == user_id).options(
        selectinload(Event.hub),
        selectinload(Event.participants)
    ).order_by(Event.created_at.desc())
    
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_event_by_id(db: AsyncSession, event_id: int) -> Optional[Event]:
    stmt = select(Event).where(Event.id == event_id).options(
        selectinload(Event.creator),
        selectinload(Event.hub),
        selectinload(Event.participants)
    )
    result = await db.execute(stmt)
    return result.scalar()

async def get_event_by_invite_code(db: AsyncSession, invite_code: str) -> Optional[Event]:
    stmt = select(Event).where(Event.invite_code == invite_code).options(
        selectinload(Event.creator),
        selectinload(Event.hub),
        selectinload(Event.participants)
    )
    result = await db.execute(stmt)
    return result.scalar()

async def update_event_status(db: AsyncSession, event_id: int, status_in: EventStatusUpdate) -> Optional[Event]:
    event = await get_event_by_id(db, event_id)
    if not event:
        return None
    
    event.status = status_in.status
    
    # Синхронизируем статусы всех связанных бронирований
    new_booking_status = (
        BookingStatusEnum.APPROVED if status_in.status == EventStatusEnum.APPROVED 
        else BookingStatusEnum.REJECTED if status_in.status == EventStatusEnum.REJECTED 
        else None
    )
    
    if new_booking_status:
        stmt = select(Booking).where(Booking.event_id == event_id)
        result = await db.execute(stmt)
        for b in result.scalars().all():
            b.status = new_booking_status

    await db.commit()
    await db.refresh(event)
    return event

async def join_event(db: AsyncSession, event_id: int, user_id: int) -> Booking:
    event = await get_event_by_id(db, event_id)
    if not event:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")
    
    if event.status != EventStatusEnum.APPROVED:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Мероприятие еще не одобрено администратором")

    # Count current participants
    current_count = len(event.participants)
    if current_count >= event.max_attendees:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Мест больше нет")

    # Check if already joined
    stmt = select(Booking).where(Booking.user_id == user_id, Booking.event_id == event_id)
    existing = await db.execute(stmt)
    if existing.scalar():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Вы уже записаны на это мероприятие")

    # Create booking (ticket)
    # Note: start_time/end_time for the booking match the event
    db_obj = Booking(
        user_id=user_id,
        event_id=event_id,
        hub_id=event.hub_id,
        start_at=event.start_time,
        end_at=event.end_time,
        booking_type=BookingTypeEnum.EVENT,
        status=BookingStatusEnum.APPROVED, # Event registration is auto-approved if event is approved
        qr_code=str(uuid.uuid4())
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj
