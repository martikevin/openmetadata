"""Pydantic schemas – API request / response bodies."""

from datetime import datetime

from pydantic import BaseModel, EmailStr

from .models.access_request import AccessRole, PurposeCategory, RequestStatus


# ── Request Items ──────────────────────────────────────────────────────────

class RequestItemCreate(BaseModel):
    entity_type: str
    entity_fqn: str
    entity_id: str | None = None
    entity_display_name: str | None = None


class RequestItemOut(RequestItemCreate):
    id: str
    model_config = {"from_attributes": True}


# ── Access Requests ────────────────────────────────────────────────────────

class AccessRequestCreate(BaseModel):
    requester_name: str
    requester_email: str
    requested_role: AccessRole = AccessRole.VIEWER
    purpose_category: PurposeCategory = PurposeCategory.OTHER
    purpose_text: str | None = None
    items: list[RequestItemCreate]


class AccessRequestOut(BaseModel):
    id: str
    requester_name: str
    requester_email: str
    requested_role: AccessRole
    purpose_category: PurposeCategory
    purpose_text: str | None
    owner_name: str | None
    owner_email: str | None
    status: RequestStatus
    reviewer_comment: str | None
    created_at: datetime
    updated_at: datetime
    items: list[RequestItemOut]
    model_config = {"from_attributes": True}


class AccessRequestReview(BaseModel):
    status: RequestStatus
    reviewer_comment: str | None = None


# ── Enums for the frontend ────────────────────────────────────────────────

class EnumOption(BaseModel):
    value: str
    label: str


class EnumsOut(BaseModel):
    roles: list[EnumOption]
    purpose_categories: list[EnumOption]
    statuses: list[EnumOption]
