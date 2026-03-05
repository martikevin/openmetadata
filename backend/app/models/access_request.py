"""DB models for the access-request workflow."""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from ..database import Base


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class AccessRole(str, enum.Enum):
    VIEWER = "viewer"
    EDITOR = "editor"
    ADMIN = "admin"


class PurposeCategory(str, enum.Enum):
    ANALYTICS = "analytics"
    REPORTING = "reporting"
    MACHINE_LEARNING = "machine_learning"
    DATA_QUALITY = "data_quality"
    COMPLIANCE = "compliance"
    DEVELOPMENT = "development"
    OTHER = "other"


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AccessRequest(Base):
    """One access request – can contain multiple assets (a 'data product')."""

    __tablename__ = "access_requests"

    id = Column(String(36), primary_key=True, default=_uuid)
    requester_name = Column(String(256), nullable=False)
    requester_email = Column(String(256), nullable=False)

    # What role is requested?
    requested_role = Column(Enum(AccessRole), nullable=False, default=AccessRole.VIEWER)

    # Why?
    purpose_category = Column(
        Enum(PurposeCategory), nullable=False, default=PurposeCategory.OTHER
    )
    purpose_text = Column(Text, nullable=True)

    # Owner (resolved from OM) who must approve
    owner_name = Column(String(256), nullable=True)
    owner_email = Column(String(256), nullable=True)

    status = Column(Enum(RequestStatus), nullable=False, default=RequestStatus.PENDING)
    reviewer_comment = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    items = relationship(
        "RequestItem", back_populates="request", cascade="all, delete-orphan"
    )


class RequestItem(Base):
    """A single asset / entity inside a request."""

    __tablename__ = "request_items"

    id = Column(String(36), primary_key=True, default=_uuid)
    request_id = Column(
        String(36), ForeignKey("access_requests.id", ondelete="CASCADE"), nullable=False
    )

    # Reference into OpenMetadata
    entity_type = Column(String(64), nullable=False)   # table, topic, dashboard …
    entity_fqn = Column(String(1024), nullable=False)   # fully-qualified name in OM
    entity_id = Column(String(36), nullable=True)        # OM entity UUID (optional)
    entity_display_name = Column(String(512), nullable=True)

    request = relationship("AccessRequest", back_populates="items")
