from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContentInCategory(BaseModel):
    id: int
    youtube_url: str
    video_id: str
    title: str
    thumbnail_url: str
    order: int

    class Config:
        from_attributes = True


class CategoryWithContents(CategoryResponse):
    contents: List[ContentInCategory] = []
