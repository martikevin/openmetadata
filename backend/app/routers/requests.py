"""CRUD + review endpoints for access requests."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models.access_request import (
    AccessRequest,
    AccessRole,
    PurposeCategory,
    RequestItem,
    RequestStatus,
)
from ..schemas import (
    AccessRequestCreate,
    AccessRequestOut,
    AccessRequestReview,
    EnumOption,
    EnumsOut,
)
from ..services import openmetadata_client as om

router = APIRouter(prefix="/api/requests", tags=["requests"])


def _label(val: str) -> str:
    return val.replace("_", " ").title()


# ── Enum helpers for the frontend ─────────────────────────────────────────

@router.get("/enums", response_model=EnumsOut)
def get_enums():
    return EnumsOut(
        roles=[EnumOption(value=r.value, label=_label(r.value)) for r in AccessRole],
        purpose_categories=[
            EnumOption(value=p.value, label=_label(p.value)) for p in PurposeCategory
        ],
        statuses=[
            EnumOption(value=s.value, label=_label(s.value)) for s in RequestStatus
        ],
    )


# ── CRUD ──────────────────────────────────────────────────────────────────

@router.post("", response_model=AccessRequestOut, status_code=201)
async def create_request(body: AccessRequestCreate, db: Session = Depends(get_db)):
    # Try to resolve owner from the first item via OM API
    owner_name = None
    owner_email = None
    if body.items:
        first = body.items[0]
        try:
            entity = await om.get_entity(first.entity_type, first.entity_fqn)
            owner = entity.get("owner") or entity.get("owners", [{}])[0] if entity.get("owners") else {}
            if isinstance(owner, dict):
                owner_name = owner.get("displayName") or owner.get("name")
                # OM doesn't always return email in owner ref – best effort
        except Exception:
            pass  # OM might be unreachable; that's fine

    req = AccessRequest(
        requester_name=body.requester_name,
        requester_email=body.requester_email,
        requested_role=body.requested_role,
        purpose_category=body.purpose_category,
        purpose_text=body.purpose_text,
        owner_name=owner_name,
        owner_email=owner_email,
    )
    for item in body.items:
        req.items.append(
            RequestItem(
                entity_type=item.entity_type,
                entity_fqn=item.entity_fqn,
                entity_id=item.entity_id,
                entity_display_name=item.entity_display_name,
            )
        )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("", response_model=list[AccessRequestOut])
def list_requests(
    status: RequestStatus | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(AccessRequest).options(joinedload(AccessRequest.items))
    if status:
        q = q.filter(AccessRequest.status == status)
    return q.order_by(AccessRequest.created_at.desc()).all()


@router.get("/{request_id}", response_model=AccessRequestOut)
def get_request(request_id: str, db: Session = Depends(get_db)):
    req = (
        db.query(AccessRequest)
        .options(joinedload(AccessRequest.items))
        .filter(AccessRequest.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(404, "Request not found")
    return req


@router.patch("/{request_id}/review", response_model=AccessRequestOut)
def review_request(
    request_id: str,
    body: AccessRequestReview,
    db: Session = Depends(get_db),
):
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    if req.status != RequestStatus.PENDING:
        raise HTTPException(400, "Only pending requests can be reviewed")
    if body.status not in (RequestStatus.APPROVED, RequestStatus.REJECTED):
        raise HTTPException(400, "Review status must be 'approved' or 'rejected'")
    req.status = body.status
    req.reviewer_comment = body.reviewer_comment
    db.commit()
    db.refresh(req)
    return req


@router.delete("/{request_id}", status_code=204)
def cancel_request(request_id: str, db: Session = Depends(get_db)):
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    if req.status != RequestStatus.PENDING:
        raise HTTPException(400, "Only pending requests can be cancelled")
    req.status = RequestStatus.CANCELLED
    db.commit()
