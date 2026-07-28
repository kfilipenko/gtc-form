# TRAVELGTC-WEB-031 - Guest Access Routing Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-031
- Date: 2026-07-28
- Status: Implemented, terminology refined by TRAVELGTC-WEB-032
- Scope: Public homepage, Mira AI routing rules, fallback AI knowledge, tests

## 1. Task

Add visible Travel Advantage access links to the public site and clarify when Mira should provide each approved partner link.

Approved links:

- VIP Membership: `https://vip.traveladvantage.com/KFilip909`
- Free Guest Pass: `https://free.traveladvantage.com/KFilip909`

## 2. Placement

Guest access is placed in the homepage block:

- `MWR Life, Travel Advantage и TravelGTC`
- Travel Advantage card

This keeps the user flow clear:

1. The official site link remains the source for product identity and public verification.
2. Free Guest Pass becomes the practical no-card first look.
3. Referral registration remains a later action after readiness to join or purchase.

## 3. Mira Routing Rule

Mira should use these links as follows:

- Free Guest Pass: first soft discovery, cautious users, requests to view the product for free, early interface exploration.
- VIP Membership: users asking specifically about the paid VIP level or official checkout.
- Family, friends, groups, clients, points, events, Elite, Turbo or Ambassador scenarios: first compare Membership levels before sending only the VIP Membership link.
- If the intent is unclear, Mira may provide both links and explain the difference briefly.

Mira must not present Free Guest Pass as paid registration and must not call VIP Membership a trial page. Paid registration after readiness is handled separately through the partner referral registration link.

## 4. Verification Notes

The Travel Advantage pages were rechecked after the network issue was resolved. `free.traveladvantage.com/KFilip909` opens the Guest Membership / Guest Pass path, and `vip.traveladvantage.com/KFilip909` opens the VIP Membership path. TRAVELGTC-WEB-032 fixes the naming across the site and Mira context.

## 5. Files

- `projects/travelgtc/public/index.html`
- `projects/travelgtc/public/assets/css/site.css`
- `projects/travelgtc/public/assets/js/site.js`
- `projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts`
- `projects/travelgtc/app/src/modules/ai/miraFallback.ts`
- `projects/travelgtc/app/src/modules/ai/azureFoundryAgent.ts`
- `docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md`
- `tests/travelgtc-responsive.spec.ts`
