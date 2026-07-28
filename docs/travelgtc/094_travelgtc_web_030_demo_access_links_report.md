# TRAVELGTC-WEB-030 - Travel Advantage Access Links Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-030
- Date: 2026-07-28
- Status: Implemented, terminology refined by TRAVELGTC-WEB-032
- Approved task: `091_travelgtc_web_030_demo_access_links_task.md`

## 1. Summary

Added approved Travel Advantage access links to the public site.

Approved access links:

```text
VIP Membership:
https://vip.traveladvantage.com/KFilip909

Free Guest Pass:
https://free.traveladvantage.com/KFilip909
```

Official referral registration link remains:

```text
https://www.mwrlife.com/KFilip909
```

## 2. Public Placement

Demo links were added to:

1. home page Membership section;
2. dedicated Mira page `/mira/`;
3. public footer links across the public pages.

The home page now includes:

```text
Официальные входы Travel Advantage
Открыть VIP Membership Travel Advantage
Открыть Free Guest Pass Travel Advantage
```

The `/mira/` page includes compact direct buttons:

```text
Открыть VIP Membership
Открыть Free Guest Pass
```

All external access links open in a new tab with:

```text
target="_blank"
rel="noopener"
```

## 3. Funnel Position

Free Guest Pass access is treated as a softer pre-registration step:

```text
Interest -> Free Guest Pass -> Questions -> Membership fit -> Purchase intent -> Official referral registration
```

The implementation keeps Free Guest Pass discovery separate from paid VIP Membership and purchase intent.

## 4. Verification

Passed:

```text
npm run test:travelgtc
npm run test:travelgtc-funnel
```

Playwright verifies that the public Free Guest Pass and VIP Membership links are present on the home page and on `/mira/`.
