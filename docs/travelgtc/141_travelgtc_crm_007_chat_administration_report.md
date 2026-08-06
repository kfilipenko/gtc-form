# TRAVELGTC-CRM-007 - Chat Administration Report

- Project: TravelGTC
- Date: 2026-08-06
- Status: Implemented

## Result

Added the protected administrator workspace at `/crm/chats/` for Mira dialogue lifecycle management.

Only the TravelGTC `admin` role can list and change chat states. The CRM navigation shows `Чаты` only after the API confirms this permission.

Available actions:

1. hide a chat from the active queue;
2. archive a chat;
3. soft-delete a chat from the work queue;
4. restore a non-active chat to the active queue.

The implementation keeps Mira messages and linked customer/lead records intact. A deletion changes only the administrative lifecycle status and remains auditable.

## Data and API

- Added migration `004_travelgtc_crm_chat_management.sql` and the `travelgtc_chat_cases` lifecycle table.
- Existing account Mira chat leads were backfilled as active cases.
- Added admin-only endpoints for list and status updates under `/api/travelgtc/v1/crm/chats`.

## Verification

- API tests: 37 passed.
- TravelGTC Playwright tests: 33 passed.
- Migration applied to the TravelGTC database.
