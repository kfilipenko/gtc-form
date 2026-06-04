# CPG-BIZ-092 - Seafarer / Shipowner Contract Workspace And Formal Document Reference Standard

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Contract-workspace specification and documentation standard
- Source task: Project Owner approval after CPG-BIZ-091
- Version: 1.2
- Date: 2026-06-04
- Status: Drafted for Project Owner and maritime legal review

## 1. Purpose

This document converts the draft seafarer / shipowner contract model into a full future contract workspace specification.

The workspace will later allow an authorized agent to prepare a contract draft from structured platform data, select variable conditions from approved catalogs inside the clauses they affect, resolve `to_be_agreed` items, submit the populated agreement to parties for review and generate a standard contract document.

This document also introduces a documentation standard:

```text
If a portal statement is governed by a formal document, the portal should refer to the document and clause instead of rewriting the rule in many places.
```

## 2. External Legal Orientation

Open-source references used for orientation:

1. ILO Maritime Labour Convention, 2006, Standard A2.1 - seafarers' employment agreements.
2. ILO Maritime Labour Convention, 2006, Standard A2.2 - wages.
3. UK MCA MGN 477 (M) Amendment 5 - seafarers' employment agreements.
4. UK MCA MGN 478 (M) Amendment 1 - seafarers' wages.

These references are orientation only.

The final production master contract template, its fixed clauses, approved variable catalogs and any material amendments must be reviewed by a qualified maritime lawyer for the vessel flag model, applicable collective bargaining agreement, employer jurisdiction, seafarer context and licensing/regulatory model.

After a master contract version has been approved, ordinary contract instances generated only from locked clauses, approved catalogs, verified platform records and party confirmations should not require new legal drafting each time.

Fresh legal/control review is required when a fixed clause is changed, a new legally material catalog value is introduced, a vessel flag / CBA / mandatory law requirement is not supported by the approved template, a party requests a non-standard term, or a dispute / exception is recorded.

## 3. Formal Document Reference Standard

### 3.1 Rule

When a condition is governed by a formal project document, public page, form hint, task description or generated document must use this pattern:

```text
This condition is governed by {Document name}, clause {clause number / section}.
```

or, in a short UI form:

```text
Regulated by: {Document name} {clause}
```

The UI should not rewrite the full rule unless the text is the formal document itself.

### 3.2 Reason

This prevents:

1. different wording in different pages;
2. accidental legal contradiction;
3. outdated explanations after document updates;
4. translation drift across languages;
5. incorrect interpretation by users, staff or automated tools.

### 3.3 Required implementation behavior

Any new page or form dealing with legal, contract, consent, no-fee, complaint, privacy, billing or employment conditions must:

1. identify the controlling formal document;
2. reference the exact section or clause;
3. avoid copying long legal wording into operational UI;
4. use short labels and links to the formal document;
5. update references when clause numbers change;
6. require human review before machine translation publication.

Contract wording must additionally follow the master-agreement control:

1. fixed clauses are stored as approved versioned text;
2. UI forms may select variables and catalog values only;
3. operational users must not rewrite fixed clauses;
4. generated instances must record the master agreement version and catalog version;
5. clause changes require a new approved version.

### 3.4 Examples

| Topic | Correct UI text | Incorrect UI pattern |
|---|---|---|
| No recruitment fee | `Regulated by: Seafarer Candidate Agreement, No recruitment fees section.` | Rewriting the fee rule differently on each page. |
| Shipowner employment responsibility | `Regulated by: Shipowner Service Agreement, Shipowner responsibilities section.` | Saying generally that CrewPortGlobal or the shipowner "handles employment" without source. |
| Contract wage terms | `Regulated by: Seafarer Employment Agreement, Wages and payment section.` | Free-text wage promise not linked to the agreement. |
| Complaint route | `Regulated by: Complaint Handling Procedure.` | Creating a separate complaint explanation on every page. |

## 4. Contract Form Object

Future form object:

```text
seafarer_employment_contract_draft
```

Primary linked objects:

1. `seafarer_profile`;
2. `employer_company`;
3. `vessel`;
4. `vacancy_request`;
5. `candidate_presentation` or approved candidate decision;
6. `employment_voyage_support_record`;
7. uploaded contract/support documents;
8. audit events.

## 5. Contract Form Lifecycle

| Status | Meaning | Main task |
|---|---|---|
| `draft_from_platform_data` | Draft created from verified records and pre-contract terms. | Review imported contract data. |
| `draft_incomplete` | Required fields or documents are missing. | Complete contract fields. |
| `terms_to_be_agreed` | One or more material fields remain `to_be_agreed`. | Resolve contract terms with parties. |
| `party_review` | Draft is ready for party review but not signature. | Send / collect party review. |
| `needs_correction` | Party or control reviewer requested correction. | Correct contract draft. |
| `ready_for_signature` | All required fields and approvals are complete. | Sign / confirm contract. |
| `signed_pending_embarkation` | Contract is signed, boarding not confirmed. | Confirm boarding evidence. |
| `active_onboard` | Boarding confirmed; voyage active. | Confirm monthly service evidence. |
| `completed` | Contract and return cycle completed. | Close and retain evidence. |
| `terminated_early` | Early termination occurred. | Resolve return, replacement and billing effects. |
| `cancelled` | Contract cancelled before active service. | Close or restart matching. |
| `disputed` | Material disagreement exists. | Escalate to responsible control/legal role. |

## 6. Full Contract Form Sections

### 6.1 Section C-1 - Parties

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-1.1 | Shipowner / employer legal name | linked record | employer company | Yes | 1. Parties |
| C-1.2 | Employer registered address | linked record / text | employer company | Yes | 1. Parties |
| C-1.3 | Authorized representative | linked record | employer representative | Yes | 1. Parties |
| C-1.4 | Authority evidence reference | uploaded document reference | employer documents | Yes | 1. Parties |
| C-1.5 | Seafarer full legal name | linked record | seafarer profile | Yes | 1. Parties |
| C-1.6 | Seafarer document reference | uploaded document reference | seafarer documents | Yes | 1. Parties |
| C-1.7 | Platform contract reference | generated ID | contract draft | Yes | 1. Parties |

### 6.2 Section C-2 - Vessel And Voyage

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-2.1 | Vessel name | linked record | vessel | Yes |
| C-2.2 | IMO / official number | linked record / text | vessel | Conditional |
| C-2.3 | Flag | catalog `countries` / flag state | vessel | Yes |
| C-2.4 | Vessel type | catalog `vessel_types` | vessel | Yes |
| C-2.5 | Port of registry | text/catalog | vessel | Conditional |
| C-2.6 | Trading area / voyage area | catalog + text | vacancy request | Conditional |
| C-2.7 | Joining port / place | catalog + text | vacancy request / contract | Yes |

### 6.3 Section C-3 - Position And Duties

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-3.1 | Rank / position | catalog `seafarer_positions` | vacancy / seafarer | Yes |
| C-3.2 | Department | catalog `departments` | vacancy / seafarer | Yes |
| C-3.3 | Watchkeeping role | catalog | vacancy / contract | Conditional |
| C-3.4 | Special duties | multi-select catalog + notes | vacancy / contract | Conditional |
| C-3.5 | Reporting line | text/catalog | contract | Conditional |

### 6.4 Section C-4 - Contract Term

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-4.1 | Contract type | catalog `contract_type` | vacancy / contract | Yes |
| C-4.2 | Expected joining date | date | vacancy | Yes |
| C-4.3 | Contract duration | number + unit | vacancy / contract | Yes |
| C-4.4 | Expected end date | date | computed / contract | Conditional |
| C-4.5 | Extension rule | catalog | contract | Conditional |
| C-4.6 | Probation period | number + unit / none | contract | Conditional |

### 6.5 Section C-5 - Wages And Payment

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-5.1 | Base wage amount | decimal | vacancy / contract | Yes |
| C-5.2 | Currency | catalog `contract_currency` | vacancy / contract | Yes |
| C-5.3 | Wage payment frequency | catalog `wage_payment_frequency` | contract | Yes |
| C-5.4 | Wage payment method | catalog `wage_payment_method` | contract | Yes |
| C-5.5 | Overtime treatment | catalog / CBA reference | contract | Conditional |
| C-5.6 | Leave pay treatment | catalog / CBA reference | contract | Conditional |
| C-5.7 | Allotment / split payment | catalog + account fields | contract | Conditional |
| C-5.8 | Permitted deductions | catalog + legal/CBA reference | contract | Conditional |
| C-5.9 | Wage statement method | catalog | contract | Conditional |

### 6.6 Section C-6 - Working Time, Rest And Leave

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-6.1 | Applicable CBA | linked document / none | employer/vessel | Conditional |
| C-6.2 | Applicable law / flag rule | catalog + text | vessel/contract | Yes |
| C-6.3 | Work/rest scheme | catalog | contract | Conditional |
| C-6.4 | Paid leave rule | catalog / CBA reference | contract | Conditional |
| C-6.5 | Public holiday rule | catalog / CBA reference | contract | Conditional |

### 6.7 Section C-7 - Joining Travel

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-7.1 | Joining start point | catalog `joining_start_point` | seafarer/vacancy | Yes |
| C-7.2 | Joining travel responsibility | catalog `joining_travel_responsibility` | vacancy/contract | Yes |
| C-7.3 | Joining travel payer | catalog `joining_travel_responsibility` or payer catalog | contract | Yes |
| C-7.4 | Visa preparation responsibility | catalog | contract | Conditional |
| C-7.5 | Medical preparation responsibility | catalog | contract | Conditional |
| C-7.6 | Joining travel notes | text | contract | Conditional |

### 6.8 Section C-8 - Repatriation And Return

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-8.1 | Return destination | catalog `return_destination` + text | seafarer/contract | Yes |
| C-8.2 | Return responsibility | catalog `return_responsibility` | vacancy/contract | Yes |
| C-8.3 | Return payer | catalog | contract | Yes |
| C-8.4 | Return support provider | catalog | contract | Conditional |
| C-8.5 | Return exceptions | catalog + review | contract | Conditional |
| C-8.6 | Return support notes | text | contract | Conditional |

### 6.9 Section C-9 - Medical Care, Insurance And Welfare

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-9.1 | Insurance / P&I reference | linked document/text | employer/vessel | Conditional |
| C-9.2 | Medical care rule | catalog / CBA reference | contract | Yes |
| C-9.3 | Illness/injury wage continuation rule | catalog / CBA reference | contract | Conditional |
| C-9.4 | Emergency contact process | text / reference | contract | Conditional |

### 6.10 Section C-10 - Documents And Certifications

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-10.1 | Required identity documents | document checklist | seafarer/vacancy | Yes |
| C-10.2 | Required certificates | document checklist | seafarer/vacancy | Yes |
| C-10.3 | Required visas / endorsements | document checklist | vacancy/contract | Conditional |
| C-10.4 | Document readiness status | computed | documents | Yes |
| C-10.5 | Replacement document requirement | computed / review | documents | Conditional |

### 6.11 Section C-11 - Replacement And Early Termination

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-11.1 | Early termination reasons | catalog `early_termination_reason` | contract | Yes |
| C-11.2 | Notice period | number + unit | contract / CBA | Conditional |
| C-11.3 | Replacement handling | catalog `replacement_handling` | service package / contract | Yes |
| C-11.4 | Early disembarkation return rule | catalog / CBA reference | contract | Yes |
| C-11.5 | Billing consequence | catalog | commercial terms | Conditional |

### 6.12 Section C-12 - Complaints And Disputes

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-12.1 | Employer complaint contact | linked record/text | employer | Yes |
| C-12.2 | Onboard complaint procedure reference | document/link | vessel/employer | Conditional |
| C-12.3 | CrewPortGlobal complaint route | fixed document reference | Trust Center | Yes |
| C-12.4 | Applicable law / forum | catalog + legal review | contract | Conditional |

### 6.13 Section C-13 - Platform Evidence And Data

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-13.1 | Platform record IDs | generated links | platform | Yes |
| C-13.2 | Evidence retention reference | formal document reference | Trust Center | Yes |
| C-13.3 | Data sharing scope | formal document reference | Trust Center | Yes |
| C-13.4 | No-fee acknowledgement | formal document reference + flag | consent/profile | Yes |

### 6.14 Section C-14 - Signatures And Copies

| Field code | Field | Type | Source | Required | Contract clause |
|---|---|---|---|---|---|
| C-14.1 | Seafarer confirmation | signature / electronic confirmation | contract | Yes |
| C-14.2 | Employer confirmation | signature / electronic confirmation | contract | Yes |
| C-14.3 | Date and place of signing | date + place | contract | Yes |
| C-14.4 | Witness / facilitator | linked person / optional | contract | Conditional |
| C-14.5 | Copy distribution | catalog | contract | Yes |

## 7. Required Contract Catalogs

| Catalog code | Purpose | Initial values source |
|---|---|---|
| `contract_type` | Contract basis | CPG-BIZ-091 section 5.1 |
| `wage_payment_frequency` | Wage frequency | CPG-BIZ-091 section 5.2 |
| `wage_payment_method` | Wage payment channel | CPG-BIZ-091 section 5.3 |
| `contract_currency` | Wage currency | CPG-BIZ-091 section 5.4 |
| `joining_travel_responsibility` | Joining travel payer/arranger | CPG-BIZ-091 section 5.5 |
| `joining_start_point` | Joining start point | CPG-BIZ-091 section 5.6 |
| `return_responsibility` | Return / repatriation payer/arranger | CPG-BIZ-091 section 5.7 |
| `return_destination` | Return destination rule | CPG-BIZ-091 section 5.8 |
| `early_termination_reason` | Early termination classifier | CPG-BIZ-091 section 5.9 |
| `replacement_handling` | Replacement support rule | CPG-BIZ-091 section 5.10 |
| `contract_status` | Contract lifecycle state | CPG-BIZ-091 section 5.11 |
| `to_be_agreed` | Pre-final agreement placeholder | Allowed only before final contract confirmation |

## 8. Formal Document Links For Contract UI

The form should show short references rather than long explanations.

| Topic | Formal document reference |
|---|---|
| No recruitment / placement fee | `Seafarer Candidate Agreement`, no-fee section; `No Recruitment Fees Policy`. |
| Shipowner employment responsibility | `Shipowner Service Agreement`, shipowner responsibilities section. |
| Candidate matching is not employment guarantee | `Seafarer Candidate Agreement`, no guarantee of employment section. |
| Complaint route | `Complaint Handling Procedure`. |
| Privacy and data processing | `Privacy Policy`. |
| Candidate presentation and matching | `Recruitment and Matching Policy`. |
| Contract-specific wage/travel/return terms | Generated `Seafarer Employment Agreement`, relevant clause. |

## 9. Signature Guard

The contract draft must not become `ready_for_signature` unless:

1. all mandatory `C-*` fields are present;
2. `to_be_agreed` remains only where explicitly approved as a controlled exception;
3. seafarer and employer identities are linked to verified records;
4. employer representative authority exists;
5. vessel context is present;
6. wage amount, currency, payment frequency and payment method are explicit;
7. joining and return responsibilities are explicit;
8. no-fee acknowledgement exists;
9. required documents are present or explicitly marked as accepted exception;
10. formal document references are current.

## 9A. Contract Agreement Workspace Approval And Scripted Generation

The future implementation must distinguish:

1. selection of embedded contract conditions inside the agreement text; and
2. generation of the contract document.

The required workflow is:

1. An authorized employee opens the Contract Agreement Workspace for a selected seafarer, shipowner/employer, vessel and vacancy/request.
2. The workspace imports verified platform data and exposes only approved embedded fields under the master agreement.
3. The employee selects wage, payment, duration, joining, return, repatriation, replacement and service-evidence conditions from approved catalogs inside the relevant clauses.
4. The populated agreement is sent to the parties for review in contract context.
5. The seafarer and shipowner/employer approve/sign the populated contract workspace.
6. Only after required party approval/signature, the generation script creates the contract document from:
   - approved master agreement template;
   - verified seafarer data;
   - verified shipowner/employer data;
   - verified vessel data;
   - approved workspace values.
7. The generated document stores template version, catalog version, source records and document hash.

This workflow is intended to prevent incorrect wording, manual clause edits, mismatched party data and disagreement about which conditions were approved.

The previous detached condition-form model is superseded by CPG-BIZ-095. New implementation and documentation must use the Contract Agreement Workspace and embedded condition fields model.

## 10. Next Implementation Planning

Recommended next task:

```text
CPG-BIZ-097 - Contract workspace schema and SQL patch draft
```

Suggested scope:

1. reuse reference catalog codes and `C-*` field definitions from CPG-BIZ-094;
2. design additive tables for workspace storage and embedded field values;
3. design party approval and preview-hash storage;
4. design generated contract metadata storage;
5. provide SQL patch draft without executing DDL/DML.

## 11. Stage Status

This stage is documented.

No code, database, migration, runtime contract generation or legal publication changes were made.
