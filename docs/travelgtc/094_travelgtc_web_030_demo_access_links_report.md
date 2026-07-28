# TRAVELGTC-WEB-030 - Travel Advantage Demo Access Links Report

- Project: TravelGTC
- Code: TRAVELGTC-WEB-030
- Date: 2026-07-28
- Status: Implemented and ready for live publication
- Approved task: `091_travelgtc_web_030_demo_access_links_task.md`

## 1. Summary

Added approved Travel Advantage demo access links to the public site.

Approved demo links:

```text
VIP demo:
https://vip.traveladvantage.com/KFilip909

Free demo:
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
Demo-доступ Travel Advantage
Открыть VIP demo Travel Advantage
Открыть free demo Travel Advantage
```

The `/mira/` page includes compact direct buttons:

```text
Открыть VIP demo
Открыть free demo
```

All external demo links open in a new tab with:

```text
target="_blank"
rel="noopener"
```

## 3. Funnel Position

Demo access is now treated as a softer pre-registration step:

```text
Interest -> Demo -> Questions -> Membership fit -> Purchase intent -> Official referral registration
```

The implementation keeps demo access separate from purchase intent.

## 4. Verification

Passed:

```text
npm run test:travelgtc
npm run test:travelgtc-funnel
```

Playwright verifies that the public demo links are present on the home page and on `/mira/`.

