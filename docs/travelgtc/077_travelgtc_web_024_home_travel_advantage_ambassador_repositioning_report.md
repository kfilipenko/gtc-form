# TRAVELGTC-WEB-024 - Home Travel Advantage And Ambassador Repositioning Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-024
- Source task: `docs/travelgtc/076_travelgtc_web_024_home_travel_advantage_ambassador_repositioning_task.md`
- Date: 2026-07-11
- Status: Implemented and published

## 1. Summary

The TravelGTC home page was repositioned from a generic travel-network / route-creation landing page into a compliant Travel Advantage membership funnel with clear independent Lifestyle Ambassador disclosure.

The live home page now presents TravelGTC as:

```text
a partner information page of an independent Lifestyle Ambassador
```

It no longer leads with:

```text
Создавайте путешествия. Собирайте людей. Развивайте сеть.
```

The first public message now explains the relationship between:

1. MWR Life;
2. Travel Advantage;
3. TravelGTC.

## 2. Implemented Public Changes

### 2.1 Home Hero

Updated `projects/travelgtc/public/index.html`.

The hero now uses:

```text
Ваш вход в Travel Advantage
через партнёрское сопровождение TravelGTC
```

Primary CTAs:

1. `Узнать о членстве`;
2. `Задать вопрос AI-консультанту`.

The hero includes an explicit disclosure that TravelGTC is not the parent company and recommends the official project as an independent partner.

### 2.2 Partner Positioning Block

Added the first post-hero block:

```text
Мы не создаём отдельную travel-компанию. Мы рекомендуем официальный проект.
```

This block clarifies that TravelGTC explains, answers questions, records interest and routes users to an official next step.

### 2.3 Relationship Block

Added three role cards:

1. `MWR Life` - company / business side / Lifestyle Ambassador;
2. `Travel Advantage` - product / travel membership side;
3. `TravelGTC` - independent partner information page and CRM funnel.

### 2.4 Travel Advantage Membership Block

Added a compact service-category grid:

1. Hotels;
2. Flights;
3. Resorts;
4. Car Rentals;
5. Cruises;
6. Excursions;
7. Activities;
8. Ground Transport;
9. Travel Credits;
10. Member Support.

The text avoids guaranteed savings, availability or pricing claims and requires official confirmation.

### 2.5 Trust And Compliance Block

Added four safety/trust cards:

1. independent Ambassador status disclosure;
2. official source confirmation for terms and pricing;
3. no income guarantee;
4. human consultation after AI assistance.

### 2.6 Next-Step Process

Added a six-step process:

```text
AI question -> interest choice -> login/registration -> lead -> consultation -> official next step
```

This maps to the existing TravelGTC funnel and account-first lead submission model.

### 2.7 AI Consultant Stub

Added a safe front-end FAQ/stub widget in `projects/travelgtc/public/assets/js/site.js` and `projects/travelgtc/public/assets/css/site.css`.

Implemented:

1. floating `Спросить AI` button;
2. home page AI section;
3. hero CTA opening the widget;
4. canned safe answers;
5. keyword routing to lead form for registration, pricing, country, contact, link or Ambassador questions;
6. no live AI model call and no `POST /api/chat` yet.

The widget explicitly says that it does not replace official documents and does not promise income or guaranteed savings.

### 2.8 Lead Form

The home lead form was updated to the new positioning and keeps the approved registration-first model.

It does not ask again for:

1. name;
2. contact value;
3. contact channel.

Those values remain sourced from the authenticated TravelGTC profile.

New interest options:

1. `become_travel_advantage_member`;
2. `learn_travel_advantage`;
3. `learn_mwr_life`;
4. `learn_lifestyle_ambassador`;
5. `partner_model`;
6. `events`;
7. `presentation_request`;
8. `question`.

### 2.9 API Enum And Intake Stub

Updated:

1. `projects/travelgtc/app/src/modules/public-leads/types.ts`;
2. `projects/travelgtc/app/src/modules/public-leads/intakeAgentStub.ts`.

The API now accepts the new interest codes while keeping the old values for compatibility.

The Intake Agent stub now summarizes the new membership, MWR Life, Ambassador, event, presentation and general-question interests.

### 2.10 Footer And Legal Positioning

Updated footer disclosure across public pages:

1. TravelGTC is a partner information page of an independent Lifestyle Ambassador;
2. TravelGTC is not the official MWR Life or Travel Advantage site;
3. official documents, prices, membership rules, compensation plan and regional restrictions are not replaced by the site.

Footer links now include:

1. Official MWR Life;
2. Official Travel Advantage;
3. official MWR Life Income Disclosure PDF;
4. Terms of Use;
5. Privacy;
6. internal Partner Disclosure;
7. Contact.

Small visible About / Legal wording was also aligned so it no longer describes the project as the old `Travel Network Lab` public concept.

## 3. Out Of Scope Kept

Not implemented in this task:

1. live AI model integration;
2. `POST /api/chat`;
3. official enrollment flow;
4. payment handling;
5. official MWR Life / Travel Advantage API integration;
6. full rebuild of supporting pages into the new information architecture.

## 4. Publication

Static publication:

```text
projects/travelgtc/scripts/deploy_public_live.sh
```

API update:

```text
npm --prefix projects/travelgtc/app run build
sudo systemctl restart travelgtc-api.service
```

Live domain:

```text
https://travelgtc.com/
```

Live API health:

```json
{
  "ok": true,
  "service": "travelgtc-api",
  "env": "production",
  "account_lead_capture_enabled": true,
  "agent_intake_mode": "stub",
  "parent_network_mode": "none"
}
```

## 5. Verification

Local:

```text
npm run check:travelgtc-api
Result: 16 passed

npm run test:travelgtc
Result: 19 passed

npm run test:travelgtc-funnel
Result: 1 passed
```

Live:

```text
TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc
Result: 19 passed

TRAVELGTC_FUNNEL_BASE_URL=https://travelgtc.com npm run test:travelgtc-funnel
Result: 1 passed
```

Manual live marker check confirmed:

1. `Ваш вход в Travel Advantage`;
2. `партнёрская информационная`;
3. `TravelGTC AI-консультант`;
4. `become_travel_advantage_member`.

## 6. Follow-Up Recommendations

1. Create `TRAVELGTC-AI-003` for live AI consultant backend, guardrails and logged chat sessions.
2. Create a dedicated CRM view for Travel Advantage / Ambassador lead types.
3. Rebuild supporting pages into the new menu model after the home-page funnel is approved visually.
4. Confirm official replicated/referral URL and allowed regions before adding direct official-registration CTAs.
