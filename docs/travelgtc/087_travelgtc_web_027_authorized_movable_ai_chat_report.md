# TRAVELGTC-WEB-027 - Authorized Movable AI Chat Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-027
- Date: 2026-07-12
- Status: Implemented and published
- Depends on: TRAVELGTC-WEB-026, TRAVELGTC-AI-004

## 1. Purpose

Turn the public Mira chat from a static helper into an authorized, readable and CRM-visible engagement channel.

## 2. Implemented Frontend Changes

The home-page AI widget now supports:

1. structured rendering of Mira answers from Markdown-like text;
2. paragraphs, headings, bullet lists, bold fragments and clickable links;
3. warmer preparation messages while Mira is answering;
4. simpler sales-oriented starter questions:
   - `Путешествую с семьёй`;
   - `Подобрать тариф`;
   - `Есть группа или клиенты`;
5. minimize / restore through the launcher button;
6. desktop drag using the widget header;
7. viewport-safe stored desktop position;
8. mobile bottom placement without drag;
9. authorization-first behavior before sending the first AI question.

## 3. Authorization Flow

The user may open the chat and select a question anonymously, but the question is not sent to the AI API until the user has an active TravelGTC session.

If the user is anonymous:

1. the widget explains why login/registration is required;
2. the selected question is stored in browser session storage;
3. the user is redirected to `/auth/`;
4. after login/registration the user returns to `/#ai-consultant`;
5. the preserved question is submitted automatically.

## 4. Backend Changes

Added protected account AI routes:

```text
POST /api/travelgtc/v1/account/ai/chat
GET  /api/travelgtc/v1/account/ai/chat/history
```

The existing anonymous endpoint remains available internally, but the public widget now uses the account endpoint.

## 5. CRM Persistence

For authenticated AI chat in production:

1. TravelGTC creates or reuses an AI lead for the user with `source_path = ai_chat`;
2. the user question is stored as an inbound `travelgtc_interactions` row;
3. Mira's answer is stored as an outbound `travelgtc_interactions` row;
4. the CRM lead stage is raised to `membership_interest` when the conversation contains tariff, Elite, Turbo, points, Ambassador, group/client, retreat, yoga, qigong or business intent;
5. a CRM task is created on the first AI chat lead so the team can review the conversation.

This keeps AI dialogue inside the existing CRM model instead of creating a separate disconnected chat database.

## 6. Legal Copy

Updated public legal pages:

1. `projects/travelgtc/public/legal/privacy/index.html`;
2. `projects/travelgtc/public/legal/terms/index.html`.

The pages now disclose that the AI chat works after login and that chat history may be stored in the TravelGTC profile and CRM for consultation continuity.

## 7. Verification

Verification scope:

1. `node --check projects/travelgtc/public/assets/js/site.js`;
2. `npm run check` in `projects/travelgtc/app`;
3. `git diff --check`;
4. `npm run test:travelgtc`;
5. live API health after deployment;
6. anonymous live account chat request returns `auth_required`;
7. authenticated live AI chat request returns Azure agent answer;
8. CRM/history persistence check returns two stored turns: inbound user question and outbound Mira answer.

Result:

1. TravelGTC app check: `2 passed`, `19 passed`;
2. Playwright responsive/site suite: `21 passed`;
3. live account AI chat persisted successfully with `history_persisted = true`.

## 8. Remaining Follow-Up

Future refinements:

1. show a dedicated user-facing chat history screen;
2. add a team CRM filter for AI-chat leads;
3. add transcript summary generation after long conversations;
4. connect approved referral links when the Project Owner provides final official links.
