# TRAVELGTC-WEB-026 - Authorized AI Chat And CRM Channel Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-026
- Date: 2026-07-12
- Status: Approved by Project Owner and implemented through WEB-027
- Depends on: `TRAVELGTC-AI-003`

## 1. Objective

Turn the public AI chat from a floating helper into an authorized user engagement channel connected to CRM.

The chat should become a separate, manageable interface that can:

1. greet the user warmly;
2. display structured AI answers;
3. be minimized and restored;
4. be moved on desktop;
5. require registration/login before conversation starts;
6. save chat history against the TravelGTC user profile;
7. show chat activity in CRM.

## 2. Problems To Fix

Current limitations:

1. AI answers are shown as dense text, without line breaks, bullets or visual rhythm.
2. The chat is fixed to the page and cannot be moved or temporarily minimized.
3. The conversation does not start with a warm guided onboarding sequence.
4. Anonymous chat prevents user history, follow-up and personalized document/link delivery.
5. Chat messages are not stored as CRM timeline events.
6. The sales path is not yet connected to membership-level qualification.

## 3. UX Requirements

### 3.1 Structured Message Rendering

The frontend should render safe structured chat text:

1. paragraphs;
2. line breaks;
3. short bullet lists;
4. emoji markers;
5. clickable official links;
6. clear CTA buttons where appropriate.

Allowed formatting should be limited and sanitized.

### 3.2 Independent Chat Window

The widget should support:

1. minimize;
2. restore;
3. close-to-launcher;
4. desktop drag;
5. mobile bottom-sheet mode;
6. viewport boundary protection so the widget cannot be dragged off-screen.

### 3.3 Greeting Flow

Mira should open with a friendly welcome and 2-3 starter chips.

Example:

```text
Привет, я Мира 🌍
Помогу понять, какой формат Travel Advantage может быть интересен именно вам.
```

Starter chips:

1. `Подобрать уровень Membership`;
2. `Путешествия с семьёй`;
3. `Хочу узнать про Ambassador`.

### 3.4 Authorization Gate

Before sending the first chat message to the AI API, the site should require:

1. registration;
2. login; or
3. active TravelGTC session.

Expected behavior:

1. user clicks chat;
2. chat explains that history and follow-up require login;
3. user is sent to `/auth/`;
4. after login/registration user returns to the chat;
5. the originally selected starter question is preserved where possible.

## 4. Backend Requirements

Add project-local chat persistence.

Suggested tables:

```text
travelgtc_ai_chat_sessions
travelgtc_ai_chat_messages
```

Suggested session fields:

1. `id`;
2. `user_id`;
3. `lead_id` nullable;
4. `status`;
5. `primary_intent`;
6. `premium_candidate_score`;
7. `created_at`;
8. `updated_at`.

Suggested message fields:

1. `id`;
2. `session_id`;
3. `role`;
4. `content`;
5. `source`;
6. `metadata`;
7. `created_at`.

## 5. API Requirements

Add or extend endpoints:

```text
POST /api/travelgtc/v1/account/ai/chat
GET  /api/travelgtc/v1/account/ai/chat/sessions
GET  /api/travelgtc/v1/account/ai/chat/sessions/:id
```

Anonymous endpoint may remain disabled or return:

```text
auth_required
```

## 6. CRM Requirements

CRM should show chat activity as part of the user/lead timeline:

1. latest AI chat session;
2. detected interest;
3. premium membership candidate signal;
4. user questions;
5. Mira summary;
6. recommended next human action.

The CRM should help the operator see whether the user is:

1. only curious;
2. comparing membership levels;
3. interested in premium membership;
4. ready for partner contact;
5. interested in Ambassador role.

## 7. Compliance Requirements

The chat must store consent-aware data only.

Required privacy/terms review:

1. explain that AI chat history may be stored in the TravelGTC profile;
2. explain that chat history may be used to answer the user and support follow-up;
3. avoid storing official-company credentials, payment details or sensitive documents in chat;
4. keep TravelGTC project-local user data separated from other GTC projects.

## 8. Acceptance Criteria

The task is complete when:

1. anonymous users are asked to login/register before sending AI messages;
2. authenticated users can chat with Mira;
3. chat messages are stored against the user profile;
4. CRM shows chat history or summary for the user;
5. chat can be minimized/restored;
6. desktop chat can be moved;
7. mobile chat remains usable;
8. AI messages render with readable structure;
9. tests cover auth gate, chat persistence and CRM visibility.

## 9. Approval Requirement

This task has been approved by the Project Owner and implemented through `087_travelgtc_web_027_authorized_movable_ai_chat_report.md`.

Approved implementation choices:

1. authorization-before-chat model;
2. chat history is stored in the TravelGTC user profile and CRM interactions;
3. CRM visibility uses the existing lead timeline and an automatically created `ai_chat` lead;
4. anonymous users may open the widget and choose a question, but sending the question requires login/registration;
5. final Mira instruction is the published Azure version 10 from `TRAVELGTC-AI-004`.
