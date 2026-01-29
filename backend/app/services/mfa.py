import pyotp
import qrcode
import io
import base64
from typing import Tuple


def generate_mfa_secret() -> str:
    """Generate a new TOTP secret."""
    return pyotp.random_base32()


def generate_qr_code(secret: str, email: str, issuer: str = "Qurator") -> str:
    """Generate a QR code image as base64 string."""
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=email, issuer_name=issuer)
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode()


def verify_totp(secret: str, code: str) -> bool:
    """Verify a TOTP code."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code)


def setup_mfa(email: str) -> Tuple[str, str]:
    """Set up MFA for a user. Returns (secret, qr_code_base64)."""
    secret = generate_mfa_secret()
    qr_code = generate_qr_code(secret, email)
    return secret, qr_code
