# CrewPortGlobal Backend API (CPG-BE-002 scaffold)

## Scope

This directory contains minimal endpoint scaffolding for the next implementation step:

- CPG-BE-002: registration draft API endpoints

This scaffold intentionally contains no business logic and no DB wiring.

## Planned endpoints

- POST /api/v1/registration/drafts
- GET /api/v1/registration/drafts/{draft_id}
- PATCH /api/v1/registration/drafts/{draft_id}

## Current status

- endpoint contracts: created
- handler stubs: created
- persistence logic: not implemented
- auth/session logic: not implemented

## Out of scope here

- password hashing
- login sessions
- public form wiring
- deployment/nginx/openclaw/stripe changes
