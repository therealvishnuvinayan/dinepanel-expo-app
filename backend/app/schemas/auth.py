from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.users import UserResponse


def normalize_phone(value: str) -> str:
    normalized = value.strip().replace(" ", "").replace("-", "")
    if not normalized.startswith("+"):
        raise ValueError("Phone number must include a country code")
    digits = normalized[1:]
    if not digits.isdigit() or not 8 <= len(digits) <= 15 or digits.startswith("0"):
        raise ValueError("Enter a valid international phone number")
    return f"+{digits}"


class OtpRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    phone: str = Field(min_length=8, max_length=24)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return normalize_phone(value)


class OtpVerifyRequest(OtpRequest):
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class OtpRequestResponse(BaseModel):
    message: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
