# app/schemas/stats.py
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any, Literal


class HubStatsRequest(BaseModel):
    hub_ids: Optional[List[int]] = None  # None = все хабы
    date_from: datetime
    date_to: datetime
    group_by: Literal["day", "week", "month"] = "day"


class HubStatsResponse(BaseModel):
    # Основные метрики
    total_bookings: int
    unique_users: int
    avg_occupancy_percent: float
    
    # Загрузка
    bookings_by_period: Dict[str, int]  # {date: count}
    peak_hours: Dict[int, int]          # {hour: count}
    peak_days: Dict[str, int]           # {weekday: count}
    
    # Соотношение типов
    individual_vs_group: Dict[str, Any]  # {"INDIVIDUAL": 70, "GROUP": 30, ...}
    
    # Мероприятия
    total_events: int
    avg_attendees_per_event: float
    events_by_type: Dict[str, int]       # {EventTypeEnum: count}
    
    # Сравнение с прошлым периодом
    comparison: Dict[str, float]         # {"bookings_change": +15, ...}
    
    class Config:
        from_attributes = True


class HubLoadResponse(BaseModel):
    hub_id: int
    days: int
    data: List[Dict[str, Any]]


class SimpleStatsResponse(BaseModel):
    total_hubs: int
    total_mentors: int
    total_students: int
    total_bookings_today: int
    pending_approvals: int