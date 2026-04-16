from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import User, RoleEnum
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    stmt = select(User).where(User.email == email)
    return await db.scalar(stmt)

async def create_user(db: AsyncSession, obj_in: UserCreate) -> User:
    db_obj = User(
        email=obj_in.email,
        hashed_password=get_password_hash(obj_in.password),
        role=RoleEnum.STUDENT,  # Всегда регистрируем как студента
        tg_username=obj_in.tg_username
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def set_user_role(db: AsyncSession, user_id: int, role: RoleEnum) -> Optional[User]:
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        return None
    user.role = role
    await db.commit()
    await db.refresh(user)
    return user
