# TRAVELGTC-CRM-004 - Owner CRM Access And Mira Contact Report

- Project: TravelGTC
- Date: 2026-08-05
- Status: Implemented

## Result

TravelGTC keeps the project owner's personal email address and phone number out of public page markup. The public contact path is now the Mira conversation at `/mira/`.

The API exposes `can_access_crm` only for an authenticated user holding the active TravelGTC `team` or `admin` role. The public navigation adds the `/crm/` link only when that server-verified flag is true.

The TravelGTC account registered with `kfilipenko@kmf.ru` has active `team` and `admin` roles in the isolated TravelGTC identity database. CRM API access remains enforced on every CRM endpoint; a visible link alone never grants access.

## Registration Interest

When an authenticated visitor tells Mira that they want to register, subscribe, buy or asks for a registration/payment link, the existing purchase-intent flow:

1. records the request and a high-priority `purchase_intent` task in TravelGTC CRM;
2. marks the lead `ready_to_subscribe` unless it was already closed;
3. sends an SMTP notification to the private server-side recipient configured as `TRAVELGTC_LEAD_NOTIFICATION_TO`;
4. keeps the referral URL and the conversation context in the CRM record.

The recipient address is configured only in `/etc/travelgtc/travelgtc-api.env` and is not emitted into public HTML or JavaScript.

## Verification

- `npm run build`: passed.
- `npm test`: 36 tests passed.
- A dedicated authorization test confirms that an ordinary account gets `can_access_crm: false`, while an active `admin` receives `true` and can open the CRM API.
