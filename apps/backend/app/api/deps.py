from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

# ADD Firebase token verification dependency here in the future

async def get_db_session() -> AsyncSession:
    async for db in get_db():
        yield db

# TODO: auth dependency
