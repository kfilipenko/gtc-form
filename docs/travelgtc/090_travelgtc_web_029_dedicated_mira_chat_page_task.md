# TRAVELGTC-WEB-029 - Dedicated Mira Chat Page Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-029
- Date: 2026-07-28
- Status: Draft for Project Owner approval
- Depends on: TRAVELGTC-WEB-028, TRAVELGTC-CRM-003

## 1. Objective

Create a separate public route for Mira TravelGTC AI chat that can be shared as a direct link.

Proposed route:

```text
https://travelgtc.com/mira/
```

Alternative route if the Project Owner prefers a more descriptive URL:

```text
https://travelgtc.com/ai-consultant/
```

## 2. Business Purpose

The current floating chat is useful on the main site, but it is not ideal for direct outreach, social posts, messengers or follow-up messages.

The dedicated page should become a clean entry point for users who are already interested and need a focused conversation with Mira:

1. questions about Travel Advantage Membership;
2. demo access and guest discovery;
3. comparison of Membership levels;
4. family / group / client / event travel scenarios;
5. readiness to subscribe through the official referral process.

## 3. User Flow

1. User opens `/mira/`.
2. Page explains that Mira is an AI consultant for the TravelGTC partner information page.
3. If user is not authenticated, the page offers login/registration before starting the saved chat.
4. If user is authenticated, the page loads previous CRM chat history.
5. The user can continue the conversation in a larger, page-native chat surface.
6. If purchase intent appears, existing `ready_to_subscribe` CRM logic is reused.

## 4. Page Requirements

The page must:

1. use the TravelGTC logo and current site header/footer;
2. avoid duplicating the full home-page content;
3. include a full-width chat layout optimized for reading longer answers;
4. show starter prompts focused on discovery rather than final closing;
5. support Markdown rendering, links, history restore and voice input where browser support allows;
6. use the same protected account endpoint:

```text
POST /api/travelgtc/v1/account/ai/chat
GET  /api/travelgtc/v1/account/ai/chat/history
```

## 5. CRM Requirements

The page must not create a separate chat database.

All messages must continue to be saved in:

```text
travelgtc_interactions
```

under the existing/reused:

```text
source_path = ai_chat
```

lead for the authenticated user.

## 6. Acceptance Criteria

The task is complete when:

1. `/mira/` is published and directly accessible;
2. unauthenticated user is guided to login/registration;
3. authenticated user sees previous Mira history;
4. new messages are saved in CRM;
5. purchase intent still creates `ready_to_subscribe` and a high-priority task;
6. Playwright verifies desktop and mobile layout;
7. live smoke check confirms the page works on `travelgtc.com`.

## 7. Approval Question

Approve route:

```text
/mira/
```

or replace it with:

```text
/ai-consultant/
```
