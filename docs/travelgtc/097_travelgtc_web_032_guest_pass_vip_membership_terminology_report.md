# TRAVELGTC-WEB-032 - Free Guest Pass And VIP Membership Terminology Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-032
- Date: 2026-07-28
- Status: Implemented
- Scope: Public site, Mira page, AI context, documentation, responsive tests

## 1. Reason

The Travel Advantage partner links were initially described too broadly. After checking the live pages, the approved terminology is more precise:

- `https://free.traveladvantage.com/KFilip909` is Free Guest Pass / Guest Membership.
- `https://vip.traveladvantage.com/KFilip909` is VIP Membership and leads toward the official VIP checkout flow.

TravelGTC must therefore avoid calling the VIP path a trial page and must present the free path as a guest first-look option.

## 2. Public Naming

Public labels now use:

- Free Guest Pass
- VIP Membership
- Official Travel Advantage access

The home page explains that Free Guest Pass is a soft first look without a credit card, while VIP Membership is the official paid VIP membership path.

## 3. Mira Routing

Mira uses the links as follows:

- Free Guest Pass: first look, cautious user, no-card access, user wants to see the platform before paying.
- VIP Membership: user specifically asks for VIP Membership, paid VIP access or checkout.
- Membership comparison first: family, friends, groups, clients, points, Elite, Turbo, Ambassador or business-use scenarios.

If user intent is unclear, Mira may provide both links and explain the difference briefly.

## 4. Files Updated

- `projects/travelgtc/public/index.html`
- `projects/travelgtc/public/mira/index.html`
- `projects/travelgtc/public/assets/js/site.js`
- `projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts`
- `projects/travelgtc/app/src/modules/ai/miraFallback.ts`
- `projects/travelgtc/app/src/modules/ai/azureFoundryAgent.ts`
- `docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md`
- `tests/travelgtc-responsive.spec.ts`

## 5. Verification

Passed:

```text
npm run test:travelgtc-api
npm --prefix projects/travelgtc/app run build
npm run check:travelgtc-api
npm run test:travelgtc
npm run test:travelgtc-funnel
git diff --check
```

External link check from the server:

```text
https://free.traveladvantage.com/KFilip909 -> HTTP 200, Guest Membership / Guest Pass, no credit card wording, 1 hotel booking / 2 nights limit visible.
https://vip.traveladvantage.com/KFilip909 -> HTTP 200, VIP Membership, Start Saving Today, VIP checkout route visible.
```

Live smoke checks passed:

```text
https://travelgtc.com/
https://travelgtc.com/mira/
https://travelgtc.com/api/travelgtc/v1/health
```
