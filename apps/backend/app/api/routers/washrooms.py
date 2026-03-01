from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, text
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

def _get_creator_name(creator) -> str | None:
    if creator is None:
        return None
    return f"{creator.first_name} {creator.last_name}".strip() or None


def _geom_to_geojson(geom_value):
    if geom_value is None:
        return None
    try:
        geom_obj = to_shape(geom_value)
        return {"type": "Point", "coordinates": [geom_obj.x, geom_obj.y]}
    except Exception:
        return None


@router.get("/", response_model=List[schemas.WashroomOut])
def get_washrooms_in_bounds(
    min_lat: float = Query(None , ge = -90, le =90),
    min_lon: float = Query(None, ge = -180, le = 180),
    max_lat: float = Query(None, ge = -90, le = 90),
    max_lon: float = Query(None, ge= -180, le = 180),
    db: Session = Depends(deps.get_db)
):

    if all(v is not None for v in [min_lat, min_lon, max_lat, max_lon]):
        query = text("""
            SELECT w.*, u.first_name AS creator_first_name, u.last_name AS creator_last_name
            FROM washrooms w
            LEFT JOIN users u ON w.created_by = u.public_id
            WHERE ST_Within(
                w.geom,
                ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326))
        """)
    else:
        query = text("""
            SELECT w.*, u.first_name AS creator_first_name, u.last_name AS creator_last_name
            FROM washrooms w
            LEFT JOIN users u ON w.created_by = u.public_id
        """)


    result = db.execute(query, {
        "min_lon": min_lon,
        "min_lat": min_lat,
        "max_lon": max_lon,
        "max_lat": max_lat
    })

    washrooms = result.fetchall()
    # Convert geom to GeoJSON for each washroom (handle WKB/WKT or raw values)
    response = []
    for w in washrooms:
        geom_geojson = _geom_to_geojson(w.geom)
        first = getattr(w, "creator_first_name", None)
        last = getattr(w, "creator_last_name", None)
        creator_name = f"{first} {last}".strip() if (first or last) else None

        response.append(
            schemas.WashroomOut(
                id=str(w.id),
                name=w.name,
                description=w.description,
                address=w.address,
                city=w.city,
                country=w.country,
                geom=geom_geojson,
                lat=w.lat,
                long=w.long,
                opening_hours=w.opening_hours,
                wheelchair_access=w.wheelchair_access,
                overall_rating=w.overall_rating,
                rating_count=w.rating_count,
                created_by=creator_name,
            )
        )

    return response


@router.get("/me", response_model=List[schemas.WashroomOut])
def get_my_washrooms(
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user),
):
    user_result = db.execute(
        select(models.User).where(models.User.id == current_user["id"])
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = db.execute(
        select(models.Washroom)
        .options(joinedload(models.Washroom.creator))
        .where(models.Washroom.created_by == user.public_id)
    )
    washrooms = result.scalars().all()

    response = []
    for w in washrooms:
        geom_geojson = _geom_to_geojson(w.geom)
        response.append(
            schemas.WashroomOut(
                id=str(w.id),
                name=w.name,
                description=w.description,
                address=w.address,
                city=w.city,
                country=w.country,
                geom=geom_geojson,
                lat=w.lat,
                long=w.long,
                opening_hours=w.opening_hours,
                wheelchair_access=w.wheelchair_access,
                overall_rating=w.overall_rating,
                rating_count=w.rating_count,
                created_by=_get_creator_name(w.creator),
            )
        )

    return response


@router.get("/{washroom_id}", response_model = schemas.WashroomOut)
def get_washroom(washroom_id: str, db: Session = Depends(deps.get_db)):
    try:
        washroom_id = uuid.UUID(washroom_id)
    except ValueError:
        raise HTTPException(status_code = 400, detail = "washroom ID must be uuid")

    res = db.execute(
        select(models.Washroom)
        .options(joinedload(models.Washroom.creator))
        .where(models.Washroom.id == washroom_id)
    )
    washroom = res.scalar_one_or_none()
    if not washroom:
        raise HTTPException(status_code = 404, detail = "washroom not found")

    # Convert geom to GeoJSON
    geom_geojson = _geom_to_geojson(washroom.geom)

    return schemas.WashroomOut(
        id=str(washroom.id),
        name=washroom.name,
        description=washroom.description,
        address=washroom.address,
        city=washroom.city,
        country=washroom.country,
        geom=geom_geojson,
        lat=washroom.lat,
        long=washroom.long,
        opening_hours=washroom.opening_hours,
        wheelchair_access=washroom.wheelchair_access,
        overall_rating=washroom.overall_rating,
        rating_count=washroom.rating_count,
        created_by=_get_creator_name(washroom.creator),
    )


@router.post("/", response_model=schemas.WashroomOut, status_code=status.HTTP_201_CREATED)
def create_washroom(
    washroom_in: schemas.WashroomCreate,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    user_result = db.execute(
        select(models.User).where(models.User.id == current_user["id"])
    )
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Convert GeoJSON dict to WKT string if needed
    if isinstance(washroom_in.geom, dict):
        coords = washroom_in.geom["coordinates"]
        wkt = f"POINT({coords[0]} {coords[1]})"
        geom = WKTElement(wkt, srid=4326)
    else:
        geom = WKTElement(washroom_in.geom, srid=4326)

    new_washroom = models.Washroom(
        name=washroom_in.name,
        description=washroom_in.description,
        address=washroom_in.address,
        city=washroom_in.city,
        country=washroom_in.country,
        geom=geom,
        lat = washroom_in.lat,
        long = washroom_in.long,
        opening_hours=washroom_in.opening_hours,
        wheelchair_access=washroom_in.wheelchair_access,
        # These are derived from reviews; never trust client-provided values.
        overall_rating=0.0,
        rating_count=0,
        created_by=user.public_id
    )
    db.add(new_washroom)
    db.commit()
    db.refresh(new_washroom)

    geom_geojson = _geom_to_geojson(new_washroom.geom)
    return schemas.WashroomOut(
        id=str(new_washroom.id),
        name=new_washroom.name,
        description=new_washroom.description,
        address=new_washroom.address,
        city=new_washroom.city,
        country=new_washroom.country,
        geom=geom_geojson,
        lat=new_washroom.lat,
        long=new_washroom.long,
        opening_hours=new_washroom.opening_hours,
        wheelchair_access=new_washroom.wheelchair_access,
        overall_rating=new_washroom.overall_rating,
        rating_count=new_washroom.rating_count,
        created_by=f"{user.first_name} {user.last_name}".strip() or None,
    )
