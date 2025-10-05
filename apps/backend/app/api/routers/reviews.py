from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db import models, session, schemas
from app.api import deps
from uuid import UUID, uuid4


router = APIRouter(prefix="/review", tags=["reviews"])


# GET by users
@router.get("/{user_id}", response_model=List[schemas.ReviewOutByUser])
async def get_review_by_user(user_id: str, db: AsyncSession = Depends(deps.get_db)):
    try:
        user_id = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    result = await db.execute(
        select(models.Review).where(models.Review.user_id == user_id)
        )
    reviews = result.scalars().all()

    if not reviews:
        raise HTTPException(status_code = 404, detail = "No reviews for given User ID")
    return reviews


# GET by washrrom
@router.get("/washroom/{washroom_id}", response_model=List[schemas.ReviewOutByWashroom])
async def get_review_by_washroom(washroom_id: str, db: AsyncSession = Depends(deps.get_db)):
    try:
        washroom_id = UUID(washroom_id)
    except ValueError:
        raise HTTPException(status_code = 400, detail = "Invalid Washroom ID format")

    result = await db.execute(
        select(models.Review).where(models.Review.washroom_id == washroom_id)
    )
    reviews = result.scalars().all()

    if not reviews:
        raise HTTPException(status_code = 404, detail = "No reviews for given Washroom ID")
    return reviews



# POST review
@router.post("/", response_model=schemas.ReviewOutByWashroom, status_code=status.HTTP_201_CREATED)
async def create_Review(
    review_in: schemas.ReviewCreate,
    db: AsyncSession = Depends(deps.get_db),
    _: dict = Depends(deps.get_current_user)
    ):

    # check first for existing review for washroom by user
    try:
        washroom_id = UUID(review_in.washroom_id)
        user_id = UUID(review_in.user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Washroom ID or User ID format")

    

    duplicate_check = await db.execute(
        select(models.Review)
        .where(
            and_(
                models.Review.user_id == user_id,
                models.Review.washroom_id == washroom_id
            )
        )
    )
    duplicate_results = duplicate_check.scalars().all()

    if duplicate_results:
        raise HTTPException(status_code=400, detail="User already has review for Washroom")


    # Create new review
    new_review = models.Review(
        washroom_id=washroom_id,
        user_id=user_id,
        rating=review_in.rating,
        title=review_in.title,
        description=review_in.description,
        likes=0
    )

    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)

    return new_review

# PATCH review
@router.patch("/{review_id}", status_code=status.HTTP_200_OK )
async def update_review(
    review_id: str,
    review_update: schemas.ReviewEdit,
    db: AsyncSession = Depends(deps.get_db),
    _: dict = Depends(deps.get_current_user)
    ):
    try:
        review_id = UUID(review_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid review ID format")

    result = await db.execute(
        select(models.Review).where(models.Review.id == review_id)
     )

    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # check for updated fields from input
    if review_update.rating is not None:
        review.rating = review_update.rating
    if review_update.title is not None:
        review.title = review_update.title
    if review_update.description is not None:
        review.description = review_update.description

    await db.commit()
    await db.refresh(review)

    return review
# DELETE review
@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str,
    _: dict = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """Delete a review"""
    try:
        review_id = UUID(review_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid review ID format")

    # Find the review
    result = await db.execute(
        select(models.Review).where(models.Review.id == review_id)
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # Delete the review
    await db.delete(review)
    await db.commit()

