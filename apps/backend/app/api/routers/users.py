from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel

from app.db import models, session, schemas
from app.api import deps
from uuid import UUID, uuid4

class UserUpdate(BaseModel):
    password: Optional[str] = None


router = APIRouter(
    prefix="/users",
    tags = ["users"]
)


@router.get("/", response_model=List[models.User])
async def list_users(db: AsyncSession = Depends(deps.get_db)):
    result = db.execute(select(models.User))
    return result.scalars().all()


@router.get("/{user_id}", response_model=models.User)
async def get_user(user_id: str, db: AsyncSession = Depends(deps.get_db)):
    try:
        user_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str, db: AsyncSession = Depends(deps.get_db)):
    try:
        user_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code = 400, detail = "Invalid user ID format")

    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code = 404, detail = "User ID not found")

    await db.delete(user)
    await db.commit()
    return

# fe: usercreate -> be -> be: userOut -> db
@router.post("/", response_model = schemas.UserOut, status_code = status.HTTP_201_CREATED)
async def create_user(user_in: schemas.UserCreate, db: AsyncSession = Depends(deps.get_db)):
    new_user = models.user(
        id = str(uuid4()),
        email = user_in.email,
        name = user_in.name,
        password = user_in.password,
        username = user_in.username
    )

    await db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.patch("/{user_id}", status_code = 204)
async def patch_user(user_id: str, data: UserUpdate, db: AsyncSession = Depends(deps.get_db)):
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code= 400, detail = "User ID must be UUID")

    res = await db.execute(select(models.User).where(models.User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code = 404, detail = "User not found")

    if data.password != None:
        user.hashed_password = data.password

    await db.commit()
    return


# get user Friends


# # get user fav washrooms
# @router.get("/{user_id}/favorites", response_model = List[models.Washroom])
# def get_user_favorites(user_id: str, db: AsyncSession = Depends(deps.get_db)):
#     try:
#         user_id = UUID(user_id)
#     except ValueError:
#         raise HTTPException(status_code = 400, detail = "Invalid user ID format")

#     result = await db.execute(select(models.Washroom).where())






