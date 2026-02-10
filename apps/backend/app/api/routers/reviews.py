from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func
from typing import List

from app.db import models, schemas
from app.api import deps
from uuid import UUID, uuid4


router = APIRouter(prefix="/reviews", tags=["reviews"])

def _recompute_washroom_rating(db: Session, washroom_id: UUID) -> None:
    washroom = db.execute(
        select(models.Washroom).where(models.Washroom.id == washroom_id)
    ).scalar_one_or_none()
    if not washroom:
        return

    count, avg = db.execute(
        select(func.count(models.Review.id), func.avg(models.Review.rating)).where(
            models.Review.washroom_id == washroom_id
        )
    ).one()

    washroom.rating_count = int(count or 0)
    washroom.overall_rating = float(avg) if avg is not None else 0.0


# GET by users
@router.get("/{user_id}", response_model=List[schemas.ReviewOutByUser])
def get_review_by_user(
    user_id: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user),
):
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    result = db.execute(
        select(models.Review)
        .where(models.Review.user_id == user_id)
        .order_by(models.Review.created_at.desc())
        )
    reviews = result.scalars().all()

    return reviews


# GET by washrrom
@router.get("/washroom/{washroom_id}", response_model=List[schemas.ReviewOutByWashroom])
def get_review_by_washroom(washroom_id: str, db: Session = Depends(deps.get_db)):
    try:
        washroom_id = UUID(washroom_id)
    except ValueError:
        raise HTTPException(status_code = 400, detail = "Invalid Washroom ID format")

    result = db.execute(
        select(models.Review)
        .where(models.Review.washroom_id == washroom_id)
        .order_by(models.Review.created_at.desc())
    )
    reviews = result.scalars().all()

    return reviews



# POST review
@router.post("/", response_model=schemas.ReviewOutByWashroom, status_code=status.HTTP_201_CREATED)
def create_Review(
    review_in: schemas.ReviewCreate,
    response: Response,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user),
):
    user_id = current_user["id"]

    # check first for existing review for washroom by user
    washroom_id = review_in.washroom_id

    washroom = db.execute(
        select(models.Washroom).where(models.Washroom.id == washroom_id)
    ).scalar_one_or_none()
    if not washroom:
        raise HTTPException(status_code=404, detail="Washroom not found")

    existing_reviews = db.execute(
        select(models.Review)
        .where(
            and_(
                models.Review.user_id == user_id,
                models.Review.washroom_id == washroom_id
            )
        ).order_by(models.Review.updated_at.desc())
    ).scalars().all()

    # Upsert behavior: if a review already exists for (washroom_id, user_id),
    # update it instead of creating a duplicate.
    if existing_reviews:
        review = existing_reviews[0]
        review.rating = review_in.rating
        review.title = review_in.title
        review.description = review_in.description

        # If duplicates somehow exist, keep the newest and delete the rest.
        for dup in existing_reviews[1:]:
            db.delete(dup)

        response.status_code = status.HTTP_200_OK
    else:
        review = models.Review(
            washroom_id=washroom_id,
            user_id=user_id,
            rating=review_in.rating,
            title=review_in.title,
            description=review_in.description,
            likes=0,
        )
        db.add(review)
        response.status_code = status.HTTP_201_CREATED

    db.flush()
    _recompute_washroom_rating(db, washroom_id)
    db.commit()
    db.refresh(review)
    return review

# PATCH review
@router.patch("/{review_id}", status_code=status.HTTP_200_OK )
def update_review(review_id: str,review_update: schemas.ReviewEdit,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user),
    ):
    try:
        review_id = UUID(review_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid review ID format")

    result = db.execute(
        select(models.Review).where(models.Review.id == review_id)
     )

    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    # check for updated fields from input
    if review_update.rating is not None:
        review.rating = review_update.rating
    if review_update.title is not None:
        review.title = review_update.title
    if review_update.description is not None:
        review.description = review_update.description

    washroom_id = review.washroom_id
    db.flush()
    _recompute_washroom_rating(db, washroom_id)
    db.commit()
    db.refresh(review)

    return review
# DELETE review
@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user),
):
    """Delete a review"""
    try:
        review_id = UUID(review_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid review ID format")

    # Find the review
    result = db.execute(
        select(models.Review).where(models.Review.id == review_id)
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Delete the review
    washroom_id = review.washroom_id
    db.delete(review)
    db.flush()
    _recompute_washroom_rating(db, washroom_id)
    db.commit()
