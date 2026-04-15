# Chat Documentation Execution Report

Date: 2026-03-17
Scope: normalize chat documentation to a single operational model with 3 chats and remove role/url ambiguity.

## 1. Target model (must become single source of truth)

1. Admin chat (GTC operations): https://app.gtstor.com/chat/
2. User chat (end-user workspace): https://app.gtstor.com/user/
3. RJAKA game chat: https://rjaka.pro/chat/

Notes:
- RJAKA history route remains transitional: https://rjaka.pro/chat/history/
- Legacy routes /game-chat.html and /chat-qa.html remain compatibility aliases only.

## 2. What is causing confusion now

1. Role conflict in GTSTOR docs:
- Some docs map user chat to /chat/index.html and admin chat to /chat/internal/index.html, conflicting with current operating model (/chat admin, /user user).

2. URL conflict in RJAKA docs:
- Many docs still present /game-chat.html and /chat-qa.html as primary routes instead of /chat and /chat/history.

3. Mixed generation docs:
- Runtime/cutover evidence and legacy planning docs are mixed with current reference docs without explicit status labels.

## 3. Documentation storage structure (current)

1. App-level authoritative docs:
- docs/apps/gtc-core-web/APP.md
- docs/apps/rjaka-web/APP.md
- docs/apps/payment-web/APP.md

2. Chat behavior and contracts:
- docs/chat-admin-current.md
- docs/chat-user-current.md
- docs/rjaka-game-chat.md
- docs/chat-service-spec.md
- docs/chat-architecture-target.md
- docs/chat_architecture.md

3. Migration/cutover planning and dependency docs:
- docs/migration-blueprint-v1.md
- docs/dependency-map.md
- docs/route-compatibility-plan.md
- docs/final-package-index-20260305.md

4. Operational registry/governance:
- docs/ops/server-applications-registry.md
- docs/ops/storage-architecture-standard.md

5. Runtime evidence:
- docs/runtime/*

## 4. Execution plan (for immediate implementation)

### Phase A (critical, same day)

1. Lock canonical role+URL matrix in reference docs.
Files:
- docs/chat-admin-current.md
- docs/chat-user-current.md
- docs/apps/gtc-core-web/APP.md
- docs/apps/rjaka-web/APP.md
Action:
- Add a short "Canonical chat matrix" block with 3 chats and URLs.

2. Resolve role mismatch in dependency map.
File:
- docs/dependency-map.md
Action:
- Replace conflicting GTSTOR role descriptions with canonical mapping:
  - /chat/ = admin chat
  - /user/ = user chat
- Keep /chat/internal/ only if explicitly marked as legacy/internal route.

3. Normalize RJAKA primary route language.
Files:
- docs/rjaka-game-chat.md
- docs/project-overview.md (if RJAKA references exist)
Action:
- Mark /chat/ as primary RJAKA entrypoint.
- Keep /game-chat.html and /chat-qa.html as compatibility aliases.

### Phase B (high priority, 1-2 days)

1. Mark document status explicitly.
Files:
- docs/chat_architecture.md
- docs/migration-blueprint-v1.md
- docs/rjaka-new-site-mvp-wireframe-20260305.md
Action:
- Add frontmatter/status header in each file:
  - status: current | transitional | legacy | historical
- For legacy/historical docs, add top warning block with pointer to current docs.

2. Clean old RJAKA public links.
Files:
- docs/rjaka-new-site-mvp-wireframe-20260305.md
- docs/route-compatibility-plan.md
Action:
- Replace app.gtstor.com/game-chat.html and app.gtstor.com/chat-qa.html as "primary" references.
- Keep only as migration examples.

3. Create one index for chat docs navigation.
Create:
- docs/chat-docs-index.md
Action:
- Group docs by "Current", "Transitional", "Historical", "Runtime evidence".
- Put canonical matrix at top.

### Phase C (stabilization, 3-5 days)

1. Archive-only separation for runtime evidence.
Action:
- Keep docs/runtime untouched as evidence.
- Add note in index: runtime files are immutable records, not operating reference.

2. Governance rule for future edits.
Files:
- docs/ops/governance-standard.md
- docs/apps/README.md
Action:
- Add requirement: any chat route/role change must update canonical matrix and both app APP.md docs in the same PR.

## 5. File-by-file change list (execution backlog)

Priority P0:
- docs/chat-admin-current.md
- docs/chat-user-current.md
- docs/dependency-map.md
- docs/rjaka-game-chat.md
- docs/apps/gtc-core-web/APP.md
- docs/apps/rjaka-web/APP.md

Priority P1:
- docs/chat_architecture.md
- docs/migration-blueprint-v1.md
- docs/rjaka-new-site-mvp-wireframe-20260305.md
- docs/route-compatibility-plan.md
- docs/project-overview.md

Priority P2:
- docs/ops/governance-standard.md
- docs/apps/README.md
- docs/chat-docs-index.md (new)

## 6. Acceptance criteria

1. Any engineer can answer in under 30 seconds:
- Which URL is admin chat?
- Which URL is user chat?
- Which URL is RJAKA game chat?

2. No current-reference document describes conflicting role mapping for /chat and /user.

3. No current-reference document presents /game-chat.html or /chat-qa.html as primary RJAKA routes.

4. Every legacy/historical document has explicit status and pointer to current source of truth.

5. A single index page exists and links all chat docs by status.

## 7. Recommended implementation order for the next PR

1. P0 files only + new docs/chat-docs-index.md
2. Reviewer check against acceptance criteria
3. P1 and P2 as follow-up PRs

## 8. Operational guardrail

Before merging any chat-doc PR:
1. Verify URL matrix consistency across:
- docs/chat-admin-current.md
- docs/chat-user-current.md
- docs/rjaka-game-chat.md
- docs/apps/gtc-core-web/APP.md
- docs/apps/rjaka-web/APP.md
2. Verify no new primary references to legacy RJAKA routes.
3. Add a short changelog entry in PR description: "Chat docs matrix updated".
