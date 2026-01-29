from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    google_id: str
    picture: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None
    is_admin: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    picture: Optional[str] = None
    is_admin: bool
    mfa_enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MFASetupResponse(BaseModel):
    secret: str
    qr_code: str  # Base64 encoded QR code image


class MFAVerifyRequest(BaseModel):
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    mfa_required: bool = False
