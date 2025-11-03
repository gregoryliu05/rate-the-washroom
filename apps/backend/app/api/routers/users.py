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


@router.get("/", response_model=List[schemas.UserOut])
async def list_users(db: AsyncSession = Depends(deps.get_db_session)):
    result = await db.execute(select(models.User))
    return result.scalars().all()


@router.get("/me", response_model=schemas.UserOut)
async def get_user(db: AsyncSession = Depends(deps.get_db_session),
                   current_user: dict = Depends(deps.get_current_user)
                   ):
    result = await db.execute(select(models.User).where(models.User.id == current_user["id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str, db: AsyncSession = Depends(deps.get_db_session)):
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
@router.post("/sync", response_model = schemas.UserOut, status_code = status.HTTP_201_CREATED)
async def create_user(user_in: schemas.UserCreate,
                      db: AsyncSession = Depends(deps.get_db_session),
                      current_user: dict = Depends(deps.get_current_user)):
    user_id = current_user["id"]
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    existing = result.scalar_one_or_none()
    if existing:
        # make updates here
        updates = user_in.model_dump(exclude_unset=True)
        for key, value in updates.items():
            setattr(existing, key ,value)
        await db.commit()
        await db.refresh(existing)
        return existing

    new_user = models.User(
        id = user_id,
        email = user_in.email,
        first_name = user_in.first_name,
        last_name = user_in.last_name,
        password = user_in.password,
        username = user_in.username
    )

    await db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.patch("/{user_id}", status_code = 204)
async def patch_user(user_id: str, data: UserUpdate, db: AsyncSession = Depends(deps.get_db_session)):
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code= 400, detail = "User ID must be UUID")

    res = await db.execute(select(models.User).where(models.User.id == user_uuid))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code = 404, detail = "User not found")

    if data.password != None:
        user.password = data.password

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






