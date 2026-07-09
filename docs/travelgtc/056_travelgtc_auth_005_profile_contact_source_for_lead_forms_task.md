# TRAVELGTC-AUTH-005 - Profile Contact Source For Lead Forms Task

- Project: TravelGTC
- Code: TRAVELGTC-AUTH-005
- Date: 2026-07-09
- Status: Implemented

## 1. Context

The Project Owner approved the model where registration comes first and public request forms do not ask for personal contact data again.

The previous implementation still had several conflicting patterns:

1. registration allowed messenger-style primary channels;
2. phone was optional during registration;
3. home, contacts and create-trip forms repeated name/contact/channel fields;
4. the contacts page still showed WhatsApp/MAX/Telegram choices;
5. CRM and agents could receive inconsistent channels from multiple form locations.

## 2. Business Rule

TravelGTC uses this data boundary:

```text
registration = identity and contact data
lead form = need, request, trip/event/business context
```

The first supported contact methods are:

```text
email
phone
```

Messenger-specific channels may be added later as profile preferences or integrations, but they are not first-stage lead form fields.

## 3. Scope

In scope:

1. make phone required during TravelGTC registration;
2. limit registration contact preference to email or phone;
3. remove personal contact fields from home, contacts and create-trip lead forms;
4. build lead API payload contact fields from the authenticated user profile;
5. update privacy text and visible consent text to reference profile contacts;
6. update funnel and backend tests.

Out of scope:

1. changing the existing lead database schema;
2. removing legacy public-lead enum values from historical API compatibility;
3. adding a user profile edit page;
4. implementing outbound email/SMS/phone integrations.

## 4. Acceptance Criteria

The task is complete when:

1. registration requires email and phone;
2. registration primary contact preference only allows email or phone;
3. lead forms no longer ask for name, contact value or communication channel;
4. authenticated lead submission still creates a CRM lead;
5. tests pass locally and on the live domain;
6. the change is documented, deployed and committed.
