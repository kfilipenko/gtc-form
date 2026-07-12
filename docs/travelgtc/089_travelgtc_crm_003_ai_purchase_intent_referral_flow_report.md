# TRAVELGTC-CRM-003 - AI Purchase Intent Referral Flow Report

- Project: TravelGTC
- Code: TRAVELGTC-CRM-003
- Date: 2026-07-12
- Status: Implemented and published
- Depends on: TRAVELGTC-WEB-028, TRAVELGTC-AI-004

## 1. Purpose

Add a controlled conversion step for users who write in Mira chat that they want to subscribe, register, pay, join or receive the registration link.

The official referral registration link currently used by TravelGTC:

```text
https://www.mwrlife.com/KFilip909
```

Observed public flow:

1. the referral landing page is available under `KFilip909`;
2. `Join Now` leads to `/KFilip909/join`;
3. the registration form shows sponsor `Konstantin Filipenko`;
4. the user can choose enrollment/membership options and continue toward card payment inside the official MWR Life flow.

## 2. Implemented Changes

Backend:

1. added configurable `TRAVELGTC_REFERRAL_REGISTRATION_URL`;
2. default referral URL is `https://www.mwrlife.com/KFilip909`;
3. added purchase-intent detection for phrases such as:
   - `хочу подписаться`;
   - `хочу зарегистрироваться`;
   - `пришлите ссылку`;
   - `как оплатить`;
   - `join`, `subscribe`, `registration`, `pay`;
4. account AI chat response now returns:
   - `purchase_intent`;
   - `referral_registration_url`;
5. Mira answer receives an appended registration block with the official referral link when purchase intent is detected;
6. CRM lead stage is raised to `ready_to_subscribe`;
7. CRM lead `recommended_next_step` is updated with country/terms/referral-link review instructions;
8. a high-priority `purchase_intent` task is created once per open lead;
9. a CRM internal interaction records the purchase intent and referral URL;
10. email notification is sent to the configured TravelGTC lead notification address.

## 3. CRM Meaning

`ready_to_subscribe` means the user has moved from information gathering to an explicit purchase/registration step.

Operator next action:

1. open the CRM lead;
2. review Mira conversation;
3. verify country availability and intended role: Travel Advantage Member or Lifestyle Ambassador;
4. confirm that the user understands official conditions and payment is handled only by the official MWR Life / Travel Advantage flow;
5. send or confirm the referral registration link if appropriate.

## 4. Verification

Verification scope:

1. `npm run check` in `projects/travelgtc/app`;
2. `git diff --check`;
3. live API check after service restart;
4. live authenticated AI chat request with `Хочу подписаться...`.

Result:

1. TravelGTC app check: `2 passed`, `20 passed`;
2. local purchase-intent test confirms the referral link is returned;
3. live authenticated AI chat request returned:
   - `purchase_intent = true`;
   - `referral_registration_url = https://www.mwrlife.com/KFilip909`;
   - `history_persisted = true`;
4. database check confirmed:
   - lead stage `ready_to_subscribe`;
   - `recommended_next_step` contains `KFilip909`;
   - open task `purchase_intent` with priority `high`.
