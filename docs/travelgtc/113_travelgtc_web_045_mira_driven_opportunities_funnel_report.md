# TRAVELGTC-WEB-045 - Mira-Driven Opportunities Funnel Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-045
- Date: 2026-07-29
- Status: Implemented
- Public page: `/events/`
- Chat route: `/mira/`

## 1. Implemented Decision

The public `Возможности` page was converted from a content-heavy scenario page into a compact motive selector.

The page now works as a fast entry point into the sales funnel:

1. user recognizes a travel/business motive;
2. user opens a short explanation block;
3. user clicks a Mira link with a stable scenario key;
4. `/mira/` preselects the approved first question;
5. the authorized chat continues the discussion and stores history in CRM.

## 2. Public Page Changes

Updated:

```text
projects/travelgtc/public/events/index.html
```

The page now contains:

1. a stronger hero section: `Выберите, зачем вам путешествия сейчас`;
2. five fast motive cards with obvious link styling;
3. five short motive sections:
   - personal travel;
   - family and close people;
   - experts, groups and clients;
   - events and club environment;
   - Ambassador and business;
4. direct CTA links to `/mira/?scenario=...`;
5. a final CTA: `Начните с мотива, а не с покупки`.

The page no longer exposes Mira's internal conversation mechanics.

## 3. Mira Routing Changes

Updated:

```text
projects/travelgtc/public/mira/index.html
projects/travelgtc/public/assets/js/site.js
```

Added approved scenario keys:

| Scenario key | First question |
|---|---|
| `personal-travel` | `Хочу путешествовать чаще. Как Travel Advantage может стать моим личным travel-инструментом?` |
| `family` | `Хочу использовать Travel Advantage для семьи и близких. Какой сценарий стоит рассмотреть?` |
| `groups` | `У меня есть группа, ученики или клиенты. Как использовать Travel Advantage для поездок и событий?` |
| `events` | `Хочу узнать о событиях, встречах и клубной среде Travel Advantage / MWR Life.` |
| `ambassador-business` | `Хочу понять, как построить business-направление вокруг Travel Advantage и роли Lifestyle Ambassador.` |

When `/mira/?scenario=groups` or another approved key is opened, the chat selector and input are prefilled with the corresponding approved question.

The question is not auto-submitted without the user's action.

## 4. Styling Changes

Updated:

```text
projects/travelgtc/public/assets/css/site.css
```

Added styles for:

1. `opportunity-sales-hero`;
2. `opportunity-link-card`;
3. `opportunity-motive`;
4. `opportunity-final-panel`;
5. desktop, tablet and mobile responsive layouts.

## 5. Documentation Changes

Updated:

1. `080_travelgtc_ai_001_mira_consultant_instruction.md`;
2. `110_travelgtc_web_045_mira_driven_opportunities_funnel_task.md`;
3. `111_travelgtc_web_045_opportunities_public_page_copy_draft.md`;
4. `112_travelgtc_ai_006_mira_opportunities_conversation_script_draft.md`;
5. `00_documentation_register.md`.

`TRAVELGTC-AI-006` is approved as the Mira scenario script for opportunity conversations.

## 6. Verification

Ran:

```bash
git diff --check
node --check projects/travelgtc/public/assets/js/site.js
npm run test:travelgtc
```

Result:

```text
27 passed
```

The Playwright test suite now verifies:

1. the motive selector page;
2. scenario links into Mira;
3. mobile viewport fit;
4. `/mira/?scenario=groups` first-question preselection;
5. existing auth-gated chat behavior;
6. public route mobile fit and favicon/contact checks.

## 7. Next Recommended Stage

Publish the approved `TRAVELGTC-AI-006` scenario script into the Azure Foundry `AI-TravelGTC` agent as the next controlled AI-instruction update.
