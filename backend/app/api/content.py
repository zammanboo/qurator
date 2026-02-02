from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import ContentItem, ContentClick, User
from app.schemas.schemas import ContentItem as ContentItemSchema
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("", response_model=List[ContentItemSchema])
@router.get("/", response_model=List[ContentItemSchema], include_in_schema=False)
async def get_content_items(
    category_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all content items, optionally filtered by category"""
    query = db.query(ContentItem).filter(ContentItem.is_active == True)

    if category_id:
        query = query.filter(ContentItem.category_id == category_id)

    content_items = query.order_by(ContentItem.order).offset(skip).limit(limit).all()
    return content_items

# IMPORTANT: Static routes must come before dynamic routes
@router.get("/search/", response_model=List[ContentItemSchema])
async def search_content(
    q: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Search content items by title or description"""
    if not q or len(q.strip()) < 1:
        return []

    search_term = f"%{q.strip()}%"
    query = db.query(ContentItem).filter(
        ContentItem.is_active == True,
        (ContentItem.title.ilike(search_term) | ContentItem.description.ilike(search_term))
    )

    content_items = query.order_by(ContentItem.click_count.desc()).offset(skip).limit(limit).all()
    return content_items

@router.get("/user/history")
async def get_user_click_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's click history"""
    clicks = db.query(ContentClick).filter(
        ContentClick.user_id == current_user.id
    ).order_by(ContentClick.clicked_at.desc()).offset(skip).limit(limit).all()

    history = []
    for click in clicks:
        content = db.query(ContentItem).filter(ContentItem.id == click.content_id).first()
        if content:
            history.append({
                "content_id": content.id,
                "title": content.title,
                "youtube_id": content.youtube_id,
                "thumbnail_url": content.thumbnail_url,
                "clicked_at": click.clicked_at
            })

    return history

# Dynamic routes must come last
@router.get("/{content_id}", response_model=ContentItemSchema)
async def get_content_item(content_id: int, db: Session = Depends(get_db)):
    """Get content item by ID"""
    content = db.query(ContentItem).filter(
        ContentItem.id == content_id,
        ContentItem.is_active == True
    ).first()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    return content

@router.post("/{content_id}/click")
async def record_click(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a click on content item"""
    content = db.query(ContentItem).filter(ContentItem.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )

    # Increment click count
    content.click_count = (content.click_count or 0) + 1

    # Record click history
    click = ContentClick(user_id=current_user.id, content_id=content_id)
    db.add(click)
    db.commit()

    return {"message": "Click recorded", "click_count": content.click_count}

@router.get("/{content_id}/clicks")
async def get_click_stats(
    content_id: int,
    db: Session = Depends(get_db)
):
    """Get click statistics for a content item"""
    content = db.query(ContentItem).filter(ContentItem.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )

    return {
        "content_id": content_id,
        "click_count": content.click_count or 0
    }
