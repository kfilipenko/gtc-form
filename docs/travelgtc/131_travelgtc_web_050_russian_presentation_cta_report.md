# TRAVELGTC-WEB-050 - Russian Presentation CTA Report

- Project: TravelGTC
- Date: 2026-07-31
- Status: Implemented
- Public route: `https://travelgtc.com/#ambassador-business`

## Result

The Ambassador and business scenario now contains a prominent external presentation CTA before the invitation to continue the conversation with Mira.

- Label: `Смотреть русскоязычную презентацию MWR Life`
- Destination: `https://mwrlife.online/russian-presentation/KFilip909/`
- Behaviour: opens in a separate browser tab.

## Verification

- Added Playwright assertions for the destination URL and `_blank` target.
- `npm run test:travelgtc`: passed.

