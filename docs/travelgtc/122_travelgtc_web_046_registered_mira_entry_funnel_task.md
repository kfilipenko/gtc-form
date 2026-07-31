# TRAVELGTC-WEB-046 - Registered Mira Entry Funnel Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-046
- Date: 2026-07-30
- Status: Implemented and published on 2026-07-30; see `123_travelgtc_web_046_registered_mira_entry_funnel_report.md`
- Depends on: `TRAVELGTC-WEB-038`, `TRAVELGTC-WEB-045`, `TRAVELGTC-WEB-026`, `TRAVELGTC-AI-013`

## 1. Objective

Make a TravelGTC account the clear first step before a visitor enters a conversation with Mira.

The product decision is intentional: public pages, official links and guest-access links remain available without an account. A personal conversation with Mira, saved dialogue history, tailored materials, referral-link guidance and CRM follow-up require an authenticated TravelGTC account.

Registration is not presented as a technical barrier. It is presented as creating a personal TravelGTC profile that keeps the selected travel scenario, conversation and next official step together.

## 2. Target User Journey

```text
Public page / scenario card
  -> selected scenario is preserved
  -> registration or sign-in
  -> authenticated redirect to /mira/?scenario=<key>
  -> Mira welcomes the user by name and starts the selected scenario
  -> messages and detected interest are stored in CRM
  -> official next step or human correspondence when needed
```

Approved public scenario keys:

1. `personal-travel`;
2. `family`;
3. `groups`;
4. `events`;
5. `ambassador-business`;
6. `next-step`.

## 3. Public Link Behaviour

All public CTA links that currently lead to `/mira/` must preserve the selected scenario.

For a visitor without an active TravelGTC session:

1. route to `/auth/?next=/mira/?scenario=<key>` using safe URL encoding;
2. show concise auth-page context: `Создайте профиль TravelGTC, чтобы сохранить выбранный сценарий, продолжить разговор с Мирой и получать материалы по вашему запросу.`;
3. after successful registration or login, return exactly to the requested Mira route;
4. do not lose the scenario, prefilled opening message or source page.

For an authenticated visitor:

1. open `/mira/?scenario=<key>` directly;
2. start or resume the user's existing CRM-linked chat session;
3. do not ask for registration again.

## 4. Mira Page Requirements

The Mira route must not expose a usable text input or starter-question controls to anonymous visitors.

Instead, show a compact entry panel:

```text
Продолжите с Мирой в своём профиле
Создайте аккаунт или войдите, чтобы сохранить разговор,
получать материалы и возвращаться к выбранному travel-сценарию.

[Войти] [Создать аккаунт]
```

The panel must preserve any scenario key and source context. It must not promise that documents, prices or personal offers will be available before their official conditions are checked.

For authenticated visitors, preserve the current full Mira interface:

1. scenario-aware greeting;
2. first-question selector;
3. structured conversation;
4. stored history;
5. CRM timeline events and lead qualification.

## 5. Agent Instruction Update

The Mira instruction must reflect the registered-first funnel.

Mira should:

1. greet the authenticated visitor personally and acknowledge the chosen scenario when present;
2. treat a returning user as a continuation of the same conversation, not as a new anonymous lead;
3. use saved context carefully and ask one useful next question rather than repeat a presentation;
4. never request passwords, payment-card data or official MWR Life credentials in chat;
5. explain that official registration, pricing and service availability are confirmed through official MWR Life / Travel Advantage resources;
6. when a visitor is not authenticated, not attempt an AI conversation through a fallback response; the web interface must guide the visitor into registration/sign-in first.

## 6. CRM and Consent Requirements

After authentication, the first chat session must be associated with the TravelGTC-local user and its CRM lead.

Required CRM context:

1. selected scenario;
2. entry source page and CTA where available;
3. first user question;
4. subsequent messages and reactions;
5. detected interest and next recommended action;
6. timestamps and consent-aware account identity.

No chat messages, contact data or persistent lead record may be created for an unauthenticated visitor solely because they opened a public page.

## 7. Acceptance Criteria

The task is complete when:

1. every public scenario CTA preserves its `scenario` value through registration/login;
2. anonymous visitors cannot send a message to Mira;
3. the auth route returns the user to the intended Mira scenario after successful login/registration;
4. authenticated users retain the selected scenario and can begin the corresponding conversation;
5. the first saved message has scenario and source context in CRM;
6. a returning user sees chat history and a continuation-oriented greeting;
7. existing public official links, Free Guest Pass and VIP Membership links remain accessible without TravelGTC registration;
8. automated tests cover anonymous gate, auth return URL validation, scenario preservation, CRM persistence and mobile rendering;
9. the agent instruction is updated and the intended Azure agent version is published only after local and live dialogue checks pass.

## 8. Implementation Boundaries

This task does not change MWR Life / Travel Advantage registration, payment or membership conditions. TravelGTC registration remains project-local and is used only for TravelGTC conversation history, CRM and follow-up.

The task does not authorize collection of sensitive documents, payment details or credentials in TravelGTC chat.

## 9. Planned Deliverables

1. public CTA and auth-return routing update;
2. anonymous Mira-entry panel;
3. scenario and source preservation across registration/login;
4. CRM chat-session context update;
5. revised Mira registered-first instruction and Azure publication record;
6. responsive and end-to-end verification report.
