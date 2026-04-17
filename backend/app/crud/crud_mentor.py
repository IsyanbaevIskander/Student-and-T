from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.db.models import (
    MentorProfile, MentorSlot, MentorTag, MentorRequest, 
    Hub, ApplicationStatusEnum, MentorRequestStatusEnum, BroadcastMentorRequest, Booking
)
from app.schemas.mentor import MentorApplyRequest, MentorProfileUpdate, MentorSlotCreate


# ==================== Профиль ментора ====================

async def get_mentor_profile(db: AsyncSession, user_id: int) -> Optional[MentorProfile]:
    """Получить профиль ментора по user_id"""
    stmt = select(MentorProfile).where(MentorProfile.user_id == user_id)
    return await db.scalar(stmt)


async def get_mentor_profile_full(db: AsyncSession, user_id: int) -> Optional[MentorProfile]:
    """Получить профиль ментора с тегами"""
    stmt = select(MentorProfile).where(
        MentorProfile.user_id == user_id
    ).options(
        selectinload(MentorProfile.tags),
        selectinload(MentorProfile.user)
    )
    
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    return profile


async def get_all_mentor_profiles(db: AsyncSession, status: ApplicationStatusEnum = None) -> list[MentorProfile]:
    """Получить все профили менторов (опционально по статусу)"""
    stmt = select(MentorProfile).options(
        selectinload(MentorProfile.tags),
        selectinload(MentorProfile.user)
    )
    if status:
        stmt = stmt.where(MentorProfile.status == status)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def apply_for_mentor(db: AsyncSession, user_id: int, obj_in: MentorApplyRequest) -> MentorProfile:
    """Подача заявки на менторство"""
    # Проверяем существование хаба
    stmt = select(Hub).where(Hub.id == obj_in.hub_id)
    result = await db.execute(stmt)
    hub = result.scalar_one_or_none()
    
    if not hub:
        raise ValueError(f"Hub with id {obj_in.hub_id} not found")
    
    # Проверяем, нет ли уже заявки
    stmt = select(MentorProfile).where(MentorProfile.user_id == user_id)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise ValueError("Mentor profile already exists")
    
    # Создаем профиль
    profile = MentorProfile(
        user_id=user_id,
        hub_id=obj_in.hub_id,
        status=ApplicationStatusEnum.PENDING,
        bio=obj_in.bio,
        resume_url=None,
        skills=obj_in.skills
    )
    
    db.add(profile)
    await db.flush()

    # Добавляем теги
    if obj_in.tags:
        for tag_name in obj_in.tags:
            tag = MentorTag(mentor_id=profile.user_id, tag_name=tag_name.strip())
            db.add(tag)

    await db.commit()
    await db.refresh(profile)
    return profile


async def get_pending_applications(db: AsyncSession) -> list[MentorProfile]:
    """Получить все ожидающие заявки"""
    stmt = select(MentorProfile).where(MentorProfile.status == ApplicationStatusEnum.PENDING).options(
        selectinload(MentorProfile.tags),
        selectinload(MentorProfile.user)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_application_status(
    db: AsyncSession, user_id: int, status: ApplicationStatusEnum
) -> Optional[MentorProfile]:
    """Обновить статус заявки"""
    profile = await get_mentor_profile(db, user_id)
    if not profile:
        return None
    profile.status = status
    await db.commit()
    await db.refresh(profile)
    return profile


async def update_mentor_profile(db: AsyncSession, user_id: int, obj_in: MentorProfileUpdate) -> Optional[MentorProfile]:
    """Обновить профиль ментора (без тегов)"""
    profile = await get_mentor_profile(db, user_id)
    if not profile:
        return None
    for var, value in obj_in.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(profile, var, value)
    await db.commit()
    await db.refresh(profile)
    return profile


async def update_mentor_profile_full(db: AsyncSession, user_id: int, obj_in: MentorProfileUpdate) -> Optional[MentorProfile]:
    """Обновить профиль ментора с тегами"""
    profile = await get_mentor_profile(db, user_id)
    if not profile:
        return None
    
    # Обновляем поля
    update_data = obj_in.model_dump(exclude_unset=True, exclude={'tags'})
    for field, value in update_data.items():
        if value is not None:
            setattr(profile, field, value)
    
    # Обновляем теги
    if obj_in.tags is not None:
        await update_mentor_tags(db, profile.user_id, obj_in.tags)
    
    await db.commit()
    await db.refresh(profile)
    return profile


async def delete_mentor_profile(db: AsyncSession, user_id: int) -> bool:
    """Удалить профиль ментора"""
    stmt = delete(MentorProfile).where(MentorProfile.user_id == user_id)
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0


# ==================== Теги ====================

async def update_mentor_tags(db: AsyncSession, mentor_id: int, tags: list[str]) -> list:
    """Обновить теги ментора"""
    # Удаляем старые теги
    stmt = delete(MentorTag).where(MentorTag.mentor_id == mentor_id)
    await db.execute(stmt)
    
    # Создаём новые
    new_tags = []
    for tag_name in tags:
        tag = MentorTag(mentor_id=mentor_id, tag_name=tag_name.strip())
        db.add(tag)
        new_tags.append(tag)
    await db.flush()
    return new_tags


async def get_mentor_tags(db: AsyncSession, mentor_id: int) -> list[MentorTag]:
    """Получить теги ментора"""
    stmt = select(MentorTag).where(MentorTag.mentor_id == mentor_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


# ==================== Слоты ====================

async def create_mentor_slot(db: AsyncSession, mentor_id: int, obj_in: MentorSlotCreate) -> Optional[MentorSlot]:
    """Создать слот доступности"""
    # Проверяем пересечение с существующими слотами
    stmt = select(MentorSlot).where(
        and_(
            MentorSlot.mentor_id == mentor_id,
            MentorSlot.start_at < obj_in.end_at,
            MentorSlot.end_at > obj_in.start_at
        )
    )
    existing = await db.scalar(stmt)
    if existing:
        return None
    
    db_obj = MentorSlot(
        mentor_id=mentor_id,
        start_at=obj_in.start_at,
        end_at=obj_in.end_at
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def get_mentor_slots(db: AsyncSession, mentor_id: int) -> list[MentorSlot]:
    """Получить все слоты ментора"""
    stmt = select(MentorSlot).where(MentorSlot.mentor_id == mentor_id).order_by(MentorSlot.start_at)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_available_slots(db: AsyncSession, mentor_id: int = None) -> list[MentorSlot]:
    """Получить доступные слоты"""
    now = datetime.utcnow()
    stmt = select(MentorSlot).where(
        and_(
            MentorSlot.start_at > now,
            MentorSlot.is_booked == False
        )
    ).order_by(MentorSlot.start_at)
    
    if mentor_id:
        stmt = stmt.where(MentorSlot.mentor_id == mentor_id)
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def delete_mentor_slot(db: AsyncSession, slot_id: int, mentor_id: int) -> bool:
    """Удалить слот ментора"""
    stmt = delete(MentorSlot).where(
        and_(MentorSlot.id == slot_id, MentorSlot.mentor_id == mentor_id)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0


# ==================== Запросы на встречу ====================

async def create_mentor_request(
    db: AsyncSession, 
    student_id: int, 
    mentor_id: int, 
    slot_id: int, 
    message: str = None
) -> Optional[MentorRequest]:
    """Создать запрос на встречу"""
    # Проверяем, что слот существует и свободен
    stmt = select(MentorSlot).where(
        and_(MentorSlot.id == slot_id, MentorSlot.is_booked == False)
    )
    slot = await db.scalar(stmt)
    if not slot:
        return None
    
    # Создаём запрос
    request = MentorRequest(
        student_id=student_id,
        mentor_id=mentor_id,
        slot_id=slot_id,
        message=message
    )
    db.add(request)
    
    # Бронируем слот
    slot.is_booked = True
    await db.commit()
    await db.refresh(request)
    return request


async def get_mentor_requests(
    db: AsyncSession, 
    mentor_id: int, 
    status: MentorRequestStatusEnum = None
) -> list:
    """Получить запросы к ментору"""
    stmt = select(MentorRequest).where(MentorRequest.mentor_id == mentor_id)
    if status:
        stmt = stmt.where(MentorRequest.status == status)
    
    stmt = stmt.options(
        selectinload(MentorRequest.student),
        selectinload(MentorRequest.slot)
    ).order_by(MentorRequest.created_at.desc())
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_all_mentor_requests(db: AsyncSession, status: MentorRequestStatusEnum = None) -> list:
    """Админ: получить все запросы на встречи"""
    stmt = select(MentorRequest)
    if status:
        stmt = stmt.where(MentorRequest.status == status)
    
    stmt = stmt.options(
        selectinload(MentorRequest.student),
        selectinload(MentorRequest.mentor),
        selectinload(MentorRequest.slot)
    ).order_by(MentorRequest.created_at.desc())
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_student_requests(db: AsyncSession, student_id: int) -> list:
    """Получить запросы студента"""
    stmt = select(MentorRequest).where(MentorRequest.student_id == student_id).options(
        selectinload(MentorRequest.mentor),
        selectinload(MentorRequest.slot)
    ).order_by(MentorRequest.created_at.desc())
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_mentor_request_status(
    db: AsyncSession, 
    request_id: int, 
    mentor_id: int, 
    status: MentorRequestStatusEnum
) -> Optional[MentorRequest]:
    """Обновить статус запроса (ментор)"""
    stmt = select(MentorRequest).where(
        and_(MentorRequest.id == request_id, MentorRequest.mentor_id == mentor_id)
    )
    request = await db.scalar(stmt)
    if not request:
        return None
    
    request.status = status
    
    # Если отклонили - освобождаем слот
    if status == MentorRequestStatusEnum.REJECTED:
        stmt = select(MentorSlot).where(MentorSlot.id == request.slot_id)
        slot = await db.scalar(stmt)
        if slot:
            slot.is_booked = False
    
    await db.commit()
    await db.refresh(request)
    return request


# ==================== Поиск ====================

async def search_mentors_by_tags(db: AsyncSession, tags: list[str]) -> list[MentorProfile]:
    """Поиск менторов по тегам"""
    stmt = select(MentorProfile).where(
        MentorProfile.status == ApplicationStatusEnum.APPROVED
    ).options(
        selectinload(MentorProfile.tags),
        selectinload(MentorProfile.user)
    )
    
    result = await db.execute(stmt)
    profiles = list(result.scalars().all())
    
    # Фильтруем по тегам
    if tags:
        filtered = []
        for profile in profiles:
            profile_tags = [tag.tag_name for tag in profile.tags] if profile.tags else []
            # Проверяем совпадение тегов
            if any(tag.lower() in ' '.join(profile_tags).lower() for tag in tags):
                filtered.append(profile)
        return filtered
    
    return profiles
# ==================== Broadcast (Рассылка) ====================

async def create_broadcast_request(
    db: AsyncSession,
    student_id: int,
    booking_id: int,
    stack: str
) -> BroadcastMentorRequest:
    """Создать широковещательный запрос на ментора"""
    db_obj = BroadcastMentorRequest(
        student_id=student_id,
        booking_id=booking_id,
        stack=stack.strip()
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_available_broadcast_requests(
    db: AsyncSession,
    mentor_tags: list[str]
) -> list[BroadcastMentorRequest]:
    """Получить доступные широковещательные запросы для ментора по его тегам"""
    stmt = select(BroadcastMentorRequest).where(
        and_(
            BroadcastMentorRequest.status == MentorRequestStatusEnum.PENDING,
            BroadcastMentorRequest.stack.in_([t.strip() for t in mentor_tags])
        )
    ).options(
        selectinload(BroadcastMentorRequest.student),
        selectinload(BroadcastMentorRequest.booking)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def accept_broadcast_request(
    db: AsyncSession,
    request_id: int,
    mentor_id: int
) -> Optional[BroadcastMentorRequest]:
    """Ментор принимает широковещательный запрос"""
    stmt = select(BroadcastMentorRequest).where(
        and_(
            BroadcastMentorRequest.id == request_id,
            BroadcastMentorRequest.status == MentorRequestStatusEnum.PENDING
        )
    )
    request = await db.scalar(stmt)
    if not request:
        return None
    
    # Занимаем запрос
    request.status = MentorRequestStatusEnum.ACCEPTED
    request.mentor_id = mentor_id
    
    await db.commit()
    await db.refresh(request)
    return request

async def get_mentor_broadcast_requests(
    db: AsyncSession,
    mentor_id: int
) -> list[BroadcastMentorRequest]:
    """Получить запросы, принятые данным ментором"""
    stmt = select(BroadcastMentorRequest).where(
        BroadcastMentorRequest.mentor_id == mentor_id
    ).options(
        selectinload(BroadcastMentorRequest.student),
        selectinload(BroadcastMentorRequest.booking)
    ).order_by(BroadcastMentorRequest.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())
