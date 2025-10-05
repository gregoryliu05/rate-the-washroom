from pydantic import BaseModel
from datetime import datetime
import uuid

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
    id: str
    name: str
    description: str
    address: str
    city: str
    country: str
    geom: str  # You can use str, dict, or a custom type depending on serialization
    opening_hours: dict  # Or Optional[dict] if nullable
    overall_rating: float
    rating_count: int
    created_by: str  # UUID as string

    class Config:
        from_attributes = True


class WashroomCreate(BaseModel):
    name: str
    description: str
    address: str
    city: str
    country: str
    geom: str  # You can use str, dict, or a custom type depending on serialization
    opening_hours: dict  # Or Optional[dict] if nullable
    overall_rating: float
    rating_count: int
    created_by: str  # UUID as string

    class Config:
        from_attributes = True


