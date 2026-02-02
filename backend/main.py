from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.core.config import settings
from app.api import auth, categories, content, admin, users
from app.db.database import engine
from app.models import models

models.Base.metadata.create_all(bind=engine)

# Disable automatic trailing slash redirects
app = FastAPI(title=settings.APP_NAME, redirect_slashes=False)

# CORS configuration - allow multiple origins
allowed_origins = [
    settings.FRONTEND_URL,
    "https://qurator--zubu9dan-1baf2.us-east4.hosted.app",
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
