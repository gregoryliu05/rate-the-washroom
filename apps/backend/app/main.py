from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import settings
from app.core.security import *
from app.api.routers import washrooms, users, reviews

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="Rate the Washroom API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Include routers with API v1 prefix
app.include_router(washrooms.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(reviews.router, prefix=settings.API_V1_STR)

# CORS middleware
cors_origin_regex = None
if settings.ENVIRONMENT.lower() in {"development", "dev", "local"}:
    # Allow any localhost port for local dev (Next.js often uses 3000/3001).
    cors_origin_regex = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Rate the Washroom API!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

@app.get(f"{settings.API_V1_STR}/health")
async def api_health():
    return {"status": "healthy", "version": "0.1.0", "api": "v1"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
