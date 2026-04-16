from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud import crud_mentor, crud_user
from app.db.models import RoleEnum, ApplicationStatusEnum
from app.schemas.mentor import (
    MentorApplyRequest, MentorProfileResponse, MentorProfileUpdate,
    MentorSlotCreate, MentorSlotResponse, MentorSearchRequest, MentorMeetingRequest
)
from app.services import rag

router = APIRouter()

# ---- Заявка на менторство ----

@router.post("/apply", response_model=MentorProfileResponse)
async def apply_for_mentor(
    *,
    db: AsyncSession = Depends(deps.get_db),
    apply_in: MentorApplyRequest,
    current_user=Depends(deps.get_current_active_user)
) -> Any:
    """Студент подаёт заявку на менторство, привязываясь к хабу."""
    existing = await crud_mentor.get_mentor_profile(db, user_id=current_user.id)
    if existing:
        raise HTTPException(status_code=400, detail="Заявка уже подана")
    profile = await crud_mentor.apply_for_mentor(db, user_id=current_user.id, obj_in=apply_in)
    return profile

# ---- Админ: управление заявками ----

@router.get("/applications", response_model=List[MentorProfileResponse])
async def list_pending_applications(
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user)
) -> Any:
    """Админ: список ожидающих заявок на менторство."""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    return await crud_mentor.get_pending_applications(db)

@router.put("/applications/{user_id}/approve", response_model=MentorProfileResponse)
async def approve_mentor(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user)
) -> Any:
    """Админ одобряет заявку — пользователь становится ментором."""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    profile = await crud_mentor.update_application_status(db, user_id, ApplicationStatusEnum.APPROVED)
    if not profile:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    await crud_user.set_user_role(db, user_id, RoleEnum.MENTOR)
    return profile

@router.put("/applications/{user_id}/reject", response_model=MentorProfileResponse)
async def reject_mentor(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user)
) -> Any:
    """Админ отклоняет заявку."""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    profile = await crud_mentor.update_application_status(db, user_id, ApplicationStatusEnum.REJECTED)
    if not profile:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return profile

# ---- Ментор: профиль и слоты ----

@router.put("/profile", response_model=MentorProfileResponse)
async def update_profile(
    *,
    db: AsyncSession = Depends(deps.get_db),
    profile_in: MentorProfileUpdate,
    current_user=Depends(deps.get_current_active_user)
) -> Any:
    """Одобренный ментор обновляет свой профиль."""
    if current_user.role != RoleEnum.MENTOR:
        raise HTTPException(status_code=403, detail="Только для менторов")
    profile = await crud_mentor.update_mentor_profile(db, user_id=current_user.id, obj_in=profile_in)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    return profile

@router.post("/slots", response_model=MentorSlotResponse)
async def create_slot(
    *,
    db: AsyncSession = Depends(deps.get_db),
    slot_in: MentorSlotCreate,
    current_user=Depends(deps.get_current_active_user)
) -> Any:
    """Ментор создаёт доступный слот для встречи."""
    if current_user.role != RoleEnum.MENTOR:
        raise HTTPException(status_code=403, detail="Только для менторов")
    slot = await crud_mentor.create_mentor_slot(db, mentor_id=current_user.id, obj_in=slot_in)
    return slot

# ---- Поиск и запрос встречи ----

@router.post("/search")
async def search_mentors(
    request: MentorSearchRequest,
    current_user=Depends(deps.get_current_active_user)
) -> Any:
    """Поиск ментора (RAG-заглушка)."""
    answer = rag.ask_mentor_rag(request.query)
    return {"response": answer}

@router.post("/request")
async def request_meeting(
    *,
    db: AsyncSession = Depends(deps.get_db),
    request_in: MentorMeetingRequest,
    current_user=Depends(deps.get_current_active_user)
) -> Any:
    """Студент запрашивает встречу с ментором."""
    mentor_profile = await crud_mentor.get_mentor_profile(db, user_id=request_in.mentor_id)
    if not mentor_profile:
        raise HTTPException(status_code=404, detail="Ментор не найден")
    if mentor_profile.status != ApplicationStatusEnum.APPROVED:
        raise HTTPException(status_code=400, detail="Ментор ещё не одобрен")
    return {"status": "request_sent"}
