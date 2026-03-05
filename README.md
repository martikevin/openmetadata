# OpenMetadata – Request Access Workflow (Fork)

A **minimal fork** of [OpenMetadata](https://open-metadata.org/) that adds a
data-access request workflow.  Only **23 lines changed** in 5 existing OM files,
so pulling upstream updates is a trivial rebase.

## What changed in the OM codebase?

| File | Change | Lines |
|------|--------|-------|
| `constants.ts` | +1 route (`REQUEST_ACCESS`) | +3 |
| `sidebar.enum.ts` | +1 enum value | +1 |
| `LeftSidebar.constants.ts` | +1 nav item | +8 |
| `en-us.json` | +1 i18n label | +1 |
| `AuthenticatedAppRouter.tsx` | +1 lazy import + route | +10 |
| **Total** | | **+23** |

Everything else lives in **new, isolated files/directories** that will never
conflict with upstream:

```
request-access-backend/     ← FastAPI sidecar (own DB, own API)
request-access-frontend/    ← Standalone React app (alternative UI)
openmetadata-ui/…/pages/RequestAccessPage/  ← OM-integrated page
docker-compose.request-access.yml
```

## Merging upstream updates

```bash
git remote add upstream https://github.com/open-metadata/OpenMetadata.git
git fetch upstream main
git rebase upstream/main
# Resolve the ~5 trivial conflicts (if any) in the files above
```

## Sidecar Backend

The workflow data (requests, approvals) lives in a separate FastAPI service
that talks to OM via REST API.  Start it with:

```bash
docker compose -f docker-compose.request-access.yml up --build
```

| Service            | URL                        |
|--------------------|----------------------------|
| Backend API        | http://localhost:8000       |
| API Docs (Swagger) | http://localhost:8000/docs  |

## Workflow

1. User clicks **Request Access** in the OM sidebar
2. Selects assets (tables, dashboards, topics…) or bundles
3. Chooses a **role** (Viewer / Editor / Admin)
4. Picks a **purpose** from predefined list or writes free text
5. Owner is auto-resolved from OM metadata
6. Owner **approves / rejects** with optional comment
