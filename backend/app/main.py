from contextlib import asynccontextmanager
import logging
import sys
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Настройка логирования для вывода в консоль Docker
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger(__name__)

from app.api.endpoints import auth, hubs, bookings, mentors, admin, events
from app.db.base import Base
from app.db.session import engine
# Импортируем модели, чтобы они зарегистрировались в метаданных Base
import app.db.models as _models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Инициализация БД
    logger.info("Starting database initialization...")
    try:
        async with engine.begin() as conn:
            # Создаем таблицы, если их нет
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    
    yield

app = FastAPI(
    title="Student and T",
    description="API for Hub interaction platform",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # В продакшене ограничить до конкретных доменов
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="/backend/uploads"), name="uploads")

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(hubs.router, prefix="/hubs", tags=["hubs"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(mentors.router, prefix="/mentors", tags=["mentors"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(events.router, prefix="/events", tags=["events"])

app.include_router(api_router)

@app.get("/api/v1/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
