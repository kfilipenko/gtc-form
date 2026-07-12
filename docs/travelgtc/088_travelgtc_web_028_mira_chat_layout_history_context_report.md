# TRAVELGTC-WEB-028 - Mira Chat Layout History Context Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-028
- Date: 2026-07-12
- Status: Implemented and published
- Depends on: TRAVELGTC-WEB-027, TRAVELGTC-AI-004

## 1. Purpose

Fix the post-publication Mira chat UX issues found during live review:

1. the lower input controls were partially hidden in the viewport;
2. the dark header looked crowded and did not clearly present the TravelGTC brand;
3. closing and reopening the chat did not restore CRM chat history from the server;
4. Mira answered as if every message were a new dialogue instead of a continuation of the sales funnel.

## 2. Implemented Changes

Frontend:

1. replaced the cramped avatar header with the TravelGTC logo and the label `AI-чат по Travel Advantage`;
2. changed the widget to an explicit open state, hiding the floating launcher while the panel is open;
3. changed the panel layout to fixed header / starters / flexible messages / fixed input / lead link;
4. added viewport correction after opening a saved desktop chat position;
5. loaded authenticated chat history from `/api/travelgtc/v1/account/ai/chat/history` when the widget opens;
6. displayed a returning-user greeting before restored CRM messages.

Backend:

1. loaded the latest saved CRM chat turns before asking Azure;
2. passed the previous user and Mira messages into the Azure agent request as CRM continuation context;
3. instructed Mira to greet the returning user and continue the needs-discovery conversation instead of starting from zero.

## 3. Business Process Effect

The AI chat now behaves as a CRM stage:

1. anonymous user sees the registration gate;
2. authenticated user sees prior Mira dialogue;
3. new messages continue the same CRM-linked conversation;
4. Mira can qualify family, friends, group, client, event, Elite, Turbo add-on and Ambassador needs using the accumulated context.

## 4. Verification

Verification scope:

1. `node --check projects/travelgtc/public/assets/js/site.js`;
2. `npm run check` in `projects/travelgtc/app`;
3. `git diff --check`;
4. responsive Playwright suite before publication;
5. live API and authenticated chat history checks after publication.

Result:

1. TravelGTC app check: `2 passed`, `19 passed`;
2. Playwright responsive/site suite: `21 passed`;
3. live authenticated two-message chat returned `history_persisted = true`;
4. live history endpoint returned four saved turns: inbound / outbound / inbound / outbound;
5. live browser geometry check confirmed the chat form and panel bottom fit inside a 1280x900 viewport.
