# TRAVELGTC-WEB-036 - Mira Page Chat-Only Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-036
- Date: 2026-07-28
- Status: Implemented and published
- Scope: `/mira/`, dedicated AI chat page, responsive tests

## 1. Problem

The dedicated Mira page repeated information that already belongs on the home relationship block:

1. Free Guest Pass explanation;
2. VIP Membership explanation;
3. direct official access buttons;
4. long introductory text before the chat.

This made `/mira/` look like another landing section instead of a focused chat workspace.

## 2. Fix

The `/mira/` page is now chat-first:

1. removed the left text column;
2. removed direct Guest Pass / VIP buttons from `/mira/`;
3. centered the AI chat panel;
4. kept the auth-gated chat behavior, starter questions, voice button and CRM history flow.

Guest Pass and VIP Membership context remains on the home page in `#relationship` and Membership sections.

## 3. Verification

Passed:

```text
npm run test:travelgtc
git diff --check
```

The Playwright suite now verifies that `/mira/` focuses on the chat and does not expose the duplicated Guest Pass / VIP access buttons.
