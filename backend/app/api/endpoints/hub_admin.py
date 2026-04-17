# app/api/v1/hub_admin.py
from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud import crud_hub_admin, crud_hub, crud_user, crud_booking, crud_hub_stats
from app.db.models import RoleEnum, BookingStatusEnum, BookingTypeEnum, Booking
from app.schemas.hub_admin import (
    HubAdminResponse, AssignHubAdminRequest, HubAdminWithDetailsResponse
)
from app.schemas.hub import HubResponse, HubCreate, RoomCreate, RoomResponse
from app.schemas.booking import BookingResponse, BookingStatusUpdate
from app.schemas.stats import HubStatsRequest, HubStatsResponse, SimpleStatsResponse
from app.schemas.user import UserResponse

router = APIRouter()


# ==================== Управление администраторами хаба ====================

@router.post("/assign", response_model=HubAdminResponse)
async def assign_hub_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    request: AssignHubAdminRequest,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Назначить пользователя администратором хаба (только для глобального админа)"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для глобальных администраторов")
    
    # Проверяем существование пользователя
    user = await crud_user.get_user_by_id(db, request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Проверяем существование хаба
    hub = await crud_hub.get_hub_by_id(db, request.hub_id)
    if not hub:
        raise HTTPException(status_code=404, detail="Хаб не найден")
    
    # Назначаем администратора
    hub_admin = await crud_hub_admin.add_hub_admin(db, request.user_id, request.hub_id)
    
    return hub_admin


@router.delete("/remove")
async def remove_hub_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_id: int = Query(...),
    hub_id: int = Query(...),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Удалить администратора хаба (только для глобального админа)"""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Только для глобальных администраторов")
    
    # Проверяем существование связи
    is_admin = await crud_hub_admin.is_hub_admin(db, user_id, hub_id)
    if not is_admin:
        raise HTTPException(status_code=404, detail="Пользователь не является администратором этого хаба")
    
    # Удаляем
    removed = await crud_hub_admin.remove_hub_admin(db, user_id, hub_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Не удалось удалить администратора")
    
    return {"message": f"Пользователь {user_id} больше не администратор хаба {hub_id}"}


@router.get("/my-hubs", response_model=List[HubResponse])
async def get_my_hubs(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Получить хабы, где текущий пользователь является администратором"""
    hubs = await crud_hub_admin.get_user_hubs_as_admin(db, current_user.id)
    return hubs


@router.get("/hubs/{hub_id}/admins", response_model=List[UserResponse])
async def get_hub_admins(
    hub_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Получить всех администраторов хаба"""
    # Проверяем права доступа
    can_manage = await crud_hub_admin.can_manage_hub(db, current_user.id, hub_id)
    if not can_manage and current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Нет доступа к этому хабу")
    
    admins = await crud_hub_admin.get_hub_admins(db, hub_id)
    return admins


# ==================== Управление хабом ====================

@router.put("/hubs/{hub_id}", response_model=HubResponse)
async def update_hub_info(
    hub_id: int,
    hub_in: HubCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Обновить информацию о хабе (только для администраторов хаба)"""
    # Проверяем права
    can_manage = await crud_hub_admin.can_manage_hub(db, current_user.id, hub_id)
    if not can_manage:
        raise HTTPException(status_code=403, detail="У вас нет прав на управление этим хабом")
    
    hub = await crud_hub.update_hub(db, hub_id, hub_in)
    if not hub:
        raise HTTPException(status_code=404, detail="Хаб не найден")
    
    return hub


@router.post("/hubs/{hub_id}/rooms", response_model=RoomResponse)
async def add_room(
    hub_id: int,
    room_in: RoomCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Добавить комнату в хаб"""
    # Проверяем права
    can_manage = await crud_hub_admin.can_manage_hub(db, current_user.id, hub_id)
    if not can_manage:
        raise HTTPException(status_code=403, detail="У вас нет прав на управление этим хабом")
    
    room = await crud_hub.create_room_with_seats(db, hub_id, room_in)
    room.seats = await crud_hub.get_room_seats(db, room.id)
    
    return room


@router.delete("/hubs/{hub_id}/rooms/{room_id}")
async def delete_room(
    hub_id: int,
    room_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Удалить комнату из хаба"""
    # Проверяем права
    can_manage = await crud_hub_admin.can_manage_hub(db, current_user.id, hub_id)
    if not can_manage:
        raise HTTPException(status_code=403, detail="У вас нет прав на управление этим хабом")
    
    # Проверяем, что комната принадлежит хабу
    room = await crud_hub.get_room_by_id(db, room_id)
    if not room or room.hub_id != hub_id:
        raise HTTPException(status_code=404, detail="Комната не найдена в этом хабе")
    
    # Удаляем комнату (каскадно удалятся места)
    await db.delete(room)
    await db.commit()
    
    return {"message": f"Комната {room_id} удалена"}


# ==================== Управление бронированиями ====================

@router.get("/hubs/{hub_id}/bookings", response_model=List[BookingResponse])
async def get_hub_bookings(
    hub_id: int,
    status: Optional[BookingStatusEnum] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Получить все бронирования хаба"""
    # Проверяем права
    can_manage = await crud_hub_admin.can_manage_hub(db, current_user.id, hub_id)
    if not can_manage:
        raise HTTPException(status_code=403, detail="Нет доступа к этому хабу")
    
    # Получаем все бронирования хаба
    from sqlalchemy import select
    stmt = select(Booking).where(Booking.hub_id == hub_id)
    if status:
        stmt = stmt.where(Booking.status == status)
    
    result = await db.execute(stmt)
    bookings = list(result.scalars().all())
    
    return [BookingResponse.model_validate(b) for b in bookings]


@router.put("/bookings/{booking_id}/approve", response_model=BookingResponse)
async def approve_booking(
    booking_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Подтвердить бронирование (только для администраторов хаба)"""
    # Получаем бронирование
    booking = await crud_booking.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    
    # Проверяем права на хаб
    if booking.hub_id:
        can_manage = await crud_hub_admin.can_manage_hub(db, current_user.id, booking.hub_id)
        if not can_manage:
            raise HTTPException(status_code=403, detail="Нет прав на подтверждение этого бронирования")
    
    # Подтверждаем
    from app.schemas.booking import BookingStatusUpdate
    status_update = BookingStatusUpdate(status=BookingStatusEnum.APPROVED)
    updated_booking = await crud_booking.update_booking_status(db, booking_id, status_update)
    
    return updated_booking


@router.put("/bookings/{booking_id}/reject", response_model=BookingResponse)
async def reject_booking(
    booking_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Отклонить бронирование (только для администраторов хаба)"""
    # Получаем бронирование
    booking = await crud_booking.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    
    # Проверяем права на хаб
    if booking.hub_id:
        can_manage = await crud_hub_admin.can_manage_hub(db, current_user.id, booking.hub_id)
        if not can_manage:
            raise HTTPException(status_code=403, detail="Нет прав на отклонение этого бронирования")
    
    # Отклоняем
    from app.schemas.booking import BookingStatusUpdate
    status_update = BookingStatusUpdate(status=BookingStatusEnum.REJECTED)
    updated_booking = await crud_booking.update_booking_status(db, booking_id, status_update)
    
    return updated_booking


# ==================== Статистика ====================

@router.post("/stats", response_model=HubStatsResponse)
async def get_hub_stats(
    request: HubStatsRequest,  # Используем правильную Pydantic модель
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Получить детальную статистику по хабам"""
    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.HUB_ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    try:
        # Если пользователь HUB_ADMIN, ограничиваем только его хабами
        if current_user.role == RoleEnum.HUB_ADMIN:
            user_hubs = await crud_hub_admin.get_user_hubs_as_admin(db, current_user.id)
            user_hub_ids = [h.id for h in user_hubs]
            
            # Если в запросе указаны хабы, проверяем права
            if request.hub_ids:
                for hub_id in request.hub_ids:
                    if hub_id not in user_hub_ids:
                        raise HTTPException(
                            status_code=403, 
                            detail=f"Нет доступа к хабу {hub_id}"
                    )
            else:
                # Если хабы не указаны, показываем только доступные
                request.hub_ids = user_hub_ids
        
        # Получаем статистику
        stats = await crud_hub_stats.get_hub_stats(db, request)
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Stats error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка получения статистики: {str(e)}")


@router.get("/stats/simple", response_model=SimpleStatsResponse)
async def get_simple_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Получить простую статистику для дашборда"""
    from app.crud import crud_user
    
    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.HUB_ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    
    # Общее количество хабов
    hubs = await crud_hub.get_hubs(db)
    total_hubs = len(hubs)
    
    # Количество менторов и студентов
    mentors = await crud_user.get_users_by_role(db, RoleEnum.MENTOR)
    students = await crud_user.get_users_by_role(db, RoleEnum.STUDENT)
    
    # Бронирования сегодня
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    from sqlalchemy import select
    stmt = select(Booking).where(Booking.start_at >= today_start)
    result = await db.execute(stmt)
    today_bookings = len(list(result.scalars().all()))
    
    # Ожидающие подтверждения
    pending = await crud_booking.get_pending_bookings(db)
    
    return SimpleStatsResponse(
        total_hubs=total_hubs,
        total_mentors=len(mentors),
        total_students=len(students),
        total_bookings_today=today_bookings,
        pending_approvals=len(pending)
    )


# ==================== Бронирование без подтверждения ====================

@router.post("/book-room-immediate")
async def book_room_immediate(
    *,
    db: AsyncSession = Depends(deps.get_db),
    room_id: int,
    start_at: datetime,
    end_at: datetime,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Администратор хаба может забронировать комнату без подтверждения"""
    # Получаем комнату
    room = await crud_hub.get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    
    # Проверяем права на хаб
    can_manage = await crud_hub_admin.can_manage_hub(db, current_user.id, room.hub_id)
    if not can_manage:
        raise HTTPException(status_code=403, detail="Нет прав на бронирование в этом хабе")
    
    # Создаём бронирование со статусом APPROVED
    booking = await crud_booking.create_booking_with_status(
        db,
        user_id=current_user.id,
        room_id=room_id,
        start_at=start_at,
        end_at=end_at,
        status="APPROVED"
    )
    
    booking_schema = BookingResponse.model_validate(booking)
    return {"message": "Комната забронирована", "booking": booking_schema}