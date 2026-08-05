# TRAVELGTC-CRM-005 - Customer Card And Lead Relationship Workspace Report

- Project: TravelGTC
- Date: 2026-08-05
- Status: Implemented and published
- Source task: `136_travelgtc_crm_005_customer_card_task.md`

## Delivered

1. Added the additive migration
   `projects/travelgtc/app/migrations/003_travelgtc_crm_customer_profiles.sql`.
   It creates a customer-level profile for each existing TravelGTC contact, private
   notes and indexes without copying credentials, payment data or external-project
   data.
2. Added protected team/admin API endpoints for customer search, customer detail,
   relationship status/assignee updates and private notes.
3. Added the compact internal workspace at `/crm/customers/` with search, a full
   registration profile, all associated leads, open tasks, Mira interactions,
   internal notes and chronological audit history.
4. Added a visible `Открыть карточку клиента` action from the existing lead detail.
   Direct links such as `/crm/customers/?id=<contact-id>` open the selected card.
5. Kept lead stages on their individual leads. Customer-level relationship status
   and assignment are separate, so one person can retain more than one interest.

## Access And Data Rules

1. All customer endpoints require TravelGTC `team` or `admin`; normal authenticated
   users receive `403` and cannot see CRM navigation.
2. Registration email and phone are shown only within the protected customer card.
3. Notes and assignment/status updates create an actor/time audit record.
4. The CRM continues to use the isolated TravelGTC database. No CrewPortGlobal,
   payment, document or MWR Life account data is imported.

## Verification

```text
npm --prefix projects/travelgtc/app run build   -> passed
npm --prefix projects/travelgtc/app test        -> 37 passed
npm run test:travelgtc                          -> 32 passed
```

The migration was applied to the live `travelgtc` database. It created a customer
profile for every existing contact (42 at the time of migration) and no customer
notes were created as part of the backfill.

## Publication

The static workspace was synced through
`projects/travelgtc/scripts/deploy_public_live.sh`; its smoke route now includes
`/crm/customers/`. The live page requires the owner/team account:

```text
https://travelgtc.com/crm/customers/
```
