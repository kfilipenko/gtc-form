# ICS-004 - Shipowner-Agent Framework Offer Acceptance Standard

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Implemented code standards
- Document type: Implemented code standard
- Version: 1.0
- Date: 2026-06-10
- Status: Active

## 1. Purpose

This implemented standard defines the canonical runtime pattern for appointing a shipowner-side agent through CrewPortGlobal.

The standard prevents page-local direct appointment logic. A shipowner-side agent may become active only through:

```text
shipowner in-system offer
-> agent in-system acceptance
-> platform authority evidence
-> one active object assignment
-> participant notification ledger
```

## 2. Applies To

Current adopters:

```text
/shipowners/candidates/#agent-assignment
/agents/
```

Current represented object:

```text
employer_company
```

Future adopters:

1. shipowner representative replacement/revocation;
2. seafarer-side representative appointment;
3. vessel/operator-side representative appointment;
4. generated agreement documents and Service Order activation.

## 3. Canonical Implementation

Backend canonical code:

```text
projects/crewportglobal/app/backend/api/public/index.php
```

Canonical backend functions:

```text
handle_get_employer_agent_assignment_options()
handle_post_employer_agent_framework_offer()
handle_get_agent_framework_agreement_offers()
handle_post_agent_framework_agreement_offer_accept()
cpg_shipowner_agent_context_from_draft()
cpg_agent_registered_options()
cpg_agent_framework_offers_for_company()
cpg_agent_task_from_framework_offer()
```

Canonical schema:

```text
projects/crewportglobal/app/backend/db/migrations/021_agent_framework_offer_notification_ledger.sql
```

Test agent seed:

```text
projects/crewportglobal/app/backend/db/seeds/001_test_agent.sql
```

Frontend current adapters:

```text
projects/crewportglobal/public/shipowners/candidates/index.html
projects/crewportglobal/public/agents/index.html
projects/crewportglobal/public/assets/crewportglobal-navigation.js
```

## 4. Adapter Contract

The shipowner-side UI adapter must provide:

| Adapter input | Purpose |
|---|---|
| `draft_id` | Identifies the shipowner-side user and primary company card. |
| selected `agent_organization_id` | Identifies the registered agent organization receiving the offer. |
| framework/commercial checkbox confirmation | Confirms that framework acceptance is separate from commercial price agreement. |
| agreement preview/open link | Lets the shipowner inspect the standard framework before sending. |
| offer list renderer | Shows sent/accepted/activated agreement offers as active records. |
| notification list renderer | Shows participant notification ledger records. |

The agent-side UI adapter must provide:

| Adapter input | Purpose |
|---|---|
| authenticated agent scope | Identifies the agent organization and acting user. |
| offer list/task card | Shows pending and historical framework offers. |
| acceptance checkbox | Records explicit agreement with framework terms. |
| accept action | Calls the canonical acceptance endpoint. |

## 5. Runtime Guards

The backend must enforce:

1. `draft_id` is a valid shipowner/employer-side user context;
2. shipowner context has a primary company card;
3. selected agent exists and is eligible:
   - `agent_status IN ('verified', 'limited')`;
   - `authority_status IN ('verified', 'limited')`;
   - `platform_service_agreement_status = 'accepted'`;
4. no active or limited assignment already exists for the represented object;
5. no open offer already exists for the same shipowner company and agent;
6. agent acceptance is allowed only for the agent organization that received the offer;
7. only `sent` offers may be accepted;
8. framework acceptance creates authority evidence before object assignment;
9. commercial terms remain pending until a separate commercial process is completed.

## 6. Status Contract

Offer creation:

| Field | Required value |
|---|---|
| `offer_status` | `sent` |
| `framework_terms_status` | `offered` |
| `authority_status` | `pending` |
| `commercial_terms_status` | `commercial_terms_pending` |

Agent acceptance:

| Field | Required value |
|---|---|
| `offer_status` | `activated` |
| `framework_terms_status` | `accepted` |
| `authority_status` | `verified` |
| `commercial_terms_status` | `commercial_terms_pending` |

Assignment creation:

| Field | Required value |
|---|---|
| `object_type` | `employer_company` |
| `assignment_status` | `active` |
| `assignment_source` | `authority_document` |
| `visibility_scope` | `ordinary_execution` |
| `data_responsibility_status` | `agent_responsible` |

## 7. Forbidden Local Logic

Pages and future endpoints must not:

1. directly insert `agent_object_assignments` without a verified authority source;
2. activate management from an external contract upload alone;
3. bypass the one-active-manager check;
4. treat framework agreement acceptance as paid service activation;
5. hide `commercial_terms_pending`;
6. let an unrelated agent accept an offer;
7. create ordinary shared editing between participant and agent for the same delegated operational scope;
8. create participant-important state changes without notification ledger records.

## 8. Current Tests And Verification

Current verification evidence is recorded in:

```text
docs/crewportglobal/329_cpg_biz_127_participant_governance_notification_ledger_implementation_report.md
```

Focused verification commands:

```text
php -l projects/crewportglobal/app/backend/api/public/index.php
php -S 127.0.0.1:8787 -t projects/crewportglobal/public projects/crewportglobal/public/router.php
GET /shipowners/candidates/?draft_id={shipowner_user_id}
GET /legal/agent-agreement/
GET /api/v1/employer/agent-assignment/options?draft_id={shipowner_user_id}
```

## 9. Change Propagation Rule

If this standard changes, update:

1. backend offer/acceptance endpoints;
2. migration/status documentation if status values change;
3. `/shipowners/candidates/` adapter;
4. `/agents/` offer/task adapter;
5. navigation links that expose the appointment action;
6. BP-017 and BP-016;
7. the public `/legal/agent-agreement/` document when legal/commercial wording changes;
8. runtime verification and implementation report.

## 10. Next Adoption Targets

1. Service Order / commercial addendum endpoint and UI;
2. previous-agent replacement/revocation guard;
3. seafarer-side representative appointment;
4. generated agreement instance and immutable snapshot;
5. notification read/delivery lifecycle.
