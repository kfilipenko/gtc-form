# TRAVELGTC-WEB-029 - Dedicated Mira Chat Page Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-029
- Date: 2026-07-28
- Status: Implemented and ready for live publication
- Approved task: `090_travelgtc_web_029_dedicated_mira_chat_page_task.md`

## 1. Summary

Implemented a separate public Mira TravelGTC AI chat page.

Published route:

```text
/mira/
```

The page is designed as a direct link destination for social posts, messenger follow-ups, CRM continuation and user onboarding before Travel Advantage registration.

## 2. Implemented Files

```text
projects/travelgtc/public/mira/index.html
projects/travelgtc/public/assets/css/site.css
projects/travelgtc/public/assets/js/site.js
tests/travelgtc-responsive.spec.ts
projects/travelgtc/scripts/deploy_public_live.sh
```

## 3. Functional Behavior

The `/mira/` page:

1. uses the TravelGTC logo and current public header/footer;
2. displays a full page-native chat surface;
3. keeps the same protected endpoint as the floating widget;
4. loads saved CRM chat history for authenticated users;
5. redirects unauthenticated users to TravelGTC registration/login before sending a question;
6. returns the user to `/mira/#ai-consultant` after registration;
7. supports starter prompts, Markdown rendering and browser voice input when available.

No separate chat database was created.

The page continues using:

```text
POST /api/travelgtc/v1/account/ai/chat
GET  /api/travelgtc/v1/account/ai/chat/history
```

## 4. CRM Continuity

Chat messages continue to be stored in:

```text
travelgtc_interactions
```

under the existing `ai_chat` lead/source path for the authenticated user.

Purchase intent handling remains unchanged:

```text
ready_to_subscribe
```

and continues to use the official referral registration link when the user is ready to subscribe.

## 5. Verification

Passed:

```text
npm run test:travelgtc-api
npm run check:travelgtc-api
npm run test:travelgtc
npm run test:travelgtc-funnel
```

Relevant Playwright coverage:

1. `/mira/` renders;
2. page chat is visible;
3. starter prompts are present;
4. voice button exists;
5. unauthenticated submit redirects to `/auth/?mode=register&next=%2Fmira%2F%23ai-consultant`;
6. `/mira/` fits mobile viewport.

