# TRAVELGTC-WEB-046 - Registered Mira Entry Funnel Report

- Project: TravelGTC
- Date: 2026-07-30
- Status: Implemented and published
- Depends on: `TRAVELGTC-WEB-038`, `TRAVELGTC-WEB-045`, `TRAVELGTC-WEB-026`, `TRAVELGTC-AI-013`

## Delivered Flow

1. Public pages, official resources, Free Guest Pass and VIP Membership links remain open.
2. A public Mira scenario CTA now carries its approved `scenario`, `source` and CTA identifier to the authentication route.
3. A visitor without a TravelGTC session sees a compact `/mira/` entry panel with sign-in and registration actions. The message list, first-question selector and send form remain hidden.
4. The legacy public chat API now returns `401 authentication_required`, preventing a conversation from bypassing the profile gate.
5. Successful login or registration returns the visitor to the exact `/mira/?scenario=...` route.
6. An authenticated visitor sees the full Mira conversation UI. The selected scenario is sent with the account chat request and stored with both CRM interaction records.

## CRM And Agent Context

- Account chat interaction metadata now records `entry.scenario`, `entry.source` and `entry.cta`.
- The server privately enriches each authenticated Azure request with the profile display name and selected scenario. It does not alter the user message retained in CRM.
- Mira Azure version `17` was published with the registered-first instruction: personal continuation, scenario-aware opening, no anonymous fallback conversation, and no request for passwords, payment data, verification codes, identity documents or MWR Life credentials.
- Runtime variable: `TRAVELGTC_AZURE_AI_AGENT_VERSION=17`.

## Verification

1. `npm run check` in `projects/travelgtc/app`: 31 tests passed.
2. `npm run test:travelgtc` in repository root: 27 Playwright tests passed, including desktop/tablet/mobile checks and the guest-to-registration scenario route.
3. `git diff --check`: passed.
4. Public sync: `projects/travelgtc/scripts/deploy_public_live.sh` completed.
5. Live health: `https://travelgtc.com/api/travelgtc/v1/health` returned `ok: true`, `ai_chat_mode: azure`, agent version `17`.
6. Live HTML checks confirmed the guest entry gate on `/mira/`, hidden chat controls, preserved `/events/` scenario URLs and auth context markup.

## Boundary

This release does not change MWR Life / Travel Advantage registration, pricing, payment or membership rules. TravelGTC login is limited to this project’s conversation history, CRM continuity and follow-up.
