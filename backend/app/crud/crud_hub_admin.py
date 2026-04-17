# app/crud/crud_hub_admin.py
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from sqlalchemy.orm import selectinload

from app.db.models import HubAdmin, User, Hub, RoleEnum
from app.schemas.hub_admin import HubAdminCreate, HubAdminResponse


async def add_hub_admin(
    db: AsyncSession, 
    user_id: int, 
    hub_id: int
) -> HubAdmin:
    """Назначить пользователя администратором хаба"""
    # Проверяем, не существует ли уже такая связь
    stmt = select(HubAdmin).where(
        and_(
            HubAdmin.user_id == user_id,
            HubAdmin.hub_id == hub_id
        )
    )
    existing = await db.scalar(stmt)
    if existing:
        return existing
    
    # Создаем связь
    hub_admin = HubAdmin(
        user_id=user_id,
        hub_id=hub_id
    )
    db.add(hub_admin)
    
    # Если пользователь еще не HUB_ADMIN, меняем ему роль
    stmt = select(User).where(User.id == user_id)
    user = await db.scalar(stmt)
    if user and user.role != RoleEnum.HUB_ADMIN and user.role != RoleEnum.ADMIN:
        user.role = RoleEnum.HUB_ADMIN
        db.add(user)
    
    await db.commit()
    await db.refresh(hub_admin)
    return hub_admin


async def remove_hub_admin(
    db: AsyncSession, 
    user_id: int, 
    hub_id: int
) -> bool:
    """Удалить администратора хаба"""
    stmt = delete(HubAdmin).where(
        and_(
            HubAdmin.user_id == user_id,
            HubAdmin.hub_id == hub_id
        )
    )
    result = await db.execute(stmt)
    await db.commit()
    
    # Проверяем, остались ли у пользователя другие хабы
    if result.rowcount > 0:
        stmt = select(HubAdmin).where(HubAdmin.user_id == user_id)
        remaining = await db.execute(stmt)
        if not remaining.scalars().first():
            # Если нет других хабов, меняем роль обратно на STUDENT
            stmt = select(User).where(User.id == user_id)
            user = await db.scalar(stmt)
            if user and user.role == RoleEnum.HUB_ADMIN:
                user.role = RoleEnum.STUDENT
                db.add(user)
                await db.commit()
    
    return result.rowcount > 0


async def get_user_hubs_as_admin(
    db: AsyncSession, 
    user_id: int
) -> List[Hub]:
    """Получить все хабы, где пользователь является администратором"""
    # Для глобального админа возвращаем все хабы
    stmt = select(User).where(User.id == user_id)
    user = await db.scalar(stmt)
    
    if user and user.role == RoleEnum.ADMIN:
        stmt = select(Hub)
        result = await db.execute(stmt)
        return list(result.scalars().all())
    
    # Для обычных администраторов хаба
    stmt = select(Hub).join(
        HubAdmin, HubAdmin.hub_id == Hub.id
    ).where(HubAdmin.user_id == user_id)
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_hub_admins(
    db: AsyncSession, 
    hub_id: int
) -> List[User]:
    """Получить всех администраторов хаба"""
    stmt = select(User).join(
        HubAdmin, HubAdmin.user_id == User.id
    ).where(HubAdmin.hub_id == hub_id)
    
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def is_hub_admin(
    db: AsyncSession, 
    user_id: int, 
    hub_id: int
) -> bool:
    """Проверить, является ли пользователь администратором хаба"""
    # Глобальный админ может всё
    stmt = select(User).where(User.id == user_id)
    user = await db.scalar(stmt)
    if user and user.role == RoleEnum.ADMIN:
        return True
    
    # Проверяем связь
    stmt = select(HubAdmin).where(
        and_(
            HubAdmin.user_id == user_id,
            HubAdmin.hub_id == hub_id
        )
    )
    result = await db.scalar(stmt)
    return result is not None


async def can_manage_hub(
    db: AsyncSession, 
    user_id: int, 
    hub_id: int
) -> bool:
    """Проверить, может ли пользователь управлять хабом"""
    return await is_hub_admin(db, user_id, hub_id)


async def get_all_hub_admins(db: AsyncSession) -> List[HubAdmin]:
    """Получить все связи админов с хабами"""
    stmt = select(HubAdmin).options(
        selectinload(HubAdmin.user),
        selectinload(HubAdmin.hub)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())