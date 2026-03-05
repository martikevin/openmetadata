# OpenMetadata Request Access Workflow

A **standalone sidecar service** that adds a data access request workflow to
[OpenMetadata](https://open-metadata.org/).
It talks to OpenMetadata exclusively through the public REST API, so upgrading
OpenMetadata to a newer version requires **zero code changes** here – just point
the `OPENMETADATA_URL` env-var at the new instance.

## Architecture

```
┌─────────────┐       REST        ┌──────────────────┐
│  OM Server   │◄────────────────►│  Request-Access   │
│  (any ver.)  │   /api/v1/...    │  Backend (FastAPI)│
└─────────────┘                   └────────┬─────────┘
                                           │ SQLAlchemy
                                     ┌─────▼─────┐
                                     │ PostgreSQL │
                                     │  / SQLite  │
                                     └───────────┘
┌─────────────────────────────────────────────────────┐
│           React Frontend  (Vite + Ant Design)       │
│  • Browse assets / data products                     │
│  • Request access (role, purpose, free-text)         │
│  • Owner approval / rejection dashboard              │
└─────────────────────────────────────────────────────┘
```

## Quick Start

```bash
docker compose up --build
```

| Service            | URL                        |
|--------------------|----------------------------|
| Frontend           | http://localhost:3000       |
| Backend API        | http://localhost:8000       |
| API Docs (Swagger) | http://localhost:8000/docs  |

## Configuration (env vars)

| Variable              | Default                         | Description                     |
|-----------------------|---------------------------------|---------------------------------|
| `OPENMETADATA_URL`    | `http://localhost:8585/api`     | Base URL of OpenMetadata API    |
| `OPENMETADATA_TOKEN`  | *(empty)*                       | JWT / bot token for OM API      |
| `DATABASE_URL`        | `sqlite:///./request_access.db` | SQLAlchemy connection string    |

## Why a sidecar?

Patching OpenMetadata's Java backend means every upstream release requires a
painful merge.  This service sits **beside** OM, never inside it.  When a new
OM version ships, update `docker-compose.yml` and you're done.
