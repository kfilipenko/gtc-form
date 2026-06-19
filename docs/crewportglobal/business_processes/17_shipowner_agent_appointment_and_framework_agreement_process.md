# BP-017 - Shipowner Agent Appointment And Framework Agreement Process

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Documentation block: Business processes and operating model
- Process owner: Project Owner / Platform Administration / Control
- Version: 1.1
- Date: 2026-06-10
- Status: Active process standard for implemented first runtime slice

## 1. Purpose

This process defines how a shipowner-side participant appoints an agent inside CrewPortGlobal.

The process exists because agent management must not start from an informal message, an external document alone or a direct technical assignment. CrewPortGlobal must record a controlled offer, agent acceptance, authority evidence, one active managing representative and participant notifications.

## 2. Runtime Entry Points

Shipowner-side entry:

```text
/shipowners/
-> Main actions: Appoint agent / Назначить агента
-> /shipowners/candidates/#agent-assignment
```

Direct route:

```text
https://crewportglobal.com/shipowners/candidates/
```

If the browser has the active shipowner draft context, the page reads it from:

```text
localStorage: crewportglobal.registration.draft_id
```

Exact direct link format:

```text
https://crewportglobal.com/shipowners/candidates/?draft_id={shipowner_user_id}
```

For the currently reviewed test object:

```text
https://crewportglobal.com/shipowners/candidates/?draft_id=9c33e748-cf2e-4b1b-8fa7-2daef52e1a67#agent-assignment
```

Agent-side entry:

```text
/agents/
```

Public legal document:

```text
/legal/agent-agreement/
```

## 3. Participants

| Participant | Role in this process |
|---|---|
| Shipowner physical person / authorized shipowner-side user | Initiates the offer and keeps governance rights over appointment, notifications and future revocation/replacement. |
| Registered agent / agent organization | Receives the offer, reviews the framework agreement and accepts it inside CrewPortGlobal. |
| CrewPortGlobal platform | Records the offer, acceptance, authority document, assignment, audit evidence and participant notifications. |
| Platform Administration / Control | Handles exceptions, external evidence, disputes, authority conflicts and future replacement/revocation controls. |
| Billing / commercial group | Handles future Service Order, commercial addendum, approved price basis and invoices. |

## 4. Preconditions

The process may start only when:

1. the shipowner-side user has a valid `draft_id` and a primary shipowner/employer company card;
2. the selected agent is a registered CrewPortGlobal agent organization;
3. the agent has acceptable runtime statuses:
   - `agent_status` is `verified` or `limited`;
   - `authority_status` is `verified` or `limited`;
   - `platform_service_agreement_status` is `accepted`;
4. no other active or limited managing agent assignment exists for the same shipowner company;
5. the shipowner confirms that the framework agreement is concluded inside CrewPortGlobal and commercial terms are agreed separately.

## 5. Business Flow

1. The shipowner opens the shipowner workspace and selects `Appoint agent / Назначить агента`.
2. The shipowner chooses a registered agent from the list or selects the invitation option for an unregistered agent.
3. If the agent is not registered, the page prepares an email invitation asking the agent to register before platform appointment can continue.
4. If the agent is registered, the shipowner previews or opens the standard full agreement package.
5. The shipowner confirms the framework/commercial separation checkbox.
6. The shipowner sends an in-system agreement package offer referencing the authoritative English `CPG-BIZ-132 v1.0` package.
7. CrewPortGlobal records the offer with:
   - `offer_status = sent`;
   - `framework_terms_status = offered`;
   - `authority_status = pending`;
   - `commercial_terms_status = commercial_terms_pending`.
8. The agent opens `/agents/` and receives the offer as a task/card.
9. The agent accepts the standard framework terms inside CrewPortGlobal by checkbox acceptance.
10. CrewPortGlobal verifies that the represented object still has no active managing agent.
11. CrewPortGlobal creates platform-side authority evidence.
12. CrewPortGlobal creates one active `agent_object_assignment` for the shipowner company.
13. CrewPortGlobal updates the offer to:
    - `offer_status = activated`;
    - `framework_terms_status = accepted`;
    - `authority_status = verified`;
    - `commercial_terms_status = commercial_terms_pending`.
14. CrewPortGlobal records participant notification ledger entries for the shipowner and the agent organization.

## 6. Contract Rule

The shipowner does not directly appoint an agent by pressing a single appointment button.

The shipowner sends an offer. The appointment becomes active only after the agent accepts the CrewPortGlobal standard framework agreement package inside the platform and the authority/assignment records are created.

The agreement is a platform standard / adhesion-form framework agreement. External contracts, letters or powers of attorney may be stored as evidence for Control review, but they do not automatically activate platform management rights unless the CrewPortGlobal assignment process is completed.

The controlling contract source is the English `CPG-BIZ-132 - Shipowner-Agent Agreement Package (EN, Authoritative Portal Version)`. Russian `CPG-BIZ-123` is maintained as a working/reference version for internal review and system discussions. Public runtime links must open the single canonical publication URL `/legal/agent-agreement/`, which publishes the English-authoritative contract package and explains the language priority without advertising Russian CPG-BIZ-123 as a public translation. Working pages may show only a short description and a link to that canonical legal URL.

## 7. Commercial Terms Rule

The framework agreement may be accepted before a concrete service price is agreed.

The runtime status must remain:

```text
commercial_terms_status = commercial_terms_pending
```

Paid service activation, billing basis, success fee, SLA penalties/bonuses and invoices require a separate Service Order, commercial addendum, request or approved price-basis record.

## 8. One Active Manager Rule

For a shipowner company object:

```text
one represented object -> one active managing agent assignment
```

If an active or limited managing agent assignment already exists, a new offer or acceptance must be blocked until the replacement/revocation process is implemented and completed.

## 9. Notifications And Evidence

The following events must be recorded in the participant notification ledger:

| Event | Recipient |
|---|---|
| Framework offer sent | Shipowner physical person / shipowner-side user |
| Framework offer received | Agent organization |
| Framework offer accepted | Shipowner physical person / shipowner-side user |
| Agent assignment activated | Agent organization and represented object context |

Future stages must add delivery/read state, previous-agent notifications and revocation/replacement notifications.

## 10. Implemented Runtime Controls

Current implementation:

```text
GET  /api/v1/employer/agent-assignment/options?draft_id={shipowner_user_id}
POST /api/v1/employer/agent-assignment/offers
GET  /api/v1/agents/framework-agreement-offers
POST /api/v1/agents/framework-agreement-offers/{offer_id}/accept
```

Current UI:

```text
/shipowners/candidates/#agent-assignment
/agents/
/legal/agent-agreement/
```

Current database objects:

```text
crewportglobal.agent_framework_agreement_offers
crewportglobal.agent_authority_documents
crewportglobal.agent_object_assignments
crewportglobal.participant_notification_ledger
crewportglobal.agent_scope_audit_events
```

## 11. Controlling Documents

| Document | Purpose |
|---|---|
| `docs/crewportglobal/334_cpg_biz_132_shipowner_agent_agreement_package_en.md` | Authoritative English full shipowner-agent agreement package: main agreement, authority/POA, appendices, commercial-status rule and signing checklist. |
| `docs/crewportglobal/324_cpg_biz_123_full_contract_ru_checkbox_radio.md` | Russian working/reference version of the shipowner-agent agreement package for internal review and system discussions. |
| `docs/crewportglobal/329_cpg_biz_127_participant_governance_notification_ledger_implementation_report.md` | Runtime implementation report for offer, acceptance, authority, assignment and notifications. |
| `docs/crewportglobal/330_cpg_biz_128_public_legal_documents_hub_and_agent_agreement_report.md` | Public legal document publication model. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | Stage-to-standard mapping and current implementation coverage. |
| `docs/crewportglobal/implemented_code_standards/04_standard_shipowner_agent_framework_offer_acceptance.md` | Implemented code standard for this runtime process. |

## 12. Current Gaps

The following stages remain future work:

1. Service Order / commercial addendum activation;
2. agent replacement and previous-agent notification;
3. shipowner revocation process;
4. seafarer-side representative appointment;
5. full notification delivery/read lifecycle;
6. generated contract instance/PDF with immutable snapshot.

## 13. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.2 | 2026-06-19 | GTC IT / AI Assistant | Removed public convenience-translation wording from the shipowner-agent agreement publication rule |
| 1.1 | 2026-06-10 | GTC IT / AI Assistant | Added authoritative English CPG-BIZ-132 contract package as the controlling source for shipowner-agent offers, with Russian CPG-BIZ-123 kept as a supporting working reference |
| 1.0 | 2026-06-10 | GTC IT / AI Assistant | Initial dedicated process document for shipowner-to-agent offer, framework acceptance, platform authority, one active assignment, commercial pending status and notifications |
