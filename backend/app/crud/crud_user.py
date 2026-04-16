from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.db.models import User, RoleEnum, MentorProfile
from app.schemas.user import UserCreate
from app.core.security import get_password_hash


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Получить пользователя по email"""
    stmt = select(User).where(User.email == email)
    return await db.scalar(stmt)


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """Получить пользователя по ID"""
    stmt = select(User).where(User.id == user_id)
    return await db.scalar(stmt)


async def get_all_users(db: AsyncSession) -> list[User]:
    """Получить всех пользователей"""
    stmt = select(User).order_by(User.id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_user(db: AsyncSession, obj_in: UserCreate) -> User:
    """Создать пользователя"""
    db_obj = User(
        email=obj_in.email,
        hashed_password=get_password_hash(obj_in.password),
        role=RoleEnum.STUDENT,
        tg_username=obj_in.tg_username
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def set_user_role(db: AsyncSession, user_id: int, role: RoleEnum) -> Optional[User]:
    """Изменить роль пользователя"""
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    user.role = role
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user_by_id(db: AsyncSession, user_id: int) -> bool:
    """Удалить пользователя"""
    stmt = delete(User).where(User.id == user_id)
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0


async def get_users_by_role(db: AsyncSession, role: RoleEnum) -> list[User]:
    """Получить пользователей по роли"""
    stmt = select(User).where(User.role == role)
    result = await db.execute(stmt)
    return list(result.scalars().all())