# TRAVELGTC-WEB-031 - Guest Demo Access Routing Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-031
- Date: 2026-07-28
- Status: Implemented
- Scope: Public homepage, Mira AI routing rules, fallback AI knowledge, tests

## 1. Task

Add visible guest demo access to the public site and clarify when Mira should provide each approved Travel Advantage demo link.

Approved links:

- VIP demo: `https://vip.traveladvantage.com/KFilip909`
- Free demo: `https://free.traveladvantage.com/KFilip909`

## 2. Placement

Guest demo access is placed in the homepage block:

- `MWR Life, Travel Advantage и TravelGTC`
- Travel Advantage card

This keeps the user flow clear:

1. The official site link remains the source for product identity and public verification.
2. Demo links become the practical guest-view action.
3. Referral registration remains a later action after readiness to join or purchase.

## 3. Mira Routing Rule

Mira should use these links as follows:

- Free demo: first soft discovery, cautious users, requests to view the product for free, early interface exploration.
- VIP demo: users asking about Membership, VIP/Elite, family, friends, groups, clients, points, events, Ambassador, purchase comparison or a more complete scenario before choosing membership.
- If the intent is unclear, Mira may provide both links and explain the difference briefly.

Mira must not present demo access as paid registration. Paid registration after readiness is handled separately through the partner referral registration link.

## 4. Verification Notes

Server-side DNS resolution for both demo hosts succeeded on 2026-07-28, but HTTPS requests from the server timed out during connection. The implementation therefore treats the links as approved partner links supplied by the project owner and presents them without inventing unverified page contents.

## 5. Files

- `projects/travelgtc/public/index.html`
- `projects/travelgtc/public/assets/css/site.css`
- `projects/travelgtc/public/assets/js/site.js`
- `projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts`
- `projects/travelgtc/app/src/modules/ai/miraFallback.ts`
- `projects/travelgtc/app/src/modules/ai/azureFoundryAgent.ts`
- `docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md`
- `tests/travelgtc-responsive.spec.ts`

