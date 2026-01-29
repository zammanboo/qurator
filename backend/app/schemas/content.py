from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional


class ContentBase(BaseModel):
    youtube_url: str
    order: int = 0


class ContentCreate(ContentBase):
    pass


class ContentUpdate(BaseModel):
    youtube_url: Optional[str] = None
    order: Optional[int] = None


class ContentResponse(ContentBase):
    id: int
    category_id: int
    video_id: str
    title: str
    thumbnail_url: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
