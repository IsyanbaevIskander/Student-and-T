# app/api/deps.py
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt
from pydantic import ValidationError

from app.db.session import AsyncSessionLocal
from app.core.config import settings
from app.db.models import User, RoleEnum
from app.schemas.token import TokenPayload
from app.crud import crud_hub_admin

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = await db.scalar(select(User).where(User.id == int(token_data.sub)))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user

def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


# ==================== Новые зависимости для администраторов хаба ====================

async def get_current_hub_admin(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Проверяет, что пользователь - администратор хотя бы одного хаба"""
    # Глобальный админ имеет все права
    if current_user.role == RoleEnum.ADMIN:
        return current_user
    
    # Проверяем, что роль HUB_ADMIN
    if current_user.role != RoleEnum.HUB_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуются права администратора хаба"
        )
    
    # Проверяем, что есть хотя бы один хаб, которым пользователь управляет
    hubs = await crud_hub_admin.get_user_hubs_as_admin(db, current_user.id)
    if not hubs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь не является администратором ни одного хаба"
        )
    
    return current_user


async def get_hub_access_checker(
    hub_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> bool:
    """Проверяет доступ к хабу (для использования в роутах)"""
    # Глобальный админ имеет доступ ко всем хабам
    if current_user.role == RoleEnum.ADMIN:
        return True
    
    # Администратор хаба имеет доступ только к своим хабам
    if current_user.role == RoleEnum.HUB_ADMIN:
        return await crud_hub_admin.is_hub_admin(db, current_user.id, hub_id)
    
    # Обычные пользователи не имеют доступа к админским функциям
    return False


async def can_manage_hub(
    hub_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Dependency для проверки прав на управление хабом (выбрасывает 403 если нет прав)"""
    # Глобальный админ может управлять любым хабом
    if current_user.role == RoleEnum.ADMIN:
        return
    
    # Администратор хаба может управлять только своими хабами
    if current_user.role == RoleEnum.HUB_ADMIN:
        has_access = await crud_hub_admin.is_hub_admin(db, current_user.id, hub_id)
        if has_access:
            return
    
    # Нет прав
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="У вас нет прав на управление этим хабом"
    )