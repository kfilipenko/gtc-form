# TRAVELGTC-WEB-045 - Mira-Driven Opportunities Funnel Task

- Project: TravelGTC
- Code: TRAVELGTC-WEB-045
- Date: 2026-07-29
- Status: Approved by Project Owner and implemented by report 113
- Target page: `/events/`
- Target chat route: `/mira/`

## 1. Objective

Transform the `Возможности` page from a content-heavy sales explanation into a short motive selector that starts a guided Mira conversation.

The page should not try to close the sale by itself. Its job is to help the visitor recognize their motive and click into a prepared Mira dialogue.

Mira then continues the sale:

1. greets the user;
2. confirms the selected motive;
3. asks discovery questions;
4. explains relevant Travel Advantage / MWR Life possibilities;
5. compares Membership where needed;
6. offers Free Guest Pass, VIP Membership, official referral registration or TravelGTC support depending on readiness.

## 2. Core Product Decision

Split `Возможности` into two layers:

1. **Public page copy**: short, emotional, motive-based, no internal sales mechanics.
2. **Mira script**: detailed discovery questions, scenario logic, Membership routing and next-step handling.

## 3. Scenario Keys

Use stable URL scenario keys instead of sending long user-visible prompts in URLs.

Approved draft keys:

| Scenario | URL key | Purpose |
|---|---|---|
| Personal travel | `personal-travel` | User wants to travel more often and use Travel Advantage personally. |
| Family and close people | `family` | User wants travel for family, friends, gifts or shared memories. |
| Experts, groups and clients | `groups` | User has students, clients, audience, retreat/sport/wellness groups or wants to create group trips. |
| Events and club environment | `events` | User is motivated by meetings, community, presentations and useful acquaintances. |
| Ambassador and business | `ambassador-business` | User wants to build a partner direction around travel and recommendations. |

Example route:

```text
/mira/?scenario=family
```

The frontend must map this key to an approved first question. Do not pass arbitrary raw prompts into Mira from the URL.

## 4. Implementation Stages

### Stage 1 - Text Approval

Create and approve:

1. short public page copy;
2. Mira scenario script;
3. scenario key to first-question mapping.

No page implementation until text is approved.

### Stage 2 - Page Implementation

After approval:

1. rewrite `/events/` as a compact motive selector;
2. keep one short paragraph per scenario;
3. add CTA links to `/mira/?scenario=...`;
4. remove long explanatory content from the public page;
5. keep legal footer/disclosures.

### Stage 3 - Mira Scenario Routing

After approval:

1. update `/mira/` to read `scenario` from the URL;
2. map the key to approved first question text;
3. prefill or start the first question through the existing auth-gated flow;
4. save the selected scenario in CRM interaction context where practical;
5. update Mira knowledge/instruction with the approved script.

### Stage 4 - Verification

Verify:

1. `/events/` is compact and motive-led;
2. each CTA opens `/mira/?scenario=...`;
3. invalid scenario keys are ignored safely;
4. first question is preserved through login/registration;
5. mobile layout has no horizontal overflow;
6. tests cover scenario links and Mira prefilled question behavior.

## 5. Working Documents

| Document | Purpose |
|---|---|
| `109_travelgtc_web_044_opportunities_sales_copy_draft.md` | Original rich copy draft; now used as source material. |
| `111_travelgtc_web_045_opportunities_public_page_copy_draft.md` | Short public motive-selector copy for `/events/`. |
| `112_travelgtc_ai_006_mira_opportunities_conversation_script_draft.md` | Detailed Mira conversation script by scenario. |
