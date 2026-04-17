from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.event import EventCreate, EventRead
from app.crud import crud_event
from app.api.deps import get_current_user
from app.db.models import User, RoleEnum

router = APIRouter()

@router.post("/", response_model=EventRead)
async def create_event(
    *,
    db: AsyncSession = Depends(get_db),
    obj_in: EventCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Создать новое мероприятие. 
    По умолчанию статус PENDING, требует одобрения администратором.
    """
    return await crud_event.create_event(db, obj_in, current_user.id)

@router.get("/public", response_model=List[EventRead])
async def get_public_events(
    db: AsyncSession = Depends(get_db)
):
    """
    Получить список публичных одобренных мероприятий (Афиша).
    """
    events = await crud_event.get_public_events(db)
    # Mapping attendees_count manually if not handled by from_attributes
    for e in events:
        e.attendees_count = len(e.participants)
    return events

@router.get("/my", response_model=List[EventRead])
async def get_my_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Мероприятия, созданные текущим пользователем.
    """
    events = await crud_event.get_my_events(db, current_user.id)
    for e in events:
        e.attendees_count = len(e.participants)
    return events

@router.get("/invite/{invite_code}", response_model=EventRead)
async def get_event_by_invite(
    invite_code: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Получить информацию о мероприятии по коду приглашения.
    """
    event = await crud_event.get_event_by_invite_code(db, invite_code)
    if not event:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")
    event.attendees_count = len(event.participants)
    return event

@router.post("/join/{invite_code}")
async def join_event(
    invite_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Присоединиться к мероприятию по коду приглашения.
    """
    event = await crud_event.get_event_by_invite_code(db, invite_code)
    if not event:
        raise HTTPException(status_code=404, detail="Мероприятие по коду не найдено")
    
    return await crud_event.join_event(db, event.id, current_user.id)

@router.get("/{event_id}", response_model=EventRead)
async def get_event(
    event_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Детальная информация о мероприятии.
    """
    event = await crud_event.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")
    event.attendees_count = len(event.participants)
    return event
