from pydantic import BaseModel
from datetime import datetime
import uuid

class UserCreate(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    password: str


class UserOut(BaseModel):
    id: uuid
    username: str
    email: str
    first_name: str
    last_name: str
    password: str


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


