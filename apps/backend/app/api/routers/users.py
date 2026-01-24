from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel

from app.core.settings import settings
from app.db import models, schemas
from app.api import deps
from uuid import UUID, uuid4

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


router = APIRouter(
    prefix="/users",
    tags = ["users"]
)


@router.get("/", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user),
):
    # Avoid exposing user enumeration in production.
    if settings.ENVIRONMENT.lower() not in {"development", "dev", "local"}:
        raise HTTPException(status_code=404, detail="Not found")

    result = db.execute(select(models.User))
    return result.scalars().all()


@router.get("/me", response_model=schemas.UserOut)
def get_user(db: Session = Depends(deps.get_db),
             current_user: dict = Depends(deps.get_current_user)
             ):
    result = db.execute(select(models.User).where(models.User.id == current_user["id"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user),
):
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    result = db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code = 404, detail = "User ID not found")

    db.delete(user)
    db.commit()
    return

# fe: usercreate -> be -> be: userOut -> db
@router.post("/sync", response_model = schemas.UserOut, status_code = status.HTTP_201_CREATED)
def create_user(user_in: schemas.UserCreate,
                db: Session = Depends(deps.get_db),
                current_user: dict = Depends(deps.get_current_user)):
    user_id = current_user["id"]
    result = db.execute(select(models.User).where(models.User.id == user_id))
    existing = result.scalar_one_or_none()
    if existing:
        # make updates here
        updates = user_in.model_dump(exclude_unset=True, exclude={"password"})
        for key, value in updates.items():
            setattr(existing, key,value)
        if existing.public_id is None:
            existing.public_id = uuid4()
        db.commit()
        db.refresh(existing)
        return existing

    new_user = models.User(
        id = user_id,
        public_id = uuid4(),
        email = user_in.email,
        first_name = user_in.first_name,
        last_name = user_in.last_name,
        # Password is managed by the identity provider (Firebase).
        password = user_id,
        username = user_in.username
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/{user_id}", status_code = 204)
def patch_user(
    user_id: str,
    data: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user),
):
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    res = db.execute(select(models.User).where(models.User.id == user_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code = 404, detail = "User not found")

    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(user, key, value)

    db.commit()
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


