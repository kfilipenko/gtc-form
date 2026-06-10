# CPG-BIZ-127 - Participant Governance Notification Ledger API/UI Implementation Report

Date: 2026-06-10

Status: first runtime slice implemented and smoke-tested.

## 1. Implemented Runtime Slice

This implementation converts the agreed shipowner-agent appointment model into a working platform flow:

1. shipowner opens `/shipowners/candidates/`;
2. shipowner selects a registered agent from the platform list;
3. shipowner sends an in-system framework agreement offer;
4. agent opens `/agents/`, sees the offer as a task and offer card;
5. agent confirms checkbox acceptance of the framework agreement terms;
6. backend creates verified platform-side authority evidence;
7. backend creates one active managing-agent assignment for the shipowner company;
8. backend records participant notification ledger entries for offer sent, offer received, offer accepted and assignment activated.

Commercial terms remain intentionally separate. The appointment flow records:

```text
commercial_terms_status = commercial_terms_pending
```

Paid service activation, billing basis, success fee, SLA and invoices still require a separate Service Order / commercial addendum / request or approved price-basis record.

## 2. Database Changes

Added migration:

```text
projects/crewportglobal/app/backend/db/migrations/021_agent_framework_offer_notification_ledger.sql
```

New runtime tables:

1. `crewportglobal.agent_framework_agreement_offers`
2. `crewportglobal.participant_notification_ledger`

The offer table stores shipowner offer, agent acceptance, framework status, authority status, commercial status, template code/version, delegated scope, contract snapshot, source authority document and assignment link.

The notification ledger stores safe participant-facing event records with recipient user or recipient agent organization, event stage, action type, delivery status, payload hash and payload.

## 3. Test Agent Seed

Added idempotent test seed:

```text
projects/crewportglobal/app/backend/db/seeds/001_test_agent.sql
```

Seeded test account:

```text
email: test.agent@crewportglobal.test
password: TestAgent#2026
agent_code: TEST_AGENT_001
agent_display_name: CPG Test Agent Company
```

The user receives an auth-compatible `crewing_manager` role, while actual agent scope is controlled by `agent_users` membership and `agent_organizations` authority status.

## 4. API Changes

Added shipowner-side endpoints:

```text
GET  /api/v1/employer/agent-assignment/options?draft_id={shipowner_user_id}
POST /api/v1/employer/agent-assignment/offers
```

Added agent-side endpoints:

```text
GET  /api/v1/agents/framework-agreement-offers
POST /api/v1/agents/framework-agreement-offers/{offer_id}/accept
```

Extended:

```text
GET /api/v1/agents/tasks
```

Agent tasks now include pending shipowner framework offers.

## 5. UI Changes

Updated shipowner candidate workspace:

```text
projects/crewportglobal/public/shipowners/candidates/index.html
```

The page now includes an agent appointment panel with:

1. registered-agent selector;
2. framework/commercial separation confirmation checkbox;
3. send-offer action;
4. current offer list;
5. participant notification ledger preview.

Updated agent workbench:

```text
projects/crewportglobal/public/agents/index.html
```

The page now includes a framework-offers section with:

1. shipowner offer cards;
2. status, authority and commercial-term metadata;
3. checkbox acceptance;
4. accept action that activates authority and assignment.

## 6. Runtime Smoke Test Evidence

Migration applied:

```text
psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/migrations/021_agent_framework_offer_notification_ledger.sql
```

Seed applied:

```text
psql -v ON_ERROR_STOP=1 -f projects/crewportglobal/app/backend/db/seeds/001_test_agent.sql
```

Test shipowner/company used in local DB:

```text
shipowner_user_id: 9bff7f52-61c8-4ea1-b3d4-b82dedb9e7a3
company_id: e1d56df7-3bb5-444b-8061-8acded3eca79
company_name: Deletion Owner Marine LLC
```

Created and accepted offer:

```text
offer_id: c94fba20-1e07-4572-a990-a42a5d8f7acb
offer_number: CPG-AO-20260610-045525-155779
offer_status: activated
framework_terms_status: accepted
authority_status: verified
commercial_terms_status: commercial_terms_pending
```

Created authority and assignment:

```text
authority_document_id: e874bcd8-142f-4e62-a579-1bf65780d07e
authority_type: shipowner_agency_agreement
assignment_id: 5f7c1e21-4d7d-48ca-a626-235419f0c37f
assignment_status: active
visibility_scope: ordinary_execution
data_responsibility_status: agent_responsible
```

Notification ledger count for the accepted offer:

```text
4
```

## 7. Verification

Executed:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
git diff --check
```

HTTP smoke via local PHP dev server confirmed:

1. shipowner options endpoint returns registered test agent;
2. shipowner offer creation returns HTTP 201;
3. test agent login succeeds;
4. agent offer list returns the sent offer;
5. agent acceptance returns activated offer, verified authority and active assignment;
6. `/api/v1/agents/objects` returns the new manageable shipowner company object;
7. shipowner options endpoint returns activated offer and recorded notifications.

## 8. Remaining Work

This slice does not yet implement:

1. separate commercial Service Order / commercial addendum UI;
2. previous-agent replacement/revocation flow;
3. seafarer-side representative appointment;
4. delegated operational lock on every participant-owned edit surface;
5. notification read/delivery lifecycle UI;
6. generated full contract PDF/document instance.

These are next CPG-BIZ-127 follow-up slices, with commercial activation likely first because the framework agreement deliberately leaves price pending.

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-06-10 | GTC IT / AI Assistant | Initial implementation report for shipowner-to-agent framework offer, agent checkbox acceptance, authority/assignment activation, participant notification ledger, test agent seed and runtime smoke verification |
