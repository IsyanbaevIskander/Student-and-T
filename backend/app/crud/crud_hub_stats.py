# app/crud/crud_hub_stats.py
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from collections import defaultdict

from app.db.models import Booking, BookingTypeEnum, BookingStatusEnum, Hub, EventTypeEnum, Room
from app.schemas.stats import HubStatsRequest, HubStatsResponse


async def get_hub_stats(
    db: AsyncSession,
    request: HubStatsRequest
) -> HubStatsResponse:
    """Получить детальную статистику — возвращает Pydantic HubStatsResponse"""
    
    hub_ids = request.hub_ids or []
    date_from = request.date_from
    date_to = request.date_to
    
    # Базовый запрос к бронированиям
    stmt = select(Booking).where(
        Booking.start_at >= date_from,
        Booking.end_at <= date_to
    )
    if hub_ids:
        stmt = stmt.where(Booking.hub_id.in_(hub_ids))
    
    result = await db.execute(stmt)
    bookings = list(result.scalars().all())
    
    # ========== 1. Основные метрики ==========
    total_bookings = len(bookings)
    unique_users = len(set(b.user_id for b in bookings if b.user_id))
    
    # Средняя заполняемость (упрощённо: % подтверждённых броней)
    approved = sum(1 for b in bookings if b.status == BookingStatusEnum.APPROVED)
    avg_occupancy = (approved / total_bookings * 100) if total_bookings > 0 else 0.0
    
    # ========== 2. Группировка по периоду ==========
    bookings_by_period: Dict[str, int] = defaultdict(int)
    peak_hours: Dict[int, int] = defaultdict(int)
    peak_days: Dict[str, int] = defaultdict(int)  # 0=Mon, 6=Sun
    
    for b in bookings:
        # Группировка по дню/неделе/месяцу
        if request.group_by == "day":
            key = b.start_at.date().isoformat()
        elif request.group_by == "week":
            key = f"{b.start_at.isocalendar()[0]}-W{b.start_at.isocalendar()[1]:02d}"
        else:  # month
            key = b.start_at.strftime("%Y-%m")
        bookings_by_period[key] += 1
        
        # Час пик
        peak_hours[b.start_at.hour] += 1
        
        # День недели пик
        peak_days[str(b.start_at.weekday())] += 1
    
    # ========== 3. Типы бронирований ==========
    individual_vs_group: Dict[str, Any] = defaultdict(int)
    for b in bookings:
        btype = b.booking_type.value if hasattr(b.booking_type, 'value') else str(b.booking_type)
        individual_vs_group[btype] += 1
    
    # ========== 4. Мероприятия ==========
    events = [b for b in bookings if b.booking_type == BookingTypeEnum.EVENT]
    total_events = len(events)
    
    # Среднее количество участников (упрощённо: по вместимости комнат)
    attendees = []
    for b in events:
        if b.room_id:
            room = await db.get(Room, b.room_id)
            if room and room.capacity:
                attendees.append(room.capacity)
    avg_attendees = sum(attendees) / len(attendees) if attendees else 0.0
    
    # Мероприятия по типу
    events_by_type: Dict[str, int] = defaultdict(int)
    for b in events:
        etype = b.event_type.value if hasattr(b.event_type, 'value') else str(b.event_type)
        events_by_type[etype] += 1
    
    # ========== 5. Сравнение с прошлым периодом ==========
    period_days = (date_to - date_from).days
    prev_from = date_from - timedelta(days=period_days)
    prev_to = date_from
    
    prev_stmt = select(func.count(Booking.id)).where(
        Booking.start_at >= prev_from,
        Booking.start_at < prev_to
    )
    if hub_ids:
        prev_stmt = prev_stmt.where(Booking.hub_id.in_(hub_ids))
    
    prev_result = await db.execute(prev_stmt)
    prev_count = prev_result.scalar() or 0
    
    bookings_change = ((total_bookings - prev_count) / prev_count * 100) if prev_count > 0 else 100.0
    
    comparison = {
        "bookings_change": round(bookings_change, 1),
        "period_days": period_days
    }
    
    # ========== 🔑 ВОЗВРАЩАЕМ PYDANTIC-МОДЕЛЬ ==========
    return HubStatsResponse(
        total_bookings=total_bookings,
        unique_users=unique_users,
        avg_occupancy_percent=round(avg_occupancy, 2),
        bookings_by_period=dict(bookings_by_period),
        peak_hours=dict(peak_hours),
        peak_days=dict(peak_days),
        individual_vs_group=dict(individual_vs_group),
        total_events=total_events,
        avg_attendees_per_event=round(avg_attendees, 1),
        events_by_type=dict(events_by_type),
        comparison=comparison
    )


def _calculate_change(current: int, previous: int) -> float:
    """Рассчитать процент изменения"""
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round((current - previous) / previous * 100, 1)


async def get_hub_load_by_day(
    db: AsyncSession,
    hub_id: int,
    days: int = 30
) -> Dict[str, Any]:
    """Получить загрузку хаба по дням"""
    date_from = datetime.utcnow() - timedelta(days=days)
    
    query = select(
        func.date(Booking.start_at).label("date"),
        func.count(Booking.id).label("bookings_count")
    ).where(
        and_(
            Booking.hub_id == hub_id,
            Booking.start_at >= date_from,
            Booking.status == BookingStatusEnum.APPROVED
        )
    ).group_by(func.date(Booking.start_at))
    
    result = await db.execute(query)
    rows = result.all()
    
    return {
        "hub_id": hub_id,
        "days": days,
        "data": [{"date": str(row.date), "bookings": row.bookings_count} for row in rows]
    }