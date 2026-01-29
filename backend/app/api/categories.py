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


@router.get("/groups/", response_model=None)
async def get_category_groups(db: Session = Depends(get_db)):
    """Get all active category groups with their categories for sidebar"""
    from app.models.models import CategoryGroup
    
    groups = db.query(CategoryGroup).filter(CategoryGroup.is_active == True).order_by(CategoryGroup.order).all()
    result = []
    for group in groups:
        categories = db.query(Category).filter(
            Category.group_id == group.id,
            Category.is_active == True
        ).order_by(Category.order).all()
        
        result.append({
            "id": group.id,
            "name": group.name,
            "slug": group.slug,
            "icon": group.icon,
            "categories": [
                {"id": c.id, "name": c.name, "slug": c.slug, "icon": c.icon}
                for c in categories
            ]
        })
    
    # Also get ungrouped categories
    ungrouped = db.query(Category).filter(
        Category.group_id == None,
        Category.is_active == True
    ).order_by(Category.order).all()
    
    if ungrouped:
        result.append({
            "id": None,
            "name": "기타",
            "slug": "etc",
            "icon": "📁",
            "categories": [
                {"id": c.id, "name": c.name, "slug": c.slug, "icon": c.icon}
                for c in ungrouped
            ]
        })
    
    return result
