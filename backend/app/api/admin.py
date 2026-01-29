from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel
from app.db.database import get_db
from app.models.models import User, Category, ContentItem, ContentClick, CategoryGroup
from app.schemas.schemas import (
    User as UserSchema,
    Category as CategorySchema,
    CategoryCreate,
    CategoryUpdate,
    ContentItem as ContentItemSchema,
    ContentItemCreate,
    ContentItemUpdate
)
from app.services.auth_service import get_current_admin
from app.services.youtube import extract_video_id, get_video_metadata

router = APIRouter()

class CategoryOrder(BaseModel):
    id: int
    order: int

# User Management
@router.get("/users", response_model=List[UserSchema])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get all users (admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.patch("/users/{user_id}/admin")
async def toggle_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Toggle admin status for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.is_admin = not user.is_admin
    db.commit()
    db.refresh(user)
    return user

@router.patch("/users/{user_id}/active")
async def toggle_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Toggle active status for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user

# Category Management
@router.get("/categories", response_model=List[CategorySchema])
async def get_all_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get all categories including inactive (admin only)"""
    categories = db.query(Category).order_by(Category.order).offset(skip).limit(limit).all()
    return categories

@router.post("/categories", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a new category"""
    # Check if slug already exists
    existing = db.query(Category).filter(Category.slug == category.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this slug already exists"
        )

    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.patch("/categories/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: int,
    category: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update a category"""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Check slug uniqueness if being updated
    if category.slug and category.slug != db_category.slug:
        existing = db.query(Category).filter(Category.slug == category.slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this slug already exists"
            )

    update_data = category.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)

    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Delete a category"""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    db.delete(db_category)
    db.commit()
    return None

# Content Management
@router.get("/content", response_model=List[ContentItemSchema])
async def get_all_content(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get all content items including inactive (admin only)"""
    content_items = db.query(ContentItem).order_by(ContentItem.category_id, ContentItem.order).offset(skip).limit(limit).all()
    return content_items

@router.post("/content", response_model=ContentItemSchema, status_code=status.HTTP_201_CREATED)
async def create_content(
    content: ContentItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a new content item"""
    # Verify category exists
    category = db.query(Category).filter(Category.id == content.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Extract youtube_id from URL if not provided
    content_data = content.model_dump()
    if not content_data.get("youtube_id"):
        video_id = extract_video_id(content.youtube_url)
        if not video_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid YouTube URL"
            )
        content_data["youtube_id"] = video_id
    
    # Auto-fetch title and thumbnail if not provided
    if not content_data.get("title") or not content_data.get("thumbnail_url"):
        title, thumbnail_url = await get_video_metadata(content_data["youtube_id"])
        if not content_data.get("title"):
            content_data["title"] = title
        if not content_data.get("thumbnail_url"):
            content_data["thumbnail_url"] = thumbnail_url

    db_content = ContentItem(**content_data)
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content

@router.patch("/content/{content_id}", response_model=ContentItemSchema)
async def update_content(
    content_id: int,
    content: ContentItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update a content item"""
    db_content = db.query(ContentItem).filter(ContentItem.id == content_id).first()
    if not db_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )

    update_data = content.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_content, field, value)

    db.commit()
    db.refresh(db_content)
    return db_content

@router.delete("/content/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Delete a content item"""
    db_content = db.query(ContentItem).filter(ContentItem.id == content_id).first()
    if not db_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )

    db.delete(db_content)
    db.commit()
    return None


@router.post("/content/reorder")
async def reorder_content(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update content item orders (admin only)"""
    orders = await request.json()
    for item in orders:
        content = db.query(ContentItem).filter(ContentItem.id == item["id"]).first()
        if content:
            content.order = item["order"]
    db.commit()
    return {"message": "Content reordered successfully"}


@router.patch("/content/{content_id}/toggle-active")
async def toggle_content_active(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Toggle content active status"""
    content = db.query(ContentItem).filter(ContentItem.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    content.is_active = not content.is_active
    db.commit()
    db.refresh(content)
    return content


# User History Management
@router.get("/users/{user_id}/history")
async def get_user_history(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get click history for a specific user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    clicks = db.query(ContentClick).filter(
        ContentClick.user_id == user_id
    ).order_by(ContentClick.clicked_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for click in clicks:
        content = db.query(ContentItem).filter(ContentItem.id == click.content_id).first()
        category = db.query(Category).filter(Category.id == content.category_id).first() if content else None
        result.append({
            "id": click.id,
            "clicked_at": click.clicked_at,
            "content": {
                "id": content.id,
                "title": content.title,
                "youtube_id": content.youtube_id,
                "thumbnail_url": content.thumbnail_url,
                "category_name": category.name if category else "Unknown"
            } if content else None
        })
    
    return result


@router.get("/history/stats")
async def get_history_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get overall click statistics per user (admin only)"""
    stats = db.query(
        User.id,
        User.full_name,
        User.email,
        User.profile_picture,
        func.count(ContentClick.id).label("total_clicks"),
        func.max(ContentClick.clicked_at).label("last_click")
    ).outerjoin(ContentClick, User.id == ContentClick.user_id).group_by(User.id).all()
    
    return [
        {
            "user_id": s.id,
            "full_name": s.full_name,
            "email": s.email,
            "profile_picture": s.profile_picture,
            "total_clicks": s.total_clicks,
            "last_click": s.last_click
        }
        for s in stats
    ]


@router.post("/categories/reorder")
async def reorder_categories(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update category orders (admin only)"""
    orders = await request.json()
    for item in orders:
        category = db.query(Category).filter(Category.id == item["id"]).first()
        if category:
            category.order = item["order"]
    db.commit()
    return {"message": "Categories reordered successfully"}


@router.patch("/categories/{category_id}/toggle-active")
async def toggle_category_active(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Toggle category active status"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category.is_active = not category.is_active
    db.commit()
    db.refresh(category)
    return category


# Category Group Management
@router.get("/groups")
async def get_all_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get all category groups (admin only)"""
    groups = db.query(CategoryGroup).order_by(CategoryGroup.order).all()
    result = []
    for group in groups:
        categories = db.query(Category).filter(Category.group_id == group.id).order_by(Category.order).all()
        result.append({
            "id": group.id,
            "name": group.name,
            "slug": group.slug,
            "icon": group.icon,
            "order": group.order,
            "is_active": group.is_active,
            "categories": [{"id": c.id, "name": c.name, "slug": c.slug, "icon": c.icon} for c in categories]
        })
    return result

@router.post("/groups")
async def create_group(
    name: str,
    slug: str,
    icon: str = None,
    order: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a new category group"""
    group = CategoryGroup(name=name, slug=slug, icon=icon, order=order)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group

@router.patch("/groups/{group_id}")
async def update_group(
    group_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update a category group"""
    group = db.query(CategoryGroup).filter(CategoryGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    data = await request.json()
    for key, value in data.items():
        if hasattr(group, key):
            setattr(group, key, value)
    db.commit()
    db.refresh(group)
    return group

@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Delete a category group"""
    group = db.query(CategoryGroup).filter(CategoryGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Set categories' group_id to null
    db.query(Category).filter(Category.group_id == group_id).update({"group_id": None})
    db.delete(group)
    db.commit()
    return {"message": "Group deleted"}

@router.patch("/groups/{group_id}/toggle-active")
async def toggle_group_active(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Toggle group active status"""
    group = db.query(CategoryGroup).filter(CategoryGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    group.is_active = not group.is_active
    db.commit()
    db.refresh(group)
    return group

@router.post("/groups/reorder")
async def reorder_groups(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update group orders"""
    orders = await request.json()
    for item in orders:
        group = db.query(CategoryGroup).filter(CategoryGroup.id == item["id"]).first()
        if group:
            group.order = item["order"]
    db.commit()
    return {"message": "Groups reordered"}
