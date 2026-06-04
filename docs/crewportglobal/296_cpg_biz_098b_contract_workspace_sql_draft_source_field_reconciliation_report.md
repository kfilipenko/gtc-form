# CPG-BIZ-098B - Contract Workspace SQL Draft Source Field Reconciliation Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: SQL draft review / approval-gate discussion report
- Source task: CPG-BIZ-098A continuation and Project Owner instruction
- Version: 1.0
- Date: 2026-06-04
- Status: Discussion result; no runtime migration approved

## 1. Purpose

This report records the first source-field reconciliation for the future Contract Agreement Workspace.

The goal is to decide whether the current SQL draft can be approved for conversion into a runtime migration, or whether it must be corrected first.

This stage does not execute DDL, DML, seed data, runtime migration, UI code or API code.

## 2. Controlling Rule

The contract must be formed from verified platform records first.

The Contract Agreement Workspace must not ask the parties or the team to retype data that already exists in approved forms.

The standard rule is:

```text
verified seafarer profile
+ verified employer / shipowner card
+ verified vessel card
+ reviewed crew request / vacancy
+ approved shortlist / candidate presentation evidence
+ approved master contract template and catalogs
= populated Contract Agreement Workspace
```

Only true contractual alternatives remain selectable inside the contract text.

## 3. Existing Source Records Checked

The current database model already contains the main records needed for contract prefill.

| Source area | Existing table / record | Use in contract |
|---|---|---|
| Seafarer identity and profile | `seafarer_profiles` | candidate profile link, rank, department, availability, nationality, residence, contacts where allowed |
| Seafarer personal details | `seafarer_person_details` | date/place of birth, gender, civil status, nationality, residence, address |
| Seafarer certificates and readiness | `seafarer_certificates`, `seafarer_training_records`, `seafarer_medical_declarations`, `uploaded_documents` | certificate, medical and document readiness references |
| Seafarer sea service | `seafarer_sea_service_records` | professional history evidence and suitability context |
| Employer / shipowner | `employer_companies`, `company_users` | legal name, registration number, country, company role, authorized representative context |
| Vessel | `vessels` | vessel name, IMO, vessel type, flag, company link |
| Vacancy / crew request | `vacancy_requests`, `demand_requirement_items` | requested rank, department, vessel type, joining date, duration, salary range, currency and demand requirements |
| Candidate selection evidence | `operator_shortlist_drafts`, `operator_shortlist_candidates`, `vacancy_applications` | approved internal candidate selection and presentation evidence |
| Protected documents | `uploaded_documents` | identity, authority, vessel, medical, CBA and other evidence documents |

## 4. Fields The Script Should Take From Filled Forms

The future contract-generation script should prefill these contract fields from existing verified data.

| Contract field group | Contract fields | Primary source | Expected behavior |
|---|---|---|---|
| Parties | C-1.1 seafarer legal name, C-1.2 nationality, C-1.3 ID/passport reference | `seafarer_profiles`, `seafarer_person_details`, `uploaded_documents` | Read-only / source-linked. Correction must happen in the source profile or document record. |
| Employer party | C-1.4 employer legal name, C-1.5 representative, C-1.6 authority evidence | `employer_companies`, `company_users`, `uploaded_documents` | Read-only / source-linked after employer verification. |
| Platform references | C-1.7 platform contract reference, C-1.8 template version, C-1.9 workspace reference | `contract_workspace_instances`, `master_contract_templates` | Computed. |
| Vessel | C-3.1 vessel name, C-3.2 IMO, C-3.3 flag, C-3.4 vessel type, C-3.8 operator/manager, C-3.9 vessel particulars | `vessels`, `employer_companies`, `uploaded_documents` | Source-linked; vessel type may use catalog value from vessel/vacancy. |
| Position | C-4.1 rank, C-4.2 department, C-4.5 required certificates | `vacancy_requests`, `demand_requirement_items`, seafarer readiness records | Source-linked from reviewed demand and candidate readiness. |
| Term | C-5.3 start/joining date, C-5.4 duration value, C-5.5 duration unit | `vacancy_requests.join_date`, `contract_duration_value`, `contract_duration_unit`, legacy `contract_duration` | Prefilled from reviewed demand; editable only as controlled contract alternative if parties change the business condition. |
| Wages | C-6.1 base wage amount, C-6.2 currency | `vacancy_requests.salary_min_usd`, `salary_max_usd`, `salary_text`, `currency` | Prefilled from reviewed demand; final exact wage may require selection/confirmation inside contract. |
| Documents | C-10.1 medical certificate status, C-11.1..C-11.7 document readiness | `uploaded_documents`, seafarer certificate/medical tables, `demand_requirement_items` | Computed/read-only with blocker if required document is missing, expired or not verified. |
| Applicable law and flag | C-16.1 flag-state rule reference | `vessels.flag_country_code` | Source-linked. |
| Selection evidence | candidate selected for contract | `operator_shortlist_drafts`, `operator_shortlist_candidates`, `vacancy_applications` | Must link to the exact candidate selection event before contract proposal is available. |

## 5. Fields That Should Remain Selectable In Contract Context

These are not merely copied from forms. They are contractual alternatives that must be selected or confirmed in the Contract Agreement Workspace.

| Contract area | Examples |
|---|---|
| Payment | payment frequency, payment method, allotment/split payment, wage statement method |
| Joining | joining place, travel arranger, travel payer, visa/medical preparation responsibility |
| Return / repatriation | return destination, arranger, payer, transport mode, return timing rule |
| Working conditions | hours/rest rule, overtime treatment, leave pay, food/catering, PPE, welfare/communication |
| Replacement and termination | early termination reasons, notice rule, replacement support rule, evidence requirements |
| Law/CBA/disputes | CBA applicability, CBA document reference, dispute route, forum, mandatory-protection exception if allowed |
| Signatures | party approval, signature place/date, copy distribution method, contract language |

## 6. SQL Draft Review Result

The current SQL draft is directionally correct because it already creates:

1. master contract templates;
2. clauses;
3. field catalogs and catalog values;
4. contract workspace instances;
5. embedded field values;
6. party approvals;
7. generated contract instances;
8. contract generation audit events;
9. source traceability on embedded field values.

However, one correction should be made before approving runtime migration.

## 7. Required SQL Draft Correction Before Approval

The contract workspace currently links to:

```text
shortlist_draft_id
vacancy_application_id
seafarer_profile_id
```

That is not precise enough for the future "Propose contract" operation because the business action is tied to a specific candidate row inside a shortlist / presentation result.

The SQL draft should add a nullable direct link to the candidate shortlist row:

```sql
ALTER TABLE crewportglobal.contract_workspace_instances
  ADD COLUMN shortlist_candidate_id UUID
    REFERENCES crewportglobal.operator_shortlist_candidates(shortlist_candidate_id)
    ON DELETE SET NULL;

CREATE INDEX contract_workspace_instances_shortlist_candidate_idx
  ON crewportglobal.contract_workspace_instances (shortlist_candidate_id, created_at DESC);
```

This is not to be executed now. It is the proposed correction to the SQL draft before a real runtime migration is prepared.

The same value should also be allowed in embedded field source traceability:

```text
source_object_type = shortlist_candidate
source_object_id = operator_shortlist_candidates.shortlist_candidate_id
```

## 8. Proposed "Propose Contract" UI Rule

The button:

```text
Предложить контракт
```

should not be a permanent generic button on every shipowner card.

It should be a computed operation shown only for a concrete candidate and a concrete vacancy when all required source conditions are satisfied.

Minimum visibility conditions:

1. employer / shipowner card is verified or otherwise approved for contract workflow;
2. vessel is linked and has required verified data;
3. crew request / vacancy has passed review;
4. candidate was included in an approved internal shortlist or approved presentation workflow;
5. candidate source guard has no hard blocker;
6. candidate profile and required documents are sufficient for contract preparation;
7. required employer-sharing / contract-preparation consent exists;
8. no unresolved source-card correction blocks the contract fields.

Recommended placement:

```text
Shipowner cabinet
-> Vacancy / crew request
-> Candidate list for this request
-> Candidate card
-> Предложить контракт
```

The button should open the Contract Agreement Workspace creation flow with:

```text
vacancy_request_id
shortlist_candidate_id
seafarer_profile_id
employer_company_id
vessel_id
```

## 9. Shipowner Menu Addition For Candidate Review

The shipowner menu should gain a clear candidate stage.

Recommended structure:

| Menu area | Purpose |
|---|---|
| Заявки | employer crew requests / vacancies |
| Кандидаты | employer-safe candidate list per reviewed request |
| Договоры | future contract workspaces and signed/generated contracts |
| Суда | vessel cards and vessel evidence |
| Компания | company verification and authority evidence |

The first implementation should focus on:

```text
Кандидаты по заявке
```

The employer-safe candidate view must show only approved fields:

1. rank / department;
2. availability;
3. vessel-type fit;
4. document readiness;
5. matching explanation;
6. blocker status;
7. candidate presentation status;
8. allowed action: hold, reject, proceed to contract, depending on workflow state.

It must not expose restricted contact data, broad document metadata or protected files unless a separate approved visibility gate allows it.

## 10. Approval Gate Decision

Current decision:

```text
SQL draft is not yet ready for runtime migration approval.
```

Reason:

```text
The draft needs a direct shortlist_candidate_id source link before the "Propose contract" workflow is implemented.
```

After this correction is accepted, the next gate can prepare either:

1. an updated SQL draft only; or
2. a runtime migration package with tests, if Project Owner separately approves migration implementation.

## 11. Next Recommended Stage

Recommended next stage:

```text
CPG-BIZ-098C - Contract workspace SQL draft correction for shortlist candidate source link
```

After CPG-BIZ-098C:

```text
CPG-BIZ-099 - Shipowner candidate review menu and Propose Contract computed operation design
```

No portal UI change should be implemented until the candidate-view visibility rule and contract-proposal guard are approved.

