from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    password: str

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    first_name: str
    last_name: str
    password: str

    class Config:
        from_attributes = True


class WashroomOut(BaseModel):
    id: UUID
    name: str
    description: str
    address: str
    city: str
    country: str
    geom: str  # You can use str, dict, or a custom type depending on serialization
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
    opening_hours: Optional[dict]
    wheelchair_access: bool  # Or Optional[dict] if nullable
    lat: float
    long: float
    overall_rating: float
    rating_count: int
    created_by: UUID  # UUID type

    class Config:
        from_attributes = True




### REVIEW ###


# return all but washroom_id since already known
class ReviewOutByWashroom(BaseModel):
    id: UUID
    user_id: UUID
    rating: int
    title: str
    description: str
    likes : int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# return all but user_id since already known
class ReviewOutByUser(BaseModel):
    id: str
    washroom_id: UUID
    rating: int
    title: str
    description: str
    likes : int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# creating requires all attributes
class ReviewCreate(BaseModel):
    washroom_id: UUID
    user_id: UUID
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
