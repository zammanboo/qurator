from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import Token, MFASetup, MFAVerify, MFAEnable
from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_mfa_secret,
    get_totp_uri,
    generate_qr_code,
    verify_totp,
    decode_access_token
)
from app.services.auth_service import get_current_user
from datetime import timedelta
import httpx
import urllib.parse

router = APIRouter()

oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@router.get("/google/login")
async def google_login():
    """Redirect to Google OAuth login"""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile"
    }
    query_string = urllib.parse.urlencode(params)
    return {
        "url": f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"
    }

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        # Exchange code for token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'code': code,
                    'client_id': settings.GOOGLE_CLIENT_ID,
                    'client_secret': settings.GOOGLE_CLIENT_SECRET,
                    'redirect_uri': settings.GOOGLE_REDIRECT_URI,
                    'grant_type': 'authorization_code'
                }
            )
            token_data = token_response.json()
            access_token = token_data.get('access_token')

            # Get user info
            user_response = await client.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            user_info = user_response.json()

        # Check if user exists
        user = db.query(User).filter(User.google_id == user_info['id']).first()

        if not user:
            # Create new user
            user = User(
                email=user_info['email'],
                full_name=user_info.get('name'),
                google_id=user_info['id'],
                profile_picture=user_info.get('picture')
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create access token
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        # Redirect to frontend with token
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?token={access_token}&mfa_required={user.mfa_enabled}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}"
        )

@router.post("/mfa/setup", response_model=MFASetup)
async def setup_mfa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Setup MFA for user"""
    if current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled"
        )

    # Generate secret
    secret = generate_mfa_secret()

    # Generate QR code
    uri = get_totp_uri(secret, current_user.email)
    qr_code = generate_qr_code(uri)

    # Save secret temporarily (will be enabled after verification)
    current_user.mfa_secret = secret
    db.commit()

    return MFASetup(secret=secret, qr_code=qr_code, otpauth_url=uri)

@router.post("/mfa/enable")
async def enable_mfa(
    mfa_data: MFAEnable,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable MFA after verifying token"""
    if not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA setup not initiated"
        )

    if not verify_totp(current_user.mfa_secret, mfa_data.token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MFA token"
        )

    current_user.mfa_enabled = True
    db.commit()

    return {"message": "MFA enabled successfully"}

@router.post("/mfa/verify")
async def verify_mfa(
    mfa_data: MFAVerify,
    current_user: User = Depends(get_current_user)
):
    """Verify MFA token"""
    if not current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )

    if not verify_totp(current_user.mfa_secret, mfa_data.token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA token"
        )

    return {"message": "MFA verification successful"}

@router.post("/mfa/disable")
async def disable_mfa(
    mfa_data: MFAVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable MFA"""
    if not current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )

    if not verify_totp(current_user.mfa_secret, mfa_data.token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA token"
        )

    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    db.commit()

    return {"message": "MFA disabled successfully"}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user
