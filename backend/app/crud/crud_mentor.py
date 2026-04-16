from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import MentorProfile, MentorSlot
from app.schemas.mentor import MentorProfileUpdate, MentorSlotCreate

async def get_mentor_profile(db: AsyncSession, user_id: int) -> Optional[MentorProfile]:
    stmt = select(MentorProfile).where(MentorProfile.user_id == user_id)
    return await db.scalar(stmt)

async def update_mentor_profile(db: AsyncSession, user_id: int, obj_in: MentorProfileUpdate) -> MentorProfile:
    profile = await get_mentor_profile(db, user_id)
    if not profile:
        profile = MentorProfile(user_id=user_id)
        db.add(profile)
        
    for var, value in vars(obj_in).items():
        if value is not None:
            setattr(profile, var, value)
            
    await db.commit()
    await db.refresh(profile)
    return profile

async def create_mentor_slot(db: AsyncSession, mentor_id: int, obj_in: MentorSlotCreate) -> MentorSlot:
    db_obj = MentorSlot(
        mentor_id=mentor_id,
        start_at=obj_in.start_at,
        end_at=obj_in.end_at
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_mentor_slots(db: AsyncSession, mentor_id: int) -> List[MentorSlot]:
    stmt = select(MentorSlot).where(MentorSlot.mentor_id == mentor_id)
    res = await db.execute(stmt)
    return list(res.scalars().all())
