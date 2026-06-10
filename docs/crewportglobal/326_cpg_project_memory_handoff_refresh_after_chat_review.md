# CPG Project Memory Handoff Refresh After Chat Review

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Project memory and historical handoff refresh
- Source: local Codex session `Оценить проект Crewportglobal` reviewed on 2026-06-09
- Version: 2.0
- Date: 2026-06-10
- Status: Active continuation memory

## 1. Purpose

This document refreshes the active project memory after reviewing the earlier local Codex chat:

```text
Thread: Оценить проект Crewportglobal
Thread id: 019e230a-a872-7880-acb1-97bb1c05372c
Initial date: 2026-05-13
```

The goal is not to replace the documentation register or implementation reports. The goal is to preserve the practical context that should guide the next implementation stages.

## 2. Original Project-Owner Direction

The Project Owner asked to evaluate the existing CrewPortGlobal project because the site looked more like a reading book than a convenient application.

The comparison reference was:

```text
https://crewell.net/ru/
```

The accepted conclusion was:

1. CrewPortGlobal already had a useful engineering and documentation foundation.
2. The product needed to become an action-first international maritime application.
3. Public pages, registration, profile creation, vacancy intake and operator review needed to work as one practical platform.
4. The platform must show real marketplace activity, not fake vacancies or decorative content.

This direction was documented in:

```text
docs/crewportglobal/69_international_maritime_application_goal_and_task_backlog.md
```

## 3. Product Memory To Keep Active

CrewPortGlobal must continue as:

```text
an action-first international maritime jobs, crew data, vacancy intake, document-readiness and matching platform
```

The product should not drift back into a brochure or policy library.

Required operating principles:

1. First screen and main routes must give users useful actions quickly.
2. Seafarers must be able to create and maintain a maritime CV and apply to reviewed vacancies without recruitment or placement fees.
3. Employers, shipowners, vessel operators, ship managers and crewing managers must be able to register company context, vessels and vacancy requests.
4. Operators must review profiles, companies, vessels, documents and vacancy requests before public or candidate-facing use.
5. Public marketplace data must be reviewed, real and traceable.
6. Human review, correction tasks, audit trail and role separation remain core product controls.

## 4. Early Historical Milestones From The Reviewed Chat

The reviewed chat established or reinforced these early milestones:

| Area | Memory |
|---|---|
| Product goal | Document 69 became the active international maritime application goal and backlog. |
| UI direction | The site must become a working application surface, not a long explanatory website. |
| Vacancy flow | Vacancy board and employer intake should use real reviewed data. |
| Seafarer flow | `/create-profile/` is the practical CV/readiness workspace, not only an onboarding page. |
| Employer flow | `/post-vacancy/` is the practical employer/vessel/vacancy workspace. |
| Operator flow | `/verify/`, `/team/` and later role-specific workspaces are required for human review and audit. |
| Documentation discipline | Each implementation slice must be documented and registered. |
| Fixation discipline | Completed work should be verified and committed, not left only as chat context. |

## 5. Current Continuation State On 2026-06-09

Current repository:

```text
/var/www/gtc-form
```

Current implemented stage before this memory refresh:

```text
CPG-BIZ-124 - Agent assignment context enforcement in profile and demand forms
Commit: e3a8095 Enforce agent assignment context in forms
```

CPG-BIZ-124 added runtime enforcement for agent-opened profile and demand form APIs, protected document list/upload and seafarer workspace context resolution.

The Project Owner then identified a higher-order agent governance issue before implementing the notification stage:

```text
CPG-BIZ-125 - Agent representation conflict and personal contract-signature standard
```

CPG-BIZ-125 records that agent tasks must preserve represented-party capacity, ordinary dual-interest facilitation is permitted, formal dual-management/final authority must be controlled before contract-critical decisions, and the seafarer/shipowner contract must require direct party review and personal signature by default.

After the Project Owner clarified that agents naturally facilitate both sides but participants must retain account and representative choice, CPG-BIZ-126 was documented as:

```text
CPG-BIZ-126 - Participant representative appointment and assignment notification standard
```

CPG-BIZ-126 records the compromise model: an agent may create and prepare invitation/preparation records, but the participant should become a registered/claimed platform party, personally appoint/reject/replace the managing representative unless an enhanced authority exception is approved, and the system must keep only one active managing representative per object.

On 2026-06-10 this model was clarified further:

```text
physical person self-registers first
-> authenticated user selects platform capacity
-> user may act self-managed or appoint/replace an optional representative
```

Agent-created records are preparation/invitation contexts, not ordinary active physical-person service accounts. This applies equally to seafarer, shipowner/employer-side and agent-side participants.

The Project Owner then clarified that representative appointment must not create shared editing. The active model is:

```text
participant credentials remain personal
+ representative appointment transfers operational editing for the delegated object/scope
+ participant keeps governance rights to view, appoint, replace and revoke
+ no concurrent participant/agent editing of the same delegated section
```

The Project Owner then clarified that delegation must also preserve governance visibility. Active rule:

```text
every authority confirmation, representative agreement/POA event,
delegation status change, document-stage milestone and obligation-stage milestone
must create a durable notification record for the represented physical person
```

This lets the physical person see process progress and intervene through revoke, replace or control-review actions without sharing operational editing.

The runtime notification implementation is now:

```text
CPG-BIZ-127 - Participant governance notification ledger API/UI implementation
```

After review of the shipowner-agent agreement package, document 324 / CPG-BIZ-123 was updated as the first practical offer/acceptance appointment package for this runtime stage:

```text
shipowner sends in-system offer to agent
+ agent accepts/signs standard adhesion-form agreement package
+ POA / authority document is issued and recorded on the CrewPortGlobal side where applicable
+ mandatory appendices
+ commercial terms status: separate Service Order / commercial addendum / request pending or accepted
+ signatory authority verification
+ one-active-manager check
+ delegated operational lock
+ durable notification to the shipowner physical representative
= active shipowner-side agent management
```

The contract text now clarifies that the shipowner cannot directly appoint an agent inside the platform before the agent accepts the standard platform agreement package. The agreement is treated as a CrewPortGlobal standard form / adhesion framework contract: arbitrary external contracts may be uploaded as evidence for Platform Administration / Control review, but they do not automatically activate platform-controlled agent management because CrewPortGlobal cannot enforce unnormalized terms.

Commercial price is deliberately separated from framework acceptance. The parties may accept the legal/authority/no-fee/notification framework without agreeing a concrete service price. Paid service activation, billing basis, success fee, SLA penalties/bonuses and invoices require a separate Service Order / commercial addendum / request or approved price-basis record. Wage, joining, return and repatriation terms inside the shipowner-agent agreement are coordination terms for request handling, SEA preparation and evidence control. They do not replace the seafarer employment agreement, applicable law, CBA or mandatory MLC protections. The next implementation stage should therefore use the shipowner offer to agent, agent acceptance/signature, platform-side authority, `commercial_terms_pending` and separate commercial activation scenario as the first CPG-BIZ-127 runtime slice.

On 2026-06-10 the first CPG-BIZ-127 runtime slice was implemented and recorded as document 329:

```text
CPG-BIZ-127 - Participant governance notification ledger API/UI implementation
Document: docs/crewportglobal/329_cpg_biz_127_participant_governance_notification_ledger_implementation_report.md
```

Implemented result:

```text
shipowner /shipowners/candidates/ selects registered agent
-> shipowner sends in-system framework offer
-> agent /agents/ sees offer as task/card
-> agent checkbox-accepts standard framework terms
-> backend creates verified shipowner_agency_agreement authority
-> backend creates active agent_object_assignment for employer_company
-> backend records participant_notification_ledger events
-> commercial_terms_status remains commercial_terms_pending
```

Test agent seed now exists:

```text
projects/crewportglobal/app/backend/db/seeds/001_test_agent.sql
email: test.agent@crewportglobal.test
password: TestAgent#2026
agent_code: TEST_AGENT_001
```

On 2026-06-10 the public document publication model was fixed as:

```text
CPG-BIZ-128 - Public legal documents hub and agent agreement publication
Document: docs/crewportglobal/330_cpg_biz_128_public_legal_documents_hub_and_agent_agreement_report.md
```

The `/legal/` section is now the canonical public place for platform standards, agreements, policies and operating rules. Public runtime links must use published legal URLs such as `/legal/agent-agreement/`, not raw internal `/docs/crewportglobal/*.md` files. The shipowner-agent framework agreement is published as the first agent appointment standard in this section, and the older `/shipowners/agent-agreement/` preview route redirects to it.

On 2026-06-10 the shared public/application header model was fixed as:

```text
CPG-BIZ-129 - Shared public header component
Document: docs/crewportglobal/331_cpg_biz_129_shared_public_header_component_report.md
```

Ordinary pages using `.site-header` are now normalized by `projects/crewportglobal/public/assets/crewportglobal-navigation.js`. The `CPG` brand mark and `CrewPortGlobal` brand name are protected from translation, and header design changes should be made in the shared runtime/CSS instead of repeating manual HTML edits across pages.

Recommended next work remains inside CPG-BIZ-127 follow-up slices:

```text
Service Order / commercial addendum activation
+ previous-agent replacement/revocation
+ seafarer-side representative appointment
+ notification read/delivery lifecycle
+ delegated operational lock coverage across participant edit surfaces
```

## 6. Active Working Rules For Future Continuation

1. Use `/var/www/gtc-form` as the active CrewPortGlobal repository.
2. Read existing standards and reports before implementation.
3. Preserve historical document numbering and avoid reusing occupied numbers.
4. If a numbering conflict is discovered, keep the stronger governance/source document stable and move the implementation report forward.
5. Do not treat old planning-only documents as current implementation blockers when later reports and standards supersede them.
6. Use current controlling standards such as BP-014 and ICS-001..003 for form lifecycle, protected upload and submit-review behavior.
7. For each completed implementation slice, update the relevant report/registers, run focused verification, clean generated artifacts and commit.
8. The Project Owner expects "фиксация" to mean both documentation/history fixation and git fixation where repository files changed.

## 7. Controlled Boundaries

This memory refresh does not authorize a new runtime feature by itself.

It only records continuation context so that future work remains aligned with the already approved product direction and the current implementation state.
