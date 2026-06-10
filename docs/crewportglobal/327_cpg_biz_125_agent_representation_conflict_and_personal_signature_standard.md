# CPG-BIZ-125 - Agent Representation Conflict And Personal Contract-Signature Standard

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Business-process, contract-control and task-routing standard
- Source task: Project Owner instruction on agent role complexity, seafarer/shipowner contract standardization and personal party signing
- Version: 1.1
- Date: 2026-06-10
- Status: Drafted for Project Owner, platform-control and maritime legal review

## 1. Purpose

This document fixes the CrewPortGlobal standard for agent representation, conflict handling and personal review/signature of seafarer/shipowner contract terms.

The Project Owner identified a material risk:

```text
An agent may perform work usually done by a shipowner and work usually done by a seafarer under separate agreements, but the interests of those parties do not always coincide.
```

The Project Owner later clarified that a crewing agent, by the nature of the service, usually works with both sides: the shipowner needs crew and the seafarer needs a suitable contract.

CrewPortGlobal must therefore distinguish:

```text
normal dual-interest facilitation
```

from:

```text
formal dual representation / signature authority / final decision authority
```

The platform must not treat the agent as a simple replacement for either party, but it also must not prohibit ordinary crewing work where the agent coordinates the interests of both sides.

The standard goal is:

1. protect the seafarer and the seafarer's family through clear contract-critical terms;
2. preserve the shipowner/employer's verified employment responsibility;
3. let agents coordinate work only inside explicit represented-party capacity and authority evidence;
4. require direct party review and signature by default before the final seafarer/shipowner contract is executed;
5. identify and control dual-representation situations before work proceeds into contract-critical decisions.
6. allow an agent to act as an honest facilitator for both sides when the parties remain visible, informed and able to confirm or replace representation.

This document is not legal advice. The production master contract, signature model and representative-signing exceptions must be reviewed by a qualified maritime lawyer for the relevant flag state, applicable CBA, shipowner/employer jurisdiction, seafarer context and recruitment/placement licensing model.

## 2. Sources Reviewed

Project documents reviewed:

| Source | Relevance |
|---|---|
| `288_cpg_biz_091_seafarer_shipowner_contract_template_and_variable_catalog_report.md` | Draft seafarer/shipowner contract structure and variable catalogs. |
| `289_cpg_biz_092_seafarer_shipowner_contract_form_and_document_reference_standard.md` | Contract Agreement Workspace field map, lifecycle and signature guard. |
| `292_cpg_biz_095_contract_agreement_workspace_embedded_fields_standard.md` | Approved model that contract variables must be embedded in the agreement context and approved by parties before generation. |
| `321_cpg_biz_120_structured_shipowner_agent_agreement_ru_template.md` | Shipowner/agent agreement template; agent is not employer by default. |
| `323_cpg_biz_122_full_shipowner_agent_agreement_example_ru.md` | Full shipowner/agent example; principal remains responsible for lawful hiring, wages, labour conditions and employer obligations. |
| `324_cpg_biz_123_full_contract_ru_checkbox_radio.md` | User-readable shipowner/agent agreement with selectable fields and explicit limits on agent powers. |

External legal orientation reviewed:

| Source | Relevance |
|---|---|
| ILO Maritime Labour Convention, 2006 overview: `https://www.ilo.org/international-labour-standards/maritime-labour-convention-2006` | ILO states that MLC covers employment agreements, hours of work/rest, payment of wages, paid leave, repatriation, onboard medical care, recruitment/placement services and complaint procedures. |
| ILO MLC, 2006, as amended text: `https://www.ilo.org/sites/default/files/2024-10/NORMES_MLC%20Amendments-EN_2022_Web_1.pdf` | Standard A2.1 requires SEA signature by the seafarer and shipowner or shipowner representative, opportunity to examine/seek advice before signing and signed originals for both parties. Regulation 1.4 / Standard A1.4 controls recruitment/placement no-fee and agreement-examination obligations. |

## 3. Assessment Of Current Contract Model

The existing CrewPortGlobal contract model is directionally aligned with the MLC-controlled contract subjects.

Strong points already present:

1. The draft contract structure includes parties, vessel/voyage, position, contract term, wages/payment, work/rest/leave, joining travel, repatriation/return, medical/insurance/welfare, documents/certificates, early termination, complaints/disputes, platform evidence and signatures/copies.
2. The workspace model requires required fields before signature/generation and keeps `to_be_agreed` values out of final signature unless a controlled exception exists.
3. Wage amount, currency, payment frequency, payment method, travel responsibility, repatriation/return destination, insurance/medical responsibility, applicable CBA/law and no-fee acknowledgement are treated as structured contract facts rather than informal chat promises.
4. The shipowner/agent agreement documents already state that the agent is not the employer by default and cannot sign employment contracts, change wages or give financial guarantees without separate authority.

Main gaps to close before runtime signature/generation:

1. The platform must distinguish preparation by an agent from approval/signature by the actual parties.
2. The task-routing model must show which party the agent is representing for each task.
3. Ordinary dual-interest facilitation must be allowed, but formal dual-management or final decision/signature authority for both sides must create a control blocker before contract-critical fields are finalized.
4. Representative signing must be treated as a controlled exception, not the ordinary portal flow.

## 4. Representation Capacity Standard

Every agent-visible task and every agent action on a represented object must carry a representation capacity.

Required capacity values:

| Capacity | Meaning |
|---|---|
| `agent_for_seafarer` | Agent acts for a seafarer under verified seafarer authority. |
| `agent_for_shipowner` | Agent acts for a shipowner/employer under verified shipowner/employer authority. |
| `agent_for_vessel_operator` | Agent acts for vessel/operator context under verified authority. |
| `agent_for_platform_service` | Agent performs CrewPortGlobal service work delegated by the platform, without becoming either contractual party. |
| `platform_control_delegate` | Internal controlled delegation by Platform Administration / Control for a specific review/support operation. |

The portal must display the represented party and capacity in:

1. agent task cards;
2. agent object workspace headers;
3. authority evidence cards;
4. audit events;
5. contract workspace preparation history;
6. notification text after assignment or reassignment.

Recommended display pattern:

```text
Managed by: {agent organization}
Representing: {seafarer / shipowner / vessel operator / platform service}
Authority: {authority document reference and status}
```

## 4A. Dual-Interest Facilitation Standard

CrewPortGlobal accepts the commercial reality that an agent may search for a seafarer for a shipowner and at the same time communicate with and assist the seafarer.

This ordinary crewing function is permitted as:

```text
dual_interest_facilitation
```

It is not a prohibited conflict by itself.

The agent may, in a dual-interest facilitation role:

1. receive a shipowner/vessel/crew request;
2. search for suitable seafarers;
3. communicate proposed terms to the seafarer;
4. collect documents and readiness information;
5. coordinate interviews and corrections;
6. prepare a structured terms comparison;
7. help both sides understand open terms, blockers and next tasks.

The agent must not convert dual-interest facilitation into hidden final authority.

The safe platform compromise is:

```text
agent may facilitate both sides
+ each side must become visible as a platform participant
+ each side must control or explicitly appoint its own managing representative
+ final contract-critical approvals route to the real party
= practical crewing workflow without silent loss of party autonomy
```

The platform should not force every seafarer to have a separate agent. A seafarer may be self-managed. The shipowner may have an agent. One agent may facilitate the placement. The control point is not the existence of one coordinating agent; the control point is whether the actual parties can see, approve and replace the representative relationship.

## 5. Personal Party Review And Signature Rule

Default rule:

```text
The seafarer and the shipowner/employer side must personally review and approve the populated contract terms before the final seafarer/shipowner contract is signed or generated for execution.
```

The agent may:

1. prepare draft fields from verified platform records;
2. upload and maintain authority/support documents;
3. coordinate corrections;
4. propose values where the authority permits preparation;
5. arrange communication between the parties;
6. receive agent-scope tasks for non-final preparation work.

The agent must not, by default:

1. approve wage amount, payment method or deductions instead of the seafarer;
2. approve wage amount, payment responsibility or employer obligations instead of the shipowner/employer;
3. sign for the seafarer;
4. sign for the shipowner/employer merely because the agent manages the object in the portal;
5. bypass party review because a power of attorney exists.

The same principle applies to platform registration.

An agent may create or request creation of a participant record, but the represented seafarer or shipowner/employer should become a registered platform participant, accept the platform account/terms personally and either:

1. continue as self-managed;
2. personally appoint the agent as managing representative;
3. reject the agent's management request;
4. appoint a different agent.

Until this happens, agent-created participant records should be treated as limited preparation records, not as fully party-controlled accounts.

Employer-side representative signing may be lawful in some cases because the MLC allows the shipowner or a representative of the shipowner to sign the SEA. CrewPortGlobal must still treat this as an authority-controlled employer-side signature context, not as ordinary agent substitution.

Seafarer-side signing must remain personal by default. Signing by a representative for the seafarer is a high-risk exception and must require legal/control review, verified legal basis, explicit seafarer consent evidence and a visible exception audit event.

## 6. Representative-Signing Exception Gate

If any party proposes signature through a representative or power of attorney, the contract workspace must enter:

```text
signature_by_representative_exception_review
```

Required checks:

1. which party is represented;
2. representative identity and legal capacity;
3. authority document reference and validity;
4. vessel flag / CBA / mandatory law compatibility;
5. reason why personal signature is unavailable or inappropriate;
6. evidence that the party received the populated agreement before execution;
7. evidence that the party had opportunity to examine and seek advice;
8. Platform Administration / Control approval;
9. maritime legal review where required;
10. final audit event and exception label on the contract instance.

The exception must not be hidden inside a generic `approved` status.

## 7. Dual-Representation Conflict Standard

Dual-interest facilitation is permitted.

Dual-representation conflict exists only when the same agent organization, agent user or controlled affiliate seeks to hold formal management, final approval or signature authority for more than one materially interested party in the same transaction, including:

1. seafarer and shipowner/employer in the same contract workspace;
2. seafarer and vessel/operator where vessel/operator interests affect wages, travel, insurance, repatriation or termination;
3. shipowner and seafarer for the same candidate-selection or terms-clarification workspace;
4. platform service delegate and one party where the delegate also has a private agent authority for the opposite party.

When detected, the workspace/task must be marked:

```text
dual_management_review_required
```

The older label `dual_representation_review_required` remains acceptable as a legacy blocker name, but future UI/API wording should prefer `dual_management_review_required` because ordinary dual-interest facilitation is not prohibited.

Allowed while blocked:

1. view safe non-sensitive object summaries inside existing authority scope;
2. submit missing documents;
3. correct factual identity/contact/vessel data;
4. request Platform Administration / Control review.

Not allowed while blocked:

1. finalize wages, currency, payment method, allotment or deductions;
2. finalize joining travel payer/arranger or repatriation/return responsibility;
3. finalize insurance, medical, death/disability or family-benefit terms;
4. finalize early termination, replacement, complaint/forum or CBA/law terms;
5. move a contract workspace to `ready_for_signature`;
6. generate, sign or mark an agreement as executed.

Conflict clearance requires:

1. visible disclosure to both parties;
2. direct party confirmation that they understand the agent's dual capacity;
3. Platform Administration / Control approval;
4. legal/control review where contract-critical terms are affected;
5. separate audit events for each party confirmation.

The preferred clearance route is party activation:

```text
agent-created participant record
-> participant registers or claims account
-> participant reviews the agent relationship
-> participant personally appoints, rejects or replaces agent
-> only one active managing representative remains for that participant object
```

Power-of-attorney clearance is allowed only as an enhanced exception route and must not remove the party's right to receive notice, review contract-critical terms and replace the agent where legally and practically possible.

## 8. Contract-Critical Fields Requiring Direct Party Approval

The following fields must require direct seafarer and shipowner/employer review before signature readiness:

| Contract area | Direct approval requirement |
|---|---|
| Parties and authority | Seafarer identity, shipowner/employer identity, representative authority and contract reference. |
| Position and vessel | Rank, duties, vessel, flag, joining place and voyage/trading context. |
| Contract term | Type, joining date, duration, expected end/rotation and extension rule. |
| Wages and payment | Amount, currency, frequency, method, allotment/split payment, wage statements and deductions. |
| Working time, rest and leave | Applicable CBA/law, rest-hour rule, overtime and leave/pay treatment. |
| Joining travel | Start point, arranger, payer, visa/medical preparation responsibility and reimbursement rule. |
| Repatriation/return | Return destination, arranger, payer, exceptions and early-termination return rule. |
| Medical/insurance/welfare | Medical care, shipowner liability, P&I/insurance evidence, death/disability/family-benefit references where applicable. |
| Documents/certificates | Required documents, readiness, expiry and who pays for permitted preparation costs. |
| Complaint/dispute | Onboard complaint route, platform complaint route, employer contact, law/CBA/forum reference. |
| No-fee acknowledgement | Confirmation that seafarer is not charged recruitment/placement fees. |
| Signature/copies | Signature method, date/place, language, originals/copies and representative exception if any. |

Agent-prepared values for these fields must remain proposals until party review confirms them.

## 9. Task-Routing Impact

Agent tasks must no longer be described only as:

```text
Agent manages object
```

They must be described as:

```text
Agent manages object under {capacity} for {represented party}
```

Task computation for agent-managed objects must include:

```text
object state
+ represented party
+ representation capacity
+ authority evidence status
+ conflict status
+ required permission
+ contract-critical flag
= visible task / blocked task
```

If the task is contract-critical and the agent is not the actual party, the task may let the agent prepare or request correction, but final approval must route to the seafarer and shipowner/employer side.

## 10. Recommended Next Implementation Stage

Because CPG-BIZ-125 is now fixed as the representation/conflict/signature standard, the previously recommended notification task moves forward to a broader CPG-BIZ-126 representative-appointment stage.

Recommended next stage:

```text
CPG-BIZ-126 - Participant representative appointment and assignment notification standard
```

The next stage must cover not only shipowner-agent changes, but also seafarer-agent changes, agent-created participant activation and the one-active-manager rule.

The notification/appointment model must include:

1. object type and safe object summary;
2. new managing agent organization;
3. previous managing agent where applicable;
4. represented party;
5. representation capacity;
6. authority reference/status;
7. whether the reassignment affects contract-critical work;
8. whether the participant has personally activated/claimed the account;
9. safe action link or blocker explanation.

## 11. Controlled Boundaries

This standard does not implement a runtime feature by itself.

No final contract signature, representative exception, dual-representation clearance or contract generation should be implemented until the relevant API/UI/database task is separately approved and verified.

This standard also does not decide the final legal wording of the SEA. It fixes the platform behavior required before legal wording can be safely operationalized.
