from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.crud import crud_booking
from app.schemas.booking import BookingCreate, BookingResponse, BookingStatusUpdate

router = APIRouter()

@router.post("/", response_model=List[BookingResponse])
async def create_booking(
    *,
    db: AsyncSession = Depends(deps.get_db),
    booking_in: BookingCreate,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    if not booking_in.seat_ids and not booking_in.room_id and not booking_in.hub_id:
        raise HTTPException(status_code=400, detail="Must provide seat_ids, room_id or hub_id")
        
    try:
        bookings = await crud_booking.create_booking(db, obj_in=booking_in, user_id=current_user.id)
        return bookings
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"CRITICAL ERROR in create_booking: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my", response_model=List[BookingResponse])
async def read_my_bookings(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    bookings = await crud_booking.get_user_bookings(db, user_id=current_user.id)
    return bookings

@router.get("/all", response_model=List[BookingResponse])
async def read_all_bookings(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_admin_user)
) -> Any:
    bookings = await crud_booking.get_all_bookings(db)
    return bookings

@router.put("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(
    *,
    booking_id: int,
    db: AsyncSession = Depends(deps.get_db),
    status_in: BookingStatusUpdate,
    current_admin = Depends(deps.get_current_admin_user)
) -> Any:
    booking = await crud_booking.update_booking_status(db, booking_id=booking_id, obj_in=status_in)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.post("/{booking_id}/check-in", response_model=BookingResponse)
async def check_in_booking(
    *,
    booking_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    booking = await crud_booking.check_in_booking(db, booking_id=booking_id, user_id=current_user.id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not owned by user")
    return booking
