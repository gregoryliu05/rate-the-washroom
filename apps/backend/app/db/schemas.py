from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    # Password is managed by the identity provider (Firebase). Keep optional for backwards compatibility
    # with older clients that may still send it, but it is ignored by the backend.
    password: Optional[str] = None

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: str
    public_id: UUID
    username: str
    email: str
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class WashroomOut(BaseModel):
    id: UUID
    name: str
    description: str
    address: str
    city: str
    country: str
    geom: Optional[dict]
    lat: float
    long: float
    opening_hours: Optional[dict]
    wheelchair_access: bool  # Or Optional[dict] if nullable
    overall_rating: float
    rating_count: int
    created_by: UUID

    class Config:
        from_attributes = True


class WashroomCreate(BaseModel):
    name: str
    description: str
    address: str
    city: str
    country: str
    geom: str
    opening_hours: Optional[dict] = None
    wheelchair_access: bool  # Or Optional[dict] if nullable
    lat: float
    long: float
    # These are derived from reviews; allow clients to omit and ignore any provided values.
    overall_rating: float = 0.0
    rating_count: int = 0
    created_by: Optional[UUID] = None  # populated from auth

    class Config:
        from_attributes = True




### REVIEW ###


# return all but washroom_id since already known
class ReviewOutByWashroom(BaseModel):
    id: UUID
    user_id: str
    rating: int
    title: Optional[str] = None
    description: Optional[str] = None
    likes : int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# return all but user_id since already known
class ReviewOutByUser(BaseModel):
    id: UUID
    washroom_id: UUID
    rating: int
    title: Optional[str] = None
    description: Optional[str] = None
    likes : int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# creating requires all attributes
class ReviewCreate(BaseModel):
    washroom_id: UUID
    user_id: Optional[str] = None
    rating: int
    title: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewEdit(BaseModel):
    rating: int
    title: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True
