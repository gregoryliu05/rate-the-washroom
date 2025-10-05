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

<<<<<<< HEAD

### REVIEW ###

# return all but washroom_id since already known
class ReviewOutByWashroom(BaseModel):
    id: uuid
    user_id: uuid
    rating: int
    title: str
    description: str
    likes : int
    created_at: datetime
    updated_at: datetime

# return all but user_id since already known
class ReviewOutByUser(BaseModel):
    id: uuid
    washroom_id: uuid
    rating: int
    title: str
    description: str
    likes : int
    created_at: datetime
    updated_at: datetime

# creating requires all attributes
class ReviewCreate(BaseModel):
    id: uuid
    user_id
    washroom_id: uuid
    rating: int
    title: str
    description: str
    likes : int
    created_at: datetime
    updated_at: datetime

# 
class ReviewEdit(BaseModel):
    id: uuid
    user_id
    washroom_id: uuid
    rating: int
    title: str
    description: str
    updated_at: datetime
=======
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
    lat: float
    long: float
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
    lat: float
    long: float
    overall_rating: float
    rating_count: int
    created_by: str  # UUID as string

    class Config:
        from_attributes = True
>>>>>>> 9afc53a04490049289290568bf031f37ac05af3b


