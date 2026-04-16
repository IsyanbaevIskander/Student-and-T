from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import auth, hubs, bookings, mentors

app = FastAPI(
    title="Student and T",
    description="API for Hub interaction platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(hubs.router, prefix="/hubs", tags=["hubs"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(mentors.router, prefix="/mentors", tags=["mentors"])

app.include_router(api_router)

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
