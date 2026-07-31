# TRAVELGTC-AI-015 - Mira Accurate Membership Qualification Report

- Project: TravelGTC
- Date: 2026-07-30
- Status: Implemented and published
- Azure agent: `AI-TravelGTC`, version `21`

## Delivered

1. Replaced broad output substitutions with a narrow guard for unsupported savings claims and incorrect cash wording.
2. Corrected Membership knowledge: Guest, Elite Loyalty Points, Turbo separation, document consent and minimum-sufficient level selection.
3. Added CRM new-case handling: a request such as `новый клиент` or `рассмотрим с нуля` does not pass prior chat history to Mira.
4. Kept a single official purchase route when the Azure response already provides one; the server does not append a second generic referral link.
5. Published Azure versions 18-21 during controlled testing. Version 21 is the active runtime version.
6. Added browser behavior that brings the first line of a newly received answer into view inside the chat window.

## Controlled Agent Checks

| Scenario | Result |
|---|---|
| Couple travelling 2-3 times per year | Mira asks for destination/format before naming a level. |
| Booking objection | Mira acknowledges the free public service and asks for trip details without inventing a savings percentage. |
| Ready VIP buyer | Mira states `$20 + $19.97 = $39.97` and provides only the VIP route. |
| Cancellation/refund | Mira asks whether the user wants a document or TravelGTC clarification before sending a document link. |
| New yoga-group case | Mira confirms a new independent case and starts scenario discovery. |
| Explicit document consent | Mira sends the official Membership Benefits link only after a direct request. |

## Verification

- `npm run check` in `projects/travelgtc/app`: 32 tests passed.
- `TRAVELGTC_BASE_URL=https://travelgtc.com npm run test:travelgtc`: 28 Playwright tests passed.
- `travelgtc-api.service`: active after restart.
- Public static deploy: completed to `/var/www/travelgtc.com`.
