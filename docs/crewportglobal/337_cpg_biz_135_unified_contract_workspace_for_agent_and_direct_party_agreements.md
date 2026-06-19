# CPG-BIZ-135 - Unified Contract Workspace For Agent And Direct Party Agreements

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document type: Business-process / technical task and implementation standard addendum
- Version: 1.0
- Date: 2026-06-19
- Status: Approved planning task for next implementation slice

## 1. Purpose

This document fixes the next contract-automation rule:

```text
one contract workspace / template / generation mechanism
many approved contract templates
different party sets and source adapters
```

CrewPortGlobal must not create a separate contract-generation script for every new agreement.

The existing seafarer/shipowner Contract Agreement Workspace remains the canonical model. Agent agreements must be connected to that model through template selection, source adapters, party approvals, required appendices and generated snapshots.

## 2. Standards Reviewed Before This Task

This task was prepared after reviewing:

| Standard / process | Current role |
|---|---|
| BP-012 | End-to-end crew formation process, agent authority/scope and direct contract/embarkation support. |
| BP-015 | Commercial operating cycle, framework-vs-commercial separation and billing boundary. |
| BP-016 | Stage-to-standard matrix and gap register. |
| BP-017 / ICS-004 | Implemented shipowner-agent offer/acceptance/authority/assignment flow. |
| CPG-BIZ-091 / 092 | Seafarer/shipowner contract structure, variables and formal document reference rule. |
| CPG-BIZ-093 / 095 / 096 | Master contract versioning, embedded fields and Contract Agreement Workspace model. |
| CPG-BIZ-098D | Runtime schema foundation for templates, workspace instances, embedded fields, approvals, generated instances and audit events. |
| CPG-BIZ-100 / 102 | Implemented guarded employer contract proposal and workspace detail/source prefill. |
| CPG-BIZ-125 / 126 / 127 | Agent capacity, dual-interest facilitation, personal signature rule, representative appointment and notification ledger. |
| CPG-BIZ-132 / 134 | Authoritative English shipowner-agent agreement and single legal publication/template registry rule. |

## 3. Current Runtime Finding

The existing contract module is useful but currently specialized for the direct seafarer/shipowner contract:

1. `contract_workspace_instances` requires seafarer, employer company, vessel and vacancy IDs.
2. `contract_workspace_party_approvals.party_type` supports `seafarer`, `employer`, `platform_reviewer` and `control`.
3. `cpg_contract_latest_approved_template()` selects the latest approved English template globally, not by contract kind or template code.
4. `cpg_contract_workspace_detail()` hard-codes seafarer/employer/vessel/vacancy source fields.
5. The shipowner-agent agreement flow uses `agent_framework_agreement_offers.contract_snapshot` instead of the full contract workspace/template/approval model.

Conclusion:

```text
the existing module must be generalized
not duplicated
```

## 4. Contract Kind Registry

The contract workspace must support an explicit `contract_kind`.

Initial contract kinds:

| Contract kind | Parties | Purpose | Template source |
|---|---|---|---|
| `seafarer_shipowner_employment` | Seafarer + shipowner/employer | Direct SEA / employment-support contract between the real employment parties. | CPG-BIZ-091/092 future master template. |
| `shipowner_agent_framework` | Shipowner/employer + agent organization | Representative management, authority, no-fee boundary, commercial-pending status and one-active-manager controls. | CPG-BIZ-132. |
| `seafarer_agent_representation` | Seafarer + agent organization | Optional seafarer-side representation, profile/document support, no-fee boundary and authority scope. | Future CPG-BIZ template. |

The direct seafarer/shipowner agreement remains direct. Even when an agent facilitates both sides, the direct contract must route final contract-critical review and signature to the seafarer and shipowner/employer by default.

## 5. Agent Agreements Required Before Agent Management

When an agent acts for a shipowner, the system must have:

```text
shipowner-agent framework agreement
+ authority/POA evidence
+ mandatory appendices
+ one-active-manager check
+ notifications
```

When an agent acts for a seafarer, the system must have:

```text
seafarer-agent representation agreement
+ seafarer authority/consent evidence
+ no recruitment/placement fee acknowledgement
+ mandatory appendices
+ one-active-manager check
+ notifications
```

If the same agent facilitates both sides in one crewing workflow, this is ordinary `dual_interest_facilitation` only while:

1. each party remains visible as a platform participant;
2. each party can appoint, replace or revoke its representative;
3. final contract-critical SEA values route to the real parties;
4. formal dual-management or representative signature enters control review.

## 6. Required Appendices / Attachment Registry

Every contract template must define its required appendices through the same registry approach.

Required fields:

```text
appendix_code
contract_kind
template_code
appendix_title
required_policy
signature_policy
source_type
source_table_or_object
document_reference_rule
approval_party
blocker_code
```

Initial appendix groups:

| Contract kind | Required appendices / evidence |
|---|---|
| `shipowner_agent_framework` | Authority/POA document, delegated scope, no-fee boundary, data/confidentiality, commercial terms status or Service Order reference, notification ledger reference. |
| `seafarer_agent_representation` | Seafarer authority/consent, no-fee acknowledgement, profile/document support scope, personal-account control/revocation rule, data/confidentiality, complaint route. |
| `seafarer_shipowner_employment` | Vessel/SEA terms, wage/payment, joining, repatriation, insurance/medical, CBA/law reference where applicable, complaint route, signed copies. |

Operational UI may show short appendix status and links. It must not duplicate full legal text outside `/legal/`.

## 7. Unified Script / Service Requirement

The future generation script must be a single contract service with adapters:

```text
contract_kind
-> template_code/version lookup
-> source adapter
-> embedded field map
-> appendix registry
-> party approval set
-> preview hash
-> generated instance
```

Required behavior:

1. Select template by `contract_kind` and `template_code`, not by the latest approved template globally.
2. Use source-first prefill from verified database records.
3. Keep fixed clauses immutable.
4. Store embedded field values with clause IDs.
5. Store required appendices/evidence status.
6. Request party approvals based on contract kind.
7. Create participant notification ledger entries for material offer, acceptance, authority, approval and generation events.
8. Generate the final instance only after required values, appendices and approvals are complete.

## 8. Proposed Database/API Design Direction

The next SQL/API slice should add a compatibility layer instead of replacing migration 018.

Recommended additive objects or fields:

| Object / field | Purpose |
|---|---|
| `master_contract_templates.contract_kind` | Template category: SEA, shipowner-agent, seafarer-agent. |
| `contract_workspace_instances.contract_kind` | Runtime workspace kind used by guards and source adapters. |
| `contract_workspace_party_links` | General party rows for seafarer, shipowner/employer, agent organization, platform reviewer and control. |
| `contract_workspace_source_links` | Source records linked to the workspace by object type/id. |
| `contract_template_required_appendices` | Versioned appendix requirements per template. |
| `contract_workspace_appendix_status` | Runtime appendix/evidence status for one workspace. |
| `agent_framework_agreement_offers.contract_workspace_id` | Links current shipowner-agent offers to the unified workspace once migrated. |

The existing `contract_workspace_instances` direct SEA columns may remain for backward compatibility, but new generalized flows must not depend on all of them being non-null for every contract kind.

## 9. API/UI Task Requirements

The next implementation task should provide:

1. `GET /contract-templates?contract_kind={kind}` to return approved selectable templates.
2. `POST /contract-workspaces` with `contract_kind`, `template_code`, source object ids and actor context.
3. Source adapters:
   - `seafarer_shipowner_employment`: seafarer, employer, vessel, vacancy, shortlist/candidate.
   - `shipowner_agent_framework`: employer company, shipowner user, agent organization, authority document, delegated scope, offer.
   - `seafarer_agent_representation`: seafarer profile/user, agent organization, authority/consent document, delegated scope.
4. Contract workspace detail rendering based on template fields, not hard-coded SEA fields only.
5. Party approval rows for each contract kind.
6. Appendix/evidence checklist.
7. Guard blockers for missing source facts, missing appendices, dual-management review, representative-signing exception and commercial terms where applicable.

## 10. Business Process Integration

The complete agent-enabled flow is:

```text
shipowner-agent agreement
+ seafarer-agent agreement where the agent represents the seafarer
+ direct seafarer-shipowner contract workspace
= controlled crewing workflow with visible authority and party approvals
```

The agent may prepare and coordinate, but must not silently replace the actual parties for SEA final approval.

The same contract workspace module must be used for all three agreements so that:

1. templates are versioned consistently;
2. appendices are controlled consistently;
3. source data comes from the database consistently;
4. approvals and generated hashes are stored consistently;
5. future audits can compare direct-party and agent-assisted workflows.

## 11. Implementation Guard

Before coding any contract-related feature, the implementer must:

1. reread BP-012, BP-015, BP-016, BP-017;
2. reread CPG-BIZ-093, CPG-BIZ-095, CPG-BIZ-125, CPG-BIZ-134 and this document;
3. check implemented code standards ICS-001..004;
4. reuse the existing contract workspace module where possible;
5. create or update an implemented-code standard only when a reusable runtime behavior is actually implemented.

No new page-local or agreement-local generation script is allowed.

## 12. Acceptance Criteria For Next Slice

The next implementation slice is acceptable only when:

1. template selection is scoped by `contract_kind` / `template_code`;
2. the shipowner-agent agreement can be represented as a contract workspace or migration-compatible workspace adapter;
3. future seafarer-agent agreement requirements are represented in the same registry model;
4. direct SEA contract work remains direct between seafarer and shipowner/employer;
5. agent participation is captured as representation capacity and authority evidence, not as hidden party replacement;
6. required appendices are visible as structured checklist/evidence rows;
7. operational pages link to `/legal/` documents instead of duplicating full legal text;
8. generated instances store template version, source ids, approvals, appendices and hash.

## 13. Next Implementation Recommendation

Recommended next stage:

```text
CPG-BIZ-136 - Contract Workspace Multi-Template Registry API/UI implementation
```

That stage should add the minimal database/API/UI compatibility layer for `contract_kind`, template lookup, party/source adapters and appendix checklist before attempting final document generation.

## 14. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-06-19 | GTC IT / AI Assistant | Fixed unified contract workspace direction for direct SEA, shipowner-agent and future seafarer-agent agreements; documented required template, appendix, source-adapter and generation-script rules |
