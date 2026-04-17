from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.endpoints import auth, hubs, bookings, mentors, admin, hub_admin
from app.db.base import Base
from app.db.session import engine
from app.db.models import * # Import models to register them with Base.metadata

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="Student and T",
    description="API for Hub interaction platform",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
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
api_router.include_router(hub_admin.router, prefix="/hub-admin", tags=["hub-admin"])


app.include_router(api_router)

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
