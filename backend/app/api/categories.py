from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Category
from app.schemas.schemas import Category as CategorySchema, CategoryWithContent

router = APIRouter()

@router.get("/", response_model=List[CategorySchema])
async def get_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all categories"""
    categories = db.query(Category).filter(Category.is_active == True).order_by(Category.order).offset(skip).limit(limit).all()
    return categories

@router.get("/{category_id}", response_model=CategoryWithContent)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get category by ID with content items"""
    category = db.query(Category).filter(Category.id == category_id, Category.is_active == True).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category

@router.get("/slug/{slug}", response_model=CategoryWithContent)
async def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get category by slug with content items"""
    category = db.query(Category).filter(Category.slug == slug, Category.is_active == True).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category
