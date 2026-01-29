from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    google_id: str
    profile_picture: Optional[str] = None

class User(UserBase):
    id: int
    google_id: str
    profile_picture: Optional[str] = None
    is_active: bool
    is_admin: bool
    mfa_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class MFASetup(BaseModel):
    secret: str
    qr_code: str
    otpauth_url: str

class MFAVerify(BaseModel):
    token: str

class MFAEnable(BaseModel):
    token: str

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    order: int = 0
    is_active: bool = True
    group_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None
    group_id: Optional[int] = None

class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Content Schemas
class ContentItemBase(BaseModel):
    category_id: int
    title: str
    description: Optional[str] = None
    youtube_url: str
    youtube_id: str
    thumbnail_url: Optional[str] = None
    order: int = 0
    click_count: int = 0
    is_active: bool = True

class ContentItemCreate(BaseModel):
    category_id: int
    title: Optional[str] = None
    description: Optional[str] = None
    youtube_url: str
    youtube_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    order: int = 0
    is_active: bool = True

class ContentItemUpdate(BaseModel):
    category_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    youtube_url: Optional[str] = None
    youtube_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class ContentItem(ContentItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CategoryWithContent(Category):
    content_items: List[ContentItem] = []

    class Config:
        from_attributes = True


# Category Group schemas
class CategoryGroupBase(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = None
    order: int = 0
    is_active: bool = True

class CategoryGroupCreate(CategoryGroupBase):
    pass

class CategoryGroupUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class CategoryGroup(CategoryGroupBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CategoryGroupWithCategories(CategoryGroup):
    categories: List['Category'] = []
