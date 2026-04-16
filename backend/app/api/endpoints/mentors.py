from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud import crud_mentor
from app.schemas.mentor import MentorProfileUpdate, MentorProfileResponse, MentorSlotCreate, MentorSlotResponse, MentorSearchRequest, MentorMeetingRequest
from app.services import bot
from app.services import rag

router = APIRouter()

@router.put("/profile", response_model=MentorProfileResponse)
async def update_profile(
    *,
    db: AsyncSession = Depends(deps.get_db),
    profile_in: MentorProfileUpdate,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    # Verify if MENTOR role
    profile = await crud_mentor.update_mentor_profile(db, user_id=current_user.id, obj_in=profile_in)
    return profile

@router.post("/slots", response_model=MentorSlotResponse)
async def create_slot(
    *,
    db: AsyncSession = Depends(deps.get_db),
    slot_in: MentorSlotCreate,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    slot = await crud_mentor.create_mentor_slot(db, mentor_id=current_user.id, obj_in=slot_in)
    return slot

@router.post("/search")
async def search_mentors(
    request: MentorSearchRequest,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    answer = rag.ask_mentor_rag(request.query)
    return {"response": answer}

@router.post("/request")
async def request_meeting(
    *,
    db: AsyncSession = Depends(deps.get_db),
    request_in: MentorMeetingRequest,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    # Here we would fetch mentor's tg_id using DB and send them a message.
    # For now, it's a stub to show integration.
    mentor_profile = await crud_mentor.get_mentor_profile(db, user_id=request_in.mentor_id)
    if not mentor_profile:
        raise HTTPException(status_code=404, detail="Mentor not found")
        
    # Stub: user would have a tg_id
    # await bot.send_notification(mentor_tg_id, f"Новый запрос на менторство: {request_in.message}")
    return {"status": "request_sent"}
