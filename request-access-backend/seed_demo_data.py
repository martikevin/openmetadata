#!/usr/bin/env python3
"""Populate the database with realistic demo data so the UI isn't empty."""

import sys
import os

# Ensure the app package is importable
sys.path.insert(0, os.path.dirname(__file__))

from app.database import Base, engine, SessionLocal
from app.models.access_request import (
    AccessRequest,
    AccessRole,
    PurposeCategory,
    RequestItem,
    RequestStatus,
)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

DEMO_REQUESTS = [
    {
        "requester_name": "Anna Müller",
        "requester_email": "anna.mueller@example.com",
        "requested_role": AccessRole.VIEWER,
        "purpose_category": PurposeCategory.ANALYTICS,
        "purpose_text": "Need read access for quarterly sales dashboard",
        "owner_name": "Kevin Martin",
        "owner_email": "kevin.martin@example.com",
        "status": RequestStatus.PENDING,
        "items": [
            {
                "entity_type": "table",
                "entity_fqn": "prod.warehouse.sales.monthly_revenue",
                "entity_display_name": "Monthly Revenue",
            },
            {
                "entity_type": "table",
                "entity_fqn": "prod.warehouse.sales.customer_orders",
                "entity_display_name": "Customer Orders",
            },
        ],
    },
    {
        "requester_name": "Max Schmidt",
        "requester_email": "max.schmidt@example.com",
        "requested_role": AccessRole.EDITOR,
        "purpose_category": PurposeCategory.MACHINE_LEARNING,
        "purpose_text": "Training churn prediction model – need write access to feature store",
        "owner_name": "Sarah Fischer",
        "owner_email": "sarah.fischer@example.com",
        "status": RequestStatus.APPROVED,
        "reviewer_comment": "Approved – project is in Q1 roadmap",
        "items": [
            {
                "entity_type": "table",
                "entity_fqn": "prod.feature_store.customer_features",
                "entity_display_name": "Customer Features",
            },
            {
                "entity_type": "table",
                "entity_fqn": "prod.warehouse.ml.training_data",
                "entity_display_name": "ML Training Data",
            },
        ],
    },
    {
        "requester_name": "Lisa Weber",
        "requester_email": "lisa.weber@example.com",
        "requested_role": AccessRole.VIEWER,
        "purpose_category": PurposeCategory.REPORTING,
        "purpose_text": "Monthly compliance report for management",
        "owner_name": "Kevin Martin",
        "owner_email": "kevin.martin@example.com",
        "status": RequestStatus.PENDING,
        "items": [
            {
                "entity_type": "dashboard",
                "entity_fqn": "superset.compliance.gdpr_overview",
                "entity_display_name": "GDPR Overview Dashboard",
            },
        ],
    },
    {
        "requester_name": "Tom Braun",
        "requester_email": "tom.braun@example.com",
        "requested_role": AccessRole.ADMIN,
        "purpose_category": PurposeCategory.DEVELOPMENT,
        "purpose_text": "Setting up new ETL pipeline for marketing team",
        "owner_name": "Sarah Fischer",
        "owner_email": "sarah.fischer@example.com",
        "status": RequestStatus.REJECTED,
        "reviewer_comment": "Admin access is not needed – editor role is sufficient for ETL work",
        "items": [
            {
                "entity_type": "table",
                "entity_fqn": "prod.warehouse.marketing.campaigns",
                "entity_display_name": "Marketing Campaigns",
            },
            {
                "entity_type": "topic",
                "entity_fqn": "kafka.prod.marketing.events",
                "entity_display_name": "Marketing Events Stream",
            },
            {
                "entity_type": "table",
                "entity_fqn": "prod.warehouse.marketing.attribution",
                "entity_display_name": "Attribution Model",
            },
        ],
    },
    {
        "requester_name": "Julia Becker",
        "requester_email": "julia.becker@example.com",
        "requested_role": AccessRole.VIEWER,
        "purpose_category": PurposeCategory.DATA_QUALITY,
        "purpose_text": "Auditing data quality for customer master data",
        "owner_name": None,
        "owner_email": None,
        "status": RequestStatus.PENDING,
        "items": [
            {
                "entity_type": "table",
                "entity_fqn": "prod.warehouse.core.customers",
                "entity_display_name": "Customers (Master)",
            },
            {
                "entity_type": "table",
                "entity_fqn": "prod.warehouse.core.addresses",
                "entity_display_name": "Customer Addresses",
            },
        ],
    },
]


def seed():
    db = SessionLocal()
    existing = db.query(AccessRequest).count()
    if existing > 0:
        print(f"Database already has {existing} request(s) – skipping seed.")
        db.close()
        return

    total_items = 0
    for data in DEMO_REQUESTS:
        items_data = data.pop("items")
        req = AccessRequest(**data)
        for item in items_data:
            req.items.append(RequestItem(**item))
            total_items += 1
        db.add(req)

    db.commit()
    count = db.query(AccessRequest).count()
    print(f"Seeded {count} demo requests with {total_items} items.")
    db.close()


if __name__ == "__main__":
    seed()
    print("Done! Start the backend with: uvicorn app.main:app --reload")
