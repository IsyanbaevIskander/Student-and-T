from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud import crud_user, crud_mentor, crud_hub
from app.db.models import RoleEnum, ApplicationStatusEnum, MentorRequestStatusEnum
from app.schemas.user import UserResponse
from app.schemas.mentor import MentorProfileResponse, MentorRequestResponse
from app.schemas.hub import HubCreate, HubResponse

router = APIRouter()


# ==================== Управление пользователями ====================

@router.get("/users", response_model=list[UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(deps.get_db),
    role: RoleEnum = None,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: получить всех пользователей (опционально фильтр по роли)"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    if role:
        users = await crud_user.get_users_by_role(db, role)
    else:
        users = await crud_user.get_all_users(db)
    
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: получить пользователя по ID"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    user = await crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.put("/users/{user_id}/role", response_model=UserResponse)
async def change_user_role(
    user_id: int,
    role: RoleEnum,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: изменить роль пользователя"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    if user_id == current_user.id and role != RoleEnum.ADMIN:
        raise HTTPException(status_code=400, detail="Нельзя изменить свою роль")
    
    user = await crud_user.set_user_role(db, user_id, role)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: удалить пользователя"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
    
    deleted = await crud_user.delete_user_by_id(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    return {"message": f"Пользователь {user_id} удален"}


# ==================== Управление менторами ====================

@router.get("/mentors", response_model=list[MentorProfileResponse])
async def get_all_mentors(
    db: AsyncSession = Depends(deps.get_db),
    status: ApplicationStatusEnum = None,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: получить всех менторов (опционально по статусу)"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    mentors = await crud_mentor.get_all_mentor_profiles(db, status)
    return mentors


@router.get("/mentor-applications", response_model=list[MentorProfileResponse])
async def get_pending_applications(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: получить все ожидающие заявки на менторство"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    applications = await crud_mentor.get_pending_applications(db)
    return applications


@router.put("/mentor-applications/{user_id}/approve", response_model=MentorProfileResponse)
async def approve_mentor_application(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: одобрить заявку на менторство"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    # Обновляем статус в профиле
    profile = await crud_mentor.update_application_status(db, user_id, ApplicationStatusEnum.APPROVED)
    if not profile:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    # Меняем роль пользователя
    user = await crud_user.set_user_role(db, user_id, RoleEnum.MENTOR)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Получаем полный профиль для ответа
    profile_full = await crud_mentor.get_mentor_profile_full(db, user_id)
    
    # Явное преобразование в Pydantic модель
    from app.schemas.mentor import MentorTagResponse
    return MentorProfileResponse(
        user_id=profile_full.user_id,
        hub_id=profile_full.hub_id,
        bio=profile_full.bio,
        resume_url=profile_full.resume_url,
        skills=profile_full.skills,
        status=profile_full.status,
        tags=[MentorTagResponse(id=tag.id, tag_name=tag.tag_name) for tag in (profile_full.tags or [])]
    )


@router.put("/mentor-applications/{user_id}/reject", response_model=MentorProfileResponse)
async def reject_mentor_application(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: отклонить заявку на менторство"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    profile = await crud_mentor.update_application_status(db, user_id, ApplicationStatusEnum.REJECTED)
    if not profile:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return profile


@router.delete("/mentors/{user_id}")
async def delete_mentor(
    user_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: удалить ментора"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    # Сначала меняем роль на STUDENT
    await crud_user.set_user_role(db, user_id, RoleEnum.STUDENT)
    
    # Удаляем профиль ментора
    deleted = await crud_mentor.delete_mentor_profile(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Профиль ментора не найден")
    
    return {"message": f"Ментор {user_id} удален"}


# ==================== Управление запросами на встречи ====================

@router.get("/mentor-requests", response_model=list[MentorRequestResponse])
async def get_all_mentor_requests(
    db: AsyncSession = Depends(deps.get_db),
    status: MentorRequestStatusEnum = None,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: получить все запросы на встречи"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    requests = await crud_mentor.get_all_mentor_requests(db, status)
    
    # Обогащаем данными
    result = []
    for req in requests:
        req_data = MentorRequestResponse.model_validate(req)
        req_data.student_name = req.student.email if req.student else None
        req_data.student_email = req.student.email if req.student else None
        req_data.slot_start = req.slot.start_at if req.slot else None
        req_data.slot_end = req.slot.end_at if req.slot else None
        result.append(req_data)
    
    return result


# ==================== Управление хабами ====================

@router.post("/hubs", response_model=HubResponse)
async def create_hub_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    hub_in: HubCreate,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: создать хаб"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    hub = await crud_hub.create_hub(db, obj_in=hub_in)
    return hub


@router.put("/hubs/{hub_id}", response_model=HubResponse)
async def update_hub(
    hub_id: int,
    hub_in: HubCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: обновить хаб"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    hub = await crud_hub.update_hub(db, hub_id, hub_in)
    if not hub:
        raise HTTPException(status_code=404, detail="Хаб не найден")
    return hub


@router.delete("/hubs/{hub_id}")
async def delete_hub(
    hub_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: удалить хаб"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    deleted = await crud_hub.delete_hub(db, hub_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Хаб не найден")
    
    return {"message": f"Хаб {hub_id} удален"}


# ==================== Статистика ====================

@router.get("/stats")
async def get_statistics(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Админ: получить статистику"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    users = await crud_user.get_all_users(db)
    mentors = await crud_user.get_users_by_role(db, RoleEnum.MENTOR)
    students = await crud_user.get_users_by_role(db, RoleEnum.STUDENT)
    pending_applications = await crud_mentor.get_pending_applications(db)
    
    return {
        "total_users": len(users),
        "students": len(students),
        "mentors": len(mentors),
        "pending_mentor_applications": len(pending_applications),
    }


# ==================== Тестовые данные ====================

@router.post("/test-data")
async def create_test_data(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Создать тестовые данные (только для разработки)"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для администраторов")
    
    # Создаем хаб если нет
    hubs = await crud_hub.get_hubs(db)
    if not hubs:
        from app.schemas.hub import HubCreate
        test_hub = HubCreate(
            name="Тестовый Хаб",
            location="Москва, ул. Примерная, д.1",
            info="Хаб для тестирования менторов"
        )
        hub = await crud_hub.create_hub(db, obj_in=test_hub)
        hub_id = hub.id
    else:
        hub_id = hubs[0].id
    
    return {
        "message": "Тестовые данные созданы",
        "hub_id": hub_id
    }