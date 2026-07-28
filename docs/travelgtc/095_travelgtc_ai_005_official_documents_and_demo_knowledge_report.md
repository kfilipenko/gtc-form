# TRAVELGTC-AI-005 - Official Documents And Demo Knowledge Report

- Project: TravelGTC
- Code: TRAVELGTC-AI-005
- Date: 2026-07-28
- Status: Implemented in TravelGTC context and fallback logic
- Approved task: `092_travelgtc_ai_005_official_documents_and_demo_knowledge_task.md`

## 1. Summary

Updated Mira TravelGTC knowledge boundaries so the AI flow distinguishes:

1. demo / discovery links;
2. official Membership documents;
3. official referral registration after purchase intent.

## 2. Updated Knowledge Sources

Updated:

```text
docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md
projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts
projects/travelgtc/app/src/modules/ai/miraFallback.ts
projects/travelgtc/app/src/modules/ai/azureFoundryAgent.ts
projects/travelgtc/public/assets/js/site.js
```

## 3. Demo Link Behavior

Mira may now provide:

```text
VIP demo:
https://vip.traveladvantage.com/KFilip909

Free demo:
https://free.traveladvantage.com/KFilip909
```

when the user asks to:

1. see the platform;
2. use demo access;
3. compare free/VIP demo;
4. look before paying or registering;
5. understand the interface before Membership selection.

## 4. Purchase Intent Separation

The API now treats demo-before-payment questions as discovery, not as immediate purchase intent.

Example:

```text
Хочу посмотреть demo Travel Advantage перед оплатой.
```

does not create `purchase_intent=true`.

When the user clearly wants to subscribe, pay, register or asks for the registration link, the existing referral flow is still used:

```text
https://www.mwrlife.com/KFilip909
```

## 5. Verification

Passed:

```text
npm run test:travelgtc-api
npm run check:travelgtc-api
```

Vitest coverage confirms:

1. demo intent returns both demo links;
2. demo intent does not mark purchase intent;
3. purchase intent still returns the referral registration URL.

