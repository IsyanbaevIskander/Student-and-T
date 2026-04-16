from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import os
import shutil
from datetime import datetime

from app.utils.file_validator import FileValidator
from app.core.config import settings
from app.api import deps
from app.crud import crud_mentor, crud_user
from app.db.models import RoleEnum, ApplicationStatusEnum, MentorProfile, MentorRequestStatusEnum
from app.schemas.mentor import (
    MentorApplyRequest, MentorProfileResponse, MentorProfileUpdate,
    MentorSlotCreate, MentorSlotResponse, MentorSearchRequest,
    MentorMeetingRequest, MentorRequestResponse, MentorRequestUpdate,
    MentorTagResponse
)

router = APIRouter()

def _profile_to_response(profile: MentorProfile) -> MentorProfileResponse:
    """Преобразует модель MentorProfile в Pydantic схему"""
    return MentorProfileResponse(
        user_id=profile.user_id,
        hub_id=profile.hub_id,
        bio=profile.bio,
        resume_url=profile.resume_url,
        skills=profile.skills,
        status=profile.status,
        tags=[MentorTagResponse(id=tag.id, tag_name=tag.tag_name) for tag in (profile.tags or [])]
    )

# ---- Заявка на менторство ----
@router.post("/apply", response_model=MentorProfileResponse)
async def apply_for_mentor(
    *,
    db: AsyncSession = Depends(deps.get_db),
    apply_in: MentorApplyRequest,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Подача заявки на менторство"""
    # Проверяем, нет ли уже профиля
    existing = await crud_mentor.get_mentor_profile(db, user_id=current_user.id)
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Заявка уже подана"
        )
    
    # Создаем профиль
    profile = await crud_mentor.apply_for_mentor(
        db, 
        user_id=current_user.id, 
        obj_in=apply_in
    )
    
    # Возвращаем базовый профиль без попытки загрузить теги
    return MentorProfileResponse(
        user_id=profile.user_id,
        hub_id=profile.hub_id,
        bio=profile.bio,
        resume_url=profile.resume_url,
        skills=profile.skills,
        status=profile.status,
        tags=[]  # Пустой список тегов для нового профиля
    )

# ---- Профиль ментора с тегами ----
@router.get("/profile/{user_id}", response_model=MentorProfileResponse)
async def get_mentor_profile(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    profile = await crud_mentor.get_mentor_profile_full(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Ментор не найден")
    
    # Явно преобразуем в Pydantic модель
    return MentorProfileResponse(
        user_id=profile.user_id,
        hub_id=profile.hub_id,
        bio=profile.bio,
        resume_url=profile.resume_url,
        skills=profile.skills,
        status=profile.status,
        tags=[MentorTagResponse(id=tag.id, tag_name=tag.tag_name) for tag in profile.tags]
    )

@router.put("/profile", response_model=MentorProfileResponse)
async def update_profile(
    *,
    db: AsyncSession = Depends(deps.get_db),
    profile_in: MentorProfileUpdate,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    if current_user.role != RoleEnum.MENTOR:
        raise HTTPException(status_code=403, detail="Только для менторов")
    
    # Проверяем существование профиля
    profile = await crud_mentor.get_mentor_profile(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль ментора не найден")
    
    # Обновляем профиль
    await crud_mentor.update_mentor_profile_full(
        db, 
        user_id=current_user.id, 
        obj_in=profile_in
    )
    
    # Получаем обновленный профиль
    profile_full = await crud_mentor.get_mentor_profile_full(db, current_user.id)
    
    # Явно преобразуем в Pydantic модель
    return MentorProfileResponse(
        user_id=profile_full.user_id,
        hub_id=profile_full.hub_id,
        bio=profile_full.bio,
        resume_url=profile_full.resume_url,
        skills=profile_full.skills,
        status=profile_full.status,
        tags=[MentorTagResponse(id=tag.id, tag_name=tag.tag_name) for tag in profile_full.tags]
    )

# ---- Загрузка резюме (PDF) ----
@router.post("/profile/resume")
async def upload_resume(
    *,
    db: AsyncSession = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Загрузить резюме ментора (только PDF, макс 10MB)"""
    if current_user.role != RoleEnum.MENTOR:
        raise HTTPException(status_code=403, detail="Только для менторов")
    
    # Валидация файла
    content = await FileValidator.validate_pdf(file)
    
    # Генерация имени и сохранение
    filename = FileValidator.generate_filename(current_user.id)
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(content)
    
    # Обновление профиля
    resume_url = f"/uploads/resumes/{filename}"
    profile = await crud_mentor.update_mentor_profile_full(
        db,
        user_id=current_user.id,
        obj_in=MentorProfileUpdate(resume_url=resume_url)
    )
    
    return {
        "resume_url": resume_url,
        "filename": filename,
        "size_bytes": len(content),
        "message": "Резюме успешно загружено"
    }

# ---- Скачивание резюме (PDF) ----
@router.get("/profile/{user_id}/resume")
async def download_resume(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Скачать резюме ментора"""
    profile = await crud_mentor.get_mentor_profile(db, user_id)
    if not profile or not profile.resume_url:
        raise HTTPException(status_code=404, detail="Резюме не найдено")
    
    # Извлечь имя файла из URL
    filename = profile.resume_url.replace("/uploads/resumes/", "")
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=f"resume_{user_id}.pdf"
    )


# ---- Слоты ----
@router.post("/slots", response_model=MentorSlotResponse)
async def create_slot(
    *,
    db: AsyncSession = Depends(deps.get_db),
    slot_in: MentorSlotCreate,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    if current_user.role != RoleEnum.MENTOR:
        raise HTTPException(status_code=403, detail="Только для менторов")
    
    slot = await crud_mentor.create_mentor_slot(db, mentor_id=current_user.id, obj_in=slot_in)
    if not slot:
        raise HTTPException(status_code=400, detail="Слот пересекается с существующим")
    return slot

@router.get("/slots/available", response_model=List[MentorSlotResponse])
async def get_available_slots(
    mentor_id: int = None,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    slots = await crud_mentor.get_available_slots(db, mentor_id)
    
    # Добавляем имена менторов
    result = []
    for slot in slots:
        mentor_profile = await crud_mentor.get_mentor_profile(db, slot.mentor_id)
        mentor = await crud_user.get_user_by_id(db, slot.mentor_id)
        slot_data = MentorSlotResponse.model_validate(slot)
        slot_data.mentor_name = mentor.email if mentor else None
        result.append(slot_data)
    
    return result

@router.get("/my-slots", response_model=List[MentorSlotResponse])
async def get_my_slots(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    if current_user.role != RoleEnum.MENTOR:
        raise HTTPException(status_code=403, detail="Только для менторов")
    
    slots = await crud_mentor.get_mentor_slots(db, current_user.id)
    return slots

# ---- Запросы на встречу ----
@router.post("/request-meeting", response_model=dict)
async def request_meeting(
    *,
    db: AsyncSession = Depends(deps.get_db),
    request_in: MentorMeetingRequest,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Студент запрашивает встречу с ментором"""
    # Проверяем, что ментор существует и одобрен
    mentor_profile = await crud_mentor.get_mentor_profile(db, user_id=request_in.mentor_id)
    if not mentor_profile or mentor_profile.status != ApplicationStatusEnum.APPROVED:
        raise HTTPException(status_code=404, detail="Ментор не найден или не одобрен")
    
    # Создаём запрос
    meeting_request = await crud_mentor.create_mentor_request(
        db,
        student_id=current_user.id,
        mentor_id=request_in.mentor_id,
        slot_id=request_in.slot_id,
        message=request_in.message
    )
    
    if not meeting_request:
        raise HTTPException(status_code=400, detail="Слот недоступен или уже забронирован")
    
    # TODO: Отправить уведомление ментору через Telegram
    return {"status": "request_sent", "request_id": meeting_request.id}

@router.get("/requests/incoming", response_model=List[MentorRequestResponse])
async def get_incoming_requests(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Ментор получает входящие запросы"""
    if current_user.role != RoleEnum.MENTOR:
        raise HTTPException(status_code=403, detail="Только для менторов")
    
    requests = await crud_mentor.get_mentor_requests(db, current_user.id)
    
    # Обогащаем данными
    result = []
    for req in requests:
        student = await crud_user.get_user_by_id(db, req.student_id)
        req_data = MentorRequestResponse.model_validate(req)
        req_data.student_name = student.email if student else None
        req_data.slot_start = req.slot.start_at if req.slot else None
        req_data.slot_end = req.slot.end_at if req.slot else None
        result.append(req_data)
    
    return result

@router.get("/requests/my", response_model=List[MentorRequestResponse])
async def get_my_requests(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Студент получает свои запросы"""
    requests = await crud_mentor.get_student_requests(db, current_user.id)
    
    result = []
    for req in requests:
        mentor = await crud_user.get_user_by_id(db, req.mentor_id)
        req_data = MentorRequestResponse.model_validate(req)
        req_data.student_name = mentor.email if mentor else None
        req_data.slot_start = req.slot.start_at if req.slot else None
        req_data.slot_end = req.slot.end_at if req.slot else None
        result.append(req_data)
    
    return result

@router.put("/requests/{request_id}", response_model=MentorRequestResponse)
async def update_request_status(
    *,
    request_id: int,
    db: AsyncSession = Depends(deps.get_db),
    status_in: MentorRequestUpdate,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Ментор принимает или отклоняет запрос"""
    if current_user.role != RoleEnum.MENTOR:
        raise HTTPException(status_code=403, detail="Только для менторов")
    
    request_obj = await crud_mentor.update_mentor_request_status(
        db, request_id, current_user.id, status_in.status
    )
    
    if not request_obj:
        raise HTTPException(status_code=404, detail="Запрос не найден")
    
    # TODO: Отправить уведомление студенту через Telegram
    return request_obj

# ---- Поиск менторов ----
@router.post("/search", response_model=dict)
async def search_mentors(
    request: MentorSearchRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Поиск ментора по тегам через RAG"""
    tags = request.query.lower().split()
    mentors = await crud_mentor.search_mentors_by_tags(db, tags)
    
    result = []
    for mentor in mentors[:5]:
        profile = await crud_mentor.get_mentor_profile_full(db, mentor.user_id)
        if profile:
            result.append(_profile_to_response(profile))
    
    return {
        "query": request.query,
        "mentors": result
    }

# ---- Бронирование групповой комнаты ментором ----
@router.post("/book-room")
async def book_room_as_mentor(
    *,
    db: AsyncSession = Depends(deps.get_db),
    room_id: int,
    start_at: datetime,
    end_at: datetime,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Ментор может забронировать групповую комнату без подтверждения админа"""
    if current_user.role != RoleEnum.MENTOR:
        raise HTTPException(status_code=403, detail="Только для менторов")
    
    # Проверяем, что комната существует и группового типа
    from app.crud import crud_hub
    room = await crud_hub.get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    
    if room.type != "GROUP":
        raise HTTPException(status_code=400, detail="Только групповые комнаты")
    
    # Создаём бронирование со статусом APPROVED сразу
    from app.crud import crud_booking
    booking = await crud_booking.create_booking_with_status(
        db, 
        user_id=current_user.id,
        room_id=room_id,
        start_at=start_at,
        end_at=end_at,
        status="APPROVED"  # Ментору не нужно подтверждение
    )
    
    return {"status": "booked", "booking": booking}