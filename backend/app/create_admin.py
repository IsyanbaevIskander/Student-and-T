import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal, engine
from app.db.models import User, RoleEnum
from app.core.security import get_password_hash
from sqlalchemy import select

async def create_admin():
    email = "admin@mail.ru"
    password = "iskander"
    
    async with AsyncSessionLocal() as db:
        # Проверяем, существует ли пользователь
        stmt = select(User).where(User.email == email)
        user = await db.scalar(stmt)
        
        if user:
            print(f"Пользователь {email} уже существует. Обновляем пароль и роль до ADMIN...")
            user.hashed_password = get_password_hash(password)
            user.role = RoleEnum.ADMIN
        else:
            print(f"Создаем нового администратора {email}...")
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                role=RoleEnum.ADMIN
            )
            db.add(user)
        
        await db.commit()
        await db.refresh(user)
        print(f"Готово! Администратор {email} успешно создан/обновлен.")

if __name__ == "__main__":
    asyncio.run(create_admin())
