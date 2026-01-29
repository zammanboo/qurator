from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from authlib.integrations.httpx_client import AsyncOAuth2Client
from datetime import timedelta

from ..database import get_db
from ..config import get_settings
from ..models.user import User
from ..schemas.user import UserResponse, MFASetupResponse, MFAVerifyRequest, TokenResponse
from ..services.auth import (
    create_access_token,
    get_or_create_user,
    decode_token,
    get_user_by_id,
)
from ..services.mfa import setup_mfa, verify_totp
from ..utils.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google/login")
async def google_login(request: Request):
    """Get Google OAuth login URL."""
    redirect_uri = str(request.url_for("google_callback"))
    
    client = AsyncOAuth2Client(
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        redirect_uri=redirect_uri,
        scope="openid email profile",
    )
    
    authorization_url, state = client.create_authorization_url(GOOGLE_AUTHORIZATION_URL)
    
    return {"url": authorization_url}


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """Handle Google OAuth callback."""
    redirect_uri = str(request.url_for("google_callback"))
    
    client = AsyncOAuth2Client(
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        redirect_uri=redirect_uri,
    )
    
    try:
        token = await client.fetch_token(GOOGLE_TOKEN_URL, code=code)
        
        # Get user info
        async with client:
            response = await client.get(GOOGLE_USERINFO_URL)
            userinfo = response.json()
        
        # Create or update user
        user = await get_or_create_user(
            db,
            email=userinfo["email"],
            name=userinfo.get("name", userinfo["email"]),
            google_id=userinfo["id"],
            picture=userinfo.get("picture"),
        )
        
        # Create JWT token
        mfa_verified = not user.mfa_enabled  # If MFA not enabled, consider verified
        token_data = {
            "sub": str(user.id),
            "mfa_verified": mfa_verified,
        }
        access_token = create_access_token(token_data)
        
        # Redirect to frontend with token
        redirect_url = f"{settings.frontend_url}/auth/callback?token={access_token}"
        if user.mfa_enabled:
            redirect_url += "&mfa_required=true"
        
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        return RedirectResponse(url=f"{settings.frontend_url}/login?error={str(e)}")


@router.post("/mfa/setup", response_model=MFASetupResponse)
async def mfa_setup(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Set up MFA for the current user."""
    if user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled"
        )
    
    secret, qr_code = setup_mfa(user.email)
    
    # Store secret temporarily (not enabled yet)
    user.mfa_secret = secret
    await db.commit()
    
    return MFASetupResponse(secret=secret, qr_code=qr_code)


@router.post("/mfa/verify", response_model=TokenResponse)
async def mfa_verify(
    request: Request,
    data: MFAVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verify MFA code and enable MFA if not already enabled."""
    # Get token from header or cookie
    auth_header = request.headers.get("Authorization")
    token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    else:
        token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    user = await get_user_by_id(db, int(user_id))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA not set up"
        )
    
    if not verify_totp(user.mfa_secret, data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MFA code"
        )
    
    # Enable MFA if not already enabled
    if not user.mfa_enabled:
        user.mfa_enabled = True
        await db.commit()
    
    # Issue new token with MFA verified
    token_data = {
        "sub": str(user.id),
        "mfa_verified": True,
    }
    access_token = create_access_token(token_data)
    
    return TokenResponse(access_token=access_token, mfa_required=False)


@router.post("/mfa/disable")
async def mfa_disable(
    data: MFAVerifyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Disable MFA for the current user."""
    if not user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled"
        )
    
    if not verify_totp(user.mfa_secret, data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MFA code"
        )
    
    user.mfa_enabled = False
    user.mfa_secret = None
    await db.commit()
    
    return {"message": "MFA disabled successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current user info."""
    return user


@router.post("/logout")
async def logout(response: Response):
    """Log out the current user."""
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}
