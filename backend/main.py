from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.core.config import settings
from app.api import auth, categories, content, admin, users
from app.db.database import engine
from app.models import models

import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Try to create DB tables
    try:
        logger.info("Attempting to connect to database and create tables...")
        models.Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        logger.error("Application will start without database connection.")
        # We don't raise here so the container doesn't crash immediately,
        # allowing us to see the logs.
    
    yield
    
    # Shutdown logic (if any) can go here

# Disable automatic trailing slash redirects
app = FastAPI(title=settings.APP_NAME, redirect_slashes=False, lifespan=lifespan)

# CORS configuration - allow multiple origins
allowed_origins = [
    settings.FRONTEND_URL,
    "https://zubu9dan.com",
    "https://www.zubu9dan.com",
    "https://qurator--zubu9dan-1baf2.asia-east1.hosted.app",
    "http://localhost:3000",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(content.router, prefix="/api/content", tags=["content"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Qurator API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
