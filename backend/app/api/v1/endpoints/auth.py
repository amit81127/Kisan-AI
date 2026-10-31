import time
import secrets
import hashlib
import hmac
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header, status
from app.domain.models.farmer import (
    FarmerCreate,
    FarmerLoginRequest,
    FarmerResponse,
    AuthTokenResponse,
    OTPRequest,
    ResendOTPRequest,
)
from app.core.security import create_access_token, decode_access_token
from app.core.config import settings
from app.core.database import db_manager
from app.adapters.email.resend_adapter import resend_adapter

logger = logging.getLogger("kisanrakshak.auth")
router = APIRouter()

# Configuration constants
OTP_EXPIRY_SECONDS = 300       # 5 minutes
RESEND_COOLDOWN_SECONDS = 45   # 45 seconds between resends
MAX_REQUESTS_PER_WINDOW = 4    # Max 4 requests per 10-minute window
RATE_LIMIT_WINDOW_SECONDS = 600 # 10 minutes
MAX_VERIFICATION_ATTEMPTS = 5  # Max 5 incorrect attempts before invalidation

# In-memory secure OTP store
# Key: normalized email -> {
#   "hashed_otp": str,
#   "expires_at": float,
#   "created_at": float,
#   "last_requested_at": float,
#   "attempts": int,
#   "request_count": int,
#   "window_start": float,
#   "name": str,
#   "phone": Optional[str]
# }
ACTIVE_OTPS: Dict[str, Dict[str, Any]] = {}

# In-memory Farmer registry store
REGISTERED_FARMERS: Dict[str, Dict[str, Any]] = {}


def _hash_otp(email: str, otp_code: str) -> str:
    """Hash OTP with email and secret salt to ensure plain text is never stored in memory."""
    salt = settings.SECRET_KEY or "kisanrakshak-otp-salt-key"
    payload = f"{email}:{otp_code}:{salt}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _generate_secure_otp() -> str:
    """Generate a cryptographically secure 6-digit numeric OTP."""
    # secrets.randbelow(900000) yields 0..899999; + 100000 yields 100000..999999
    return f"{secrets.randbelow(900000) + 100000}"


def _check_rate_limits(email: str, is_resend: bool = False):
    """
    Check cooldown and rate limiting for OTP dispatch:
    - 45-second cooldown between consecutive requests
    - Max 4 requests per 10-minute window
    """
    now = time.time()
    record = ACTIVE_OTPS.get(email)
    if not record:
        return

    # 1. Cooldown check
    last_req = record.get("last_requested_at", 0)
    elapsed = now - last_req
    if elapsed < RESEND_COOLDOWN_SECONDS:
        remaining = int(RESEND_COOLDOWN_SECONDS - elapsed)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {remaining} seconds before requesting a new verification code."
        )

    # 2. Window rate limit check
    window_start = record.get("window_start", now)
    if now - window_start < RATE_LIMIT_WINDOW_SECONDS:
        if record.get("request_count", 0) >= MAX_REQUESTS_PER_WINDOW:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many verification requests. Please wait 10 minutes before requesting again."
            )


def _mask_email(email: str) -> str:
    """Mask email for privacy in logs (e.g. th***@gmail.com)."""
    if not email or "@" not in email:
        return "***"
    parts = email.split("@")
    user, domain = parts[0], parts[1]
    masked = (user[:2] + "***") if len(user) > 2 else (user[:1] + "***")
    return f"{masked}@{domain}"


@router.get("/domain-status")
async def get_domain_status(domain: str = "kisanai.com"):
    """
    Check verification status and DNS records for the custom domain in Resend.
    """
    return await resend_adapter.check_domain_status(domain_name=domain)


@router.post("/request-otp")
async def request_otp(payload: OTPRequest):
    """
    Generate and dispatch a cryptographically secure 6-digit verification code
    to the farmer's registered email address. Publicly accessible for login and signup.
    """
    raw_email = str(payload.email or "").strip().lower()
    masked = _mask_email(raw_email)

    # Diagnostic Log 1 & 2: Incoming request & authentication middleware decision
    logger.info(f"[AUTH DIAGNOSTIC] Incoming OTP request received for: {masked} (endpoint: /request-otp)")
    logger.info(f"[AUTH DIAGNOSTIC] Authentication middleware decision: Route '/request-otp' is public (no bearer token required)")

    # Diagnostic Log 3: Request validation
    if not raw_email or "@" not in raw_email or "." not in raw_email.split("@")[-1]:
        logger.warning(f"[AUTH DIAGNOSTIC] Request validation failed: Invalid email format '{masked}'")
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    logger.info(f"[AUTH DIAGNOSTIC] Request validation passed for '{masked}'")

    now = time.time()
    _check_rate_limits(raw_email, is_resend=False)

    # Lookup existing farmer name if known asynchronously from MongoDB Atlas
    farmer_name = payload.name or "Farmer Friend"
    if db_manager.db is not None:
        try:
            existing = await db_manager.db["farmers"].find_one({"email": raw_email})
            if existing and existing.get("name"):
                farmer_name = existing["name"]
        except Exception as e:
            logger.warning(f"Async MongoDB lookup failed: {e}")
    elif raw_email in REGISTERED_FARMERS:
        farmer_name = REGISTERED_FARMERS[raw_email].get("name", farmer_name)

    # Diagnostic Log 4: Secure OTP Generation
    otp_code = _generate_secure_otp()
    hashed_otp = _hash_otp(raw_email, otp_code)
    expires_at = now + OTP_EXPIRY_SECONDS

    # Track rate-limit window
    prev_record = ACTIVE_OTPS.get(raw_email, {})
    window_start = prev_record.get("window_start", now)
    if now - window_start >= RATE_LIMIT_WINDOW_SECONDS:
        window_start = now
        request_count = 1
    else:
        request_count = prev_record.get("request_count", 0) + 1

    # Invalidate previous OTP and store new hashed record (plain text is NEVER stored)
    ACTIVE_OTPS[raw_email] = {
        "hashed_otp": hashed_otp,
        "expires_at": expires_at,
        "created_at": now,
        "last_requested_at": now,
        "attempts": 0,
        "request_count": request_count,
        "window_start": window_start,
        "name": farmer_name,
        "phone": payload.phone or prev_record.get("phone")
    }
    logger.info(f"[AUTH DIAGNOSTIC] OTP generation result: Cryptographically secure 6-digit OTP created. Salted SHA-256 stored. Expiry: {OTP_EXPIRY_SECONDS}s. Previous OTP invalidated.")

    # Diagnostic Log 5: Resend API request
    logger.info(f"[AUTH DIAGNOSTIC] Resend API request: Dispatching verification code from '{resend_adapter.from_email}' to '{masked}'")

    try:
        resend_result = await resend_adapter.send_verification_otp(
            to_email=raw_email,
            otp_code=otp_code,
            farmer_name=farmer_name,
            phone=payload.phone
        )
        logger.info(f"[AUTH DIAGNOSTIC] Resend API dispatch result: Accepted (Email ID: {resend_result.get('email_id')}) delivered to '{masked}'")
        logger.info(f"[AUTH DIAGNOSTIC] Final HTTP response for '{masked}': 200 OK")

        return {
            "success": True,
            "message": f"Verification code sent to {raw_email}. Please check your inbox and spam folder.",
            "email": raw_email,
            "delivered_to": resend_result.get("delivered_to", raw_email),
            "expires_in_seconds": OTP_EXPIRY_SECONDS,
            "cooldown_seconds": RESEND_COOLDOWN_SECONDS
        }
    except HTTPException as http_err:
        logger.error(f"[AUTH DIAGNOSTIC] Resend error response for '{masked}': HTTP {http_err.status_code} - {http_err.detail}")
        logger.info(f"[AUTH DIAGNOSTIC] Final HTTP response for '{masked}': {http_err.status_code}")
        raise http_err
    except Exception as unhandled_err:
        logger.error(f"[AUTH DIAGNOSTIC] Unexpected email dispatch failure for '{masked}': {unhandled_err}")
        logger.info(f"[AUTH DIAGNOSTIC] Final HTTP response for '{masked}': 500")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to dispatch verification code: {str(unhandled_err)}"
        )


@router.post("/resend-otp")
async def resend_otp(payload: ResendOTPRequest):
    """
    Resend a fresh 6-digit verification code to the registered email address.
    Invalidates any previous OTP, enforces a 45-second cooldown and rate limits.
    """
    raw_email = str(payload.email or "").strip().lower()
    masked = _mask_email(raw_email)

    logger.info(f"[AUTH DIAGNOSTIC] Incoming Resend OTP request for: {masked} (endpoint: /resend-otp)")
    logger.info(f"[AUTH DIAGNOSTIC] Authentication middleware decision: Route '/resend-otp' is public (no bearer token required)")

    if not raw_email or "@" not in raw_email or "." not in raw_email.split("@")[-1]:
        logger.warning(f"[AUTH DIAGNOSTIC] Request validation failed: Invalid email format '{masked}'")
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    logger.info(f"[AUTH DIAGNOSTIC] Request validation passed for '{masked}'")

    now = time.time()
    _check_rate_limits(raw_email, is_resend=True)

    prev_record = ACTIVE_OTPS.get(raw_email, {})
    farmer_name = prev_record.get("name", "Farmer Friend")
    phone = prev_record.get("phone")

    # Generate a fresh secure 6-digit OTP
    otp_code = _generate_secure_otp()
    hashed_otp = _hash_otp(raw_email, otp_code)
    expires_at = now + OTP_EXPIRY_SECONDS

    # Rate-limit window update
    window_start = prev_record.get("window_start", now)
    if now - window_start >= RATE_LIMIT_WINDOW_SECONDS:
        window_start = now
        request_count = 1
    else:
        request_count = prev_record.get("request_count", 0) + 1

    # Overwrite record with new OTP (invalidates previous OTP immediately)
    ACTIVE_OTPS[raw_email] = {
        "hashed_otp": hashed_otp,
        "expires_at": expires_at,
        "created_at": now,
        "last_requested_at": now,
        "attempts": 0,
        "request_count": request_count,
        "window_start": window_start,
        "name": farmer_name,
        "phone": phone
    }
    logger.info(f"[AUTH DIAGNOSTIC] OTP generation result: Fresh 6-digit OTP generated. Previous OTP invalidated. Expiry: {OTP_EXPIRY_SECONDS}s.")

    logger.info(f"[AUTH DIAGNOSTIC] Resend API request: Dispatching resent OTP from '{resend_adapter.from_email}' to '{masked}'")

    try:
        resend_result = await resend_adapter.send_verification_otp(
            to_email=raw_email,
            otp_code=otp_code,
            farmer_name=farmer_name,
            phone=phone
        )
        logger.info(f"[AUTH DIAGNOSTIC] Resend API dispatch result: Accepted (Email ID: {resend_result.get('email_id')}) delivered to '{masked}'")
        logger.info(f"[AUTH DIAGNOSTIC] Final HTTP response for '{masked}': 200 OK")

        return {
            "success": True,
            "message": f"A new verification code has been dispatched to {raw_email}.",
            "email": raw_email,
            "delivered_to": resend_result.get("delivered_to", raw_email),
            "expires_in_seconds": OTP_EXPIRY_SECONDS,
            "cooldown_seconds": RESEND_COOLDOWN_SECONDS
        }
    except HTTPException as http_err:
        logger.error(f"[AUTH DIAGNOSTIC] Resend error response for '{masked}': HTTP {http_err.status_code} - {http_err.detail}")
        logger.info(f"[AUTH DIAGNOSTIC] Final HTTP response for '{masked}': {http_err.status_code}")
        raise http_err
    except Exception as unhandled_err:
        logger.error(f"[AUTH DIAGNOSTIC] Unexpected email dispatch failure for '{masked}': {unhandled_err}")
        logger.info(f"[AUTH DIAGNOSTIC] Final HTTP response for '{masked}': 500")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resend verification code: {str(unhandled_err)}"
        )


@router.post("/verify-otp", response_model=AuthTokenResponse)
async def verify_otp(payload: FarmerLoginRequest):
    """
    Verify the 6-digit OTP received via email and return a signed JWT authentication token.
    Enforces 5-minute expiry, single-use invalidation, and max 5 attempts.
    """
    email = str(payload.email).strip().lower()
    otp = (payload.otp or "").strip()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address.")

    if not otp or len(otp) < 4:
        raise HTTPException(status_code=400, detail="Please enter the complete 6-digit verification code.")

    cached_record = ACTIVE_OTPS.get(email)
    if not cached_record:
        raise HTTPException(
            status_code=400,
            detail="No active verification code found for this email. Please request a new code."
        )

    # 1. Expiration check (5 minutes)
    now = time.time()
    if now > cached_record.get("expires_at", 0):
        ACTIVE_OTPS.pop(email, None)
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired (5-minute limit). Please request a fresh code."
        )

    # 2. Maximum attempts check
    attempts = cached_record.get("attempts", 0)
    if attempts >= MAX_VERIFICATION_ATTEMPTS:
        ACTIVE_OTPS.pop(email, None)
        raise HTTPException(
            status_code=400,
            detail="Maximum verification attempts exceeded. Please request a new code."
        )

    # 3. Secure constant-time hash comparison
    input_hash = _hash_otp(email, otp)
    expected_hash = cached_record.get("hashed_otp", "")

    if not hmac.compare_digest(input_hash, expected_hash):
        cached_record["attempts"] = attempts + 1
        remaining_tries = MAX_VERIFICATION_ATTEMPTS - cached_record["attempts"]
        if remaining_tries <= 0:
            ACTIVE_OTPS.pop(email, None)
            raise HTTPException(
                status_code=400,
                detail="Invalid verification code. Maximum attempts exceeded. Please request a new code."
            )
        raise HTTPException(
            status_code=400,
            detail=f"Invalid verification code. Please check your email. ({remaining_tries} attempt{'s' if remaining_tries > 1 else ''} remaining)"
        )

    # 4. Successful verification: Invalidate OTP immediately (guarantees single-use)
    farmer_name = cached_record.get("name") or "Farmer Friend"
    farmer_phone = cached_record.get("phone")
    ACTIVE_OTPS.pop(email, None)

    # Retrieve or initialize farmer profile asynchronously from MongoDB Atlas
    farmer_data = None
    if db_manager.db is not None:
        try:
            farmer_data = await db_manager.db["farmers"].find_one({"email": email})
            if farmer_data:
                farmer_data.pop("_id", None)
                if farmer_name and farmer_name != "Farmer Friend":
                    farmer_data["name"] = farmer_name
                if farmer_phone:
                    farmer_data["phone"] = farmer_phone
                await db_manager.db["farmers"].update_one(
                    {"email": email},
                    {"$set": farmer_data},
                    upsert=True
                )
        except Exception as e:
            logger.warning(f"Async MongoDB fetch failed: {e}")

    if not farmer_data:
        if email in REGISTERED_FARMERS:
            farmer_data = REGISTERED_FARMERS[email]
            if farmer_name and farmer_name != "Farmer Friend":
                farmer_data["name"] = farmer_name
            if farmer_phone:
                farmer_data["phone"] = farmer_phone
        else:
            email_prefix = email.split("@")[0].replace(".", "_")
            farmer_id = f"farmer_{email_prefix[:8]}"
            farmer_data = {
                "id": farmer_id,
                "name": farmer_name,
                "email": email,
                "phone": farmer_phone,
                "location": "Lucknow, Uttar Pradesh",
                "preferred_language": "hi"
            }

        # Persist asynchronously to MongoDB Atlas
        if db_manager.db is not None:
            try:
                await db_manager.db["farmers"].update_one(
                    {"email": email},
                    {"$set": farmer_data},
                    upsert=True
                )
            except Exception as e:
                logger.warning(f"Async MongoDB persist failed: {e}")

    REGISTERED_FARMERS[email] = farmer_data

    # Generate JWT Token
    token = create_access_token({
        "sub": farmer_data["id"],
        "email": farmer_data["email"],
        "name": farmer_data["name"]
    })

    farmer_res = FarmerResponse(**farmer_data)
    logger.info(f"Farmer successfully authenticated via email OTP: {email}")
    return AuthTokenResponse(access_token=token, farmer=farmer_res)


@router.post("/signup", response_model=AuthTokenResponse)
async def signup(payload: FarmerCreate):
    """
    Register a new farmer profile with email and return JWT token.
    """
    email = str(payload.email).strip().lower()
    email_prefix = email.split("@")[0].replace(".", "_")
    farmer_id = f"farmer_{email_prefix[:8]}"

    farmer_dict = {
        "id": farmer_id,
        "name": payload.name,
        "email": email,
        "phone": payload.phone,
        "location": payload.location or "India",
        "preferred_language": payload.preferred_language
    }
    REGISTERED_FARMERS[email] = farmer_dict

    # Persist asynchronously to MongoDB Atlas
    if db_manager.db is not None:
        try:
            await db_manager.db["farmers"].update_one(
                {"email": email},
                {"$set": farmer_dict},
                upsert=True
            )
        except Exception as e:
            logger.warning(f"Async MongoDB signup persist failed: {e}")

    token = create_access_token({
        "sub": farmer_id,
        "email": email,
        "name": payload.name
    })

    farmer_res = FarmerResponse(**farmer_dict)
    return AuthTokenResponse(access_token=token, farmer=farmer_res)


@router.get("/me", response_model=FarmerResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Get current logged-in farmer profile from Bearer JWT.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ")[1]
    decoded = decode_access_token(token)
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")

    email = decoded.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid session token payload")

    farmer_data = None
    if db_manager.db is not None:
        try:
            farmer_data = await db_manager.db["farmers"].find_one({"email": email})
            if farmer_data:
                farmer_data.pop("_id", None)
        except Exception as e:
            logger.warning(f"Async MongoDB get_current_user failed: {e}")

    if not farmer_data and email in REGISTERED_FARMERS:
        farmer_data = REGISTERED_FARMERS[email]

    if not farmer_data:
        # Construct profile directly from token claims
        farmer_data = {
            "id": decoded.get("sub", f"farmer_{email.split('@')[0]}"),
            "name": decoded.get("name", "Farmer Friend"),
            "email": email,
            "phone": None,
            "location": "India",
            "preferred_language": "hi"
        }

    return FarmerResponse(**farmer_data)
