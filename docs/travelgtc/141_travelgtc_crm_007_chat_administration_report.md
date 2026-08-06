# TRAVELGTC-CRM-007 - Chat Administration Report

- Project: TravelGTC
- Date: 2026-08-06
- Status: Implemented

## Result

Added Mira dialogue lifecycle management directly to the protected CRM queue at `/crm/`.

Only the TravelGTC `admin` role sees a checkbox beside entries created from a Mira dialogue. The administrator selects one or more dialogues in the existing lead list, chooses a lifecycle action, then applies it from the same screen. No separate chat workspace or menu item is used.

Available actions:

1. hide a chat from the active queue;
2. archive a chat;
3. soft-delete a chat from the work queue;
4. restore a non-active chat to the active queue.

The implementation keeps Mira messages and linked customer/lead records intact. A deletion changes only the administrative lifecycle status and remains auditable.

## Data and API

- Added migration `004_travelgtc_crm_chat_management.sql` and the `travelgtc_chat_cases` lifecycle table.
- Existing account Mira chat leads were backfilled as active cases.
- Added an admin-only status-update endpoint under `/api/travelgtc/v1/crm/chats/:leadId`; the existing `/crm/leads` queue now returns the Mira chat lifecycle status needed by the integrated controls.

## Verification

- API tests: 37 passed.
- TravelGTC Playwright tests: 33 passed.
- Migration applied to the TravelGTC database.
