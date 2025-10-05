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
