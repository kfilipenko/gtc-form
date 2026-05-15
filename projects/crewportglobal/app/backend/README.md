# Backend Implementation Workspace

## Purpose

This directory is the implementation workspace for CrewPortGlobal backend tasks.

## Responsibility Boundary

The backend boundary includes implementation artifacts for approved backend steps, including:

1. database migrations and related operational backend notes
2. backend API implementation in approved steps
3. backend-side orchestration that remains separate from frontend-only assets

## Not Approved Here

Until explicitly approved in task scope, this directory must not contain:

1. auth/session implementation outside the current approved task
2. Stripe implementation
3. nginx or deployment runtime changes
4. OpenClaw integration changes

## Current Step

Current approved implementation step:

1. CPG-ACCESS-002: backend access guard foundation and isolated tests

The current access-control step is preparation only. It must not replace the temporary operator token, enable account sessions, apply production SQL, or expose `/admin/access/` until the next approved phases are completed.
