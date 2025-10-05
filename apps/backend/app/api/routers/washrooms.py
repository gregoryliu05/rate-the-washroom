from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid

from app.db import models, session
from app.api import deps
import app.db.schemas as schemas
from geoalchemy2.shape import to_shape
from geoalchemy2 import WKTElement


router = APIRouter(
    prefix="/washrooms",
    tags = ["washrooms"]
)


@router.get("/", response_model=List[schemas.WashroomOut])
async def get_washrooms(
    min_lat: Optional[float] = Query(None, description="Minimum latitude"),
):
    pass


@router.get("/{washroom_id}", response_model = schemas.WashroomOut)
async def get_washroom(washroom_id: str, db: AsyncSession = Depends(deps.get_db)):
    try:
        washroom_id = uuid.UUID(washroom_id)
    except ValueError:
        raise HTTPException(status_code = 400, detail = "washroom ID must be uuid")

    res = await db.execute(select(models.Washroom).where(models.Washroom.id == washroom_id))
    washroom = res.scalar_one_or_none()
    if not washroom:
        raise HTTPException(status_code = 404, detail = "washroom not found")

    # Convert geom to GeoJSON
    geom_obj = to_shape(washroom.geom)
    geom_geojson = {
        "type": "Point",
        "coordinates": [geom_obj.x, geom_obj.y]
    }

    return schemas.WashroomOut(
        id=str(washroom.id),
        name=washroom.name,
        description=washroom.description,
        address=washroom.address,
        city=washroom.city,
        country=washroom.country,
        geom=geom_geojson,
        lat = washroom.lat,
        long = washroom.long,
        opening_hours=washroom.opening_hours,
        overall_rating=washroom.overall_rating,
        rating_count=washroom.rating_count,
        created_by=str(washroom.created_by)
    )


@router.post("/", response_model=schemas.WashroomOut, status_code=status.HTTP_201_CREATED)
async def create_washroom(washroom_in: schemas.WashroomCreate, db: AsyncSession = Depends(deps.get_db)):
    # Convert GeoJSON dict to WKT string if needed
    if isinstance(washroom_in.geom, dict):
        coords = washroom_in.geom["coordinates"]
        wkt = f"POINT({coords[0]} {coords[1]})"
        geom = WKTElement(wkt, srid=4326)
    else:
        geom = WKTElement(washroom_in.geom, srid=4326)

    new_washroom = models.Washroom(
        id=uuid.uuid4(),
        name=washroom_in.name,
        description=washroom_in.description,
        address=washroom_in.address,
        city=washroom_in.city,
        country=washroom_in.country,
        geom=geom,
        lat = washroom_in.lat,
        long = washroom_in.long,
        opening_hours=washroom_in.opening_hours,
        overall_rating=washroom_in.overall_rating,
        rating_count=washroom_in.rating_count,
        created_by=washroom_in.created_by
    )
    await db.add(new_washroom)
    await db.commit()
    await db.refresh(new_washroom)
    return new_washroom




