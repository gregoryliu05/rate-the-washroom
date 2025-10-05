from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db import models, session
from app.api import deps
from app.db.schemas import Washroom, WashroomCreate, WashroomUpdate


router = APIRouter(
    prefix="/washrooms",
    tags = ["washrooms"]
)


@router.get("/", response_model=List[Washroom])
async def list_washrooms(
    min_lat: Optional[float] = Query(None, description="Minimum latitude"),
):
    pass
