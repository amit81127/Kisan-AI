from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timezone

class FarmerBase(BaseModel):
    email: EmailStr = Field(..., description="Farmer email address for Resend verification")
    name: str = Field(default="Farmer Friend", max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    location: Optional[str] = Field(default="India", description="GPS Coordinates or State/District")
    preferred_language: str = Field(default="hi", max_length=5)

class FarmerCreate(FarmerBase):
    pass

class OTPRequest(BaseModel):
    email: EmailStr = Field(..., description="Farmer email address to receive Resend verification code")
    name: Optional[str] = Field(default="Farmer Friend", description="Farmer Name")
    phone: Optional[str] = Field(default=None, description="Optional mobile number")

class ResendOTPRequest(BaseModel):
    email: EmailStr = Field(..., description="Farmer email address to resend verification code")

class FarmerLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Farmer email address")
    otp: str = Field(..., min_length=4, max_length=8, description="6-digit verification code")

class FarmerResponse(FarmerBase):
    id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    farmer: FarmerResponse
