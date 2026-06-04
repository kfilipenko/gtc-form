# CPG-BIZ-091 - Seafarer / Shipowner Contract Template And Variable Catalog Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Contract-template design and variable-field matrix
- Source task: Project Owner approval after CPG-BIZ-090
- Version: 1.1
- Date: 2026-06-04
- Status: Drafted for Project Owner and legal review

## 1. Purpose

This document defines the first CrewPortGlobal draft structure for a seafarer / shipowner employment-support contract workflow.

The purpose is not to replace maritime legal review. The purpose is to create a structured, internationally understandable contract model that can later be generated from platform data:

```text
verified employer
+ verified vessel
+ structured vacancy / crew request
+ selected seafarer profile
+ agreed contract variables
= draft seafarer employment agreement / employment-support agreement
```

The future form should let an authorized agent select contract variables from catalogs, resolve `to_be_agreed` fields and generate a draft contract for review and signing by the relevant parties.

## 2. Legal And Practice Orientation

Open-source international references reviewed for orientation:

1. ILO Maritime Labour Convention, 2006, as amended - seafarers' employment agreements, wages, repatriation, work/rest, paid leave, medical care and complaint procedures.
2. UK MCA MGN 477 (M) Amendment 5 - seafarers' employment agreements and information to be included in SEA.
3. UK MCA MGN 478 (M) - seafarers' wages guidance connected to SEA wage provisions.
4. ITF seafarer agreement materials - practical CBA/SEA structure, contract copies and CBA linkage.

This project document is not legal advice.

The controlled production model is:

```text
legally reviewed master agreement version
+ approved variable catalogs
+ selected structured terms
+ party confirmations
= generated contract instance
```

The master agreement text, its fixed clauses and any material amendments must be reviewed before publication or production use by a qualified maritime lawyer considering:

1. vessel flag state;
2. shipowner / employer jurisdiction;
3. seafarer nationality and residence;
4. applicable collective bargaining agreement;
5. MLC implementation in relevant jurisdictions;
6. port-state, immigration, visa, insurance and tax requirements;
7. licensed manning / recruitment requirements where applicable.

After a master agreement version and its catalogs are approved, ordinary contract instances generated only from locked clauses and approved catalog values should not require new legal drafting each time.

Fresh legal/control review is required when:

1. fixed contract wording is changed;
2. a new legally material catalog value is added;
3. the vessel flag, CBA or applicable mandatory law requires a clause variation not already supported by the approved template;
4. a party requests a non-standard term;
5. an exception or dispute is recorded.

## 3. Core Contract Design Principle

The contract should be standard in structure and variable in data.

The fixed text protects consistency. The variable fields let the platform adapt the contract to:

1. vessel;
2. rank;
3. voyage;
4. contract duration;
5. wage and payment method;
6. joining and return logistics;
7. repatriation responsibility;
8. CBA / flag-state requirements;
9. replacement and early termination terms;
10. service evidence and billing basis.

The platform should never generate a final contract silently from free text. Contract-critical terms must be structured.

Approved fixed clauses are immutable for ordinary users and employees. They may select approved variants and complete structured fields, but they must not rewrite legal clauses inside an operational workspace.

## 4. Proposed Contract Sections

| Section | Purpose | Variable data required |
|---|---|---|
| 1. Parties | Identify seafarer, shipowner/employer and authorized representative. | Seafarer, employer, representative, authority evidence. |
| 2. Vessel and voyage | Identify vessel, flag, IMO where available, vessel type and operating area. | Vessel record, flag, vessel type, joining port, trading area. |
| 3. Position and duties | Define rank/position and principal duties. | Rank, department, watchkeeping status, special duties. |
| 4. Contract basis | Define fixed-term, voyage contract, rotation or other basis. | Contract type, start date, expected end date, duration. |
| 5. Wages and payment | Define wage, currency, payment frequency, payment method and permitted deductions. | Salary, currency, payment frequency, method, allotment, deductions. |
| 6. Working time and rest | Reference applicable law/CBA and onboard rest-hour rules. | CBA applicability, hours scheme, overtime treatment. |
| 7. Leave and vacation pay | Define paid leave or included leave basis. | Leave accrual, included in wage or paid separately. |
| 8. Joining travel | Define how the seafarer reaches the vessel. | Joining place, payer, arranger, visa/medical responsibility. |
| 9. Repatriation and return | Define how the seafarer returns after contract or early termination. | Return destination, payer, arranger, exceptions. |
| 10. Medical care and insurance | Define medical, illness, injury and insurance responsibility. | Insurance status, medical provider, emergency contact rule. |
| 11. Documents and certifications | Confirm required documents and validity. | Passport, seaman book, COC, medical, visas, STCW. |
| 12. Onboard living conditions | Reference safe accommodation, food and welfare obligations. | Vessel/CBA/flag references. |
| 13. Replacement and early termination | Define replacement and early disembarkation handling. | Reasons, notice, replacement fee/support rule. |
| 14. Complaints and dispute route | Define complaint route and platform reporting. | Platform complaint route, employer contact, applicable forum. |
| 15. Data and platform evidence | Permit platform workflow evidence, without making CrewPortGlobal employer by default. | Platform record IDs, audit events, allowed document sharing. |
| 16. Signatures and copies | Define parties, signature dates, copies and language. | Signature method, place, date, witness/facilitator if applicable. |

## 5. Variable Field Catalogs

### 5.1 Contract type

| Code | Label |
|---|---|
| `fixed_term` | Fixed-term contract |
| `single_voyage` | Single-voyage contract |
| `rotation` | Rotation contract |
| `probationary` | Probationary period contract |
| `to_be_agreed` | To be agreed before signing |

### 5.2 Wage payment frequency

| Code | Label |
|---|---|
| `monthly` | Monthly |
| `twice_monthly` | Twice monthly |
| `end_of_contract` | At end of contract |
| `advance_and_monthly` | Advance plus monthly payments |
| `custom_cba_rule` | According to applicable CBA |
| `to_be_agreed` | To be agreed before signing |

Recommended default: `monthly`, unless the applicable CBA or flag-state rule requires another structure.

### 5.3 Wage payment method

| Code | Label |
|---|---|
| `bank_account` | To seafarer's bank account |
| `payment_card` | To seafarer's payment card |
| `cash_agent` | Cash through authorized agent |
| `cash_onboard` | Cash onboard where lawful and documented |
| `split_payment` | Split payment / allotment |
| `custom_cba_rule` | According to applicable CBA |
| `to_be_agreed` | To be agreed before signing |

### 5.4 Currency

Initial catalog:

```text
USD
EUR
GBP
AED
PHP
INR
OTHER
to_be_agreed
```

`OTHER` must require a currency code and review.

### 5.5 Joining travel responsibility

| Code | Label |
|---|---|
| `shipowner_arranges_pays` | Shipowner arranges and pays |
| `shipowner_reimburses` | Seafarer arranges, shipowner reimburses |
| `seafarer_arranges_self` | Seafarer arranges independently |
| `crewportglobal_b2b_support` | CrewPortGlobal supports as approved B2B service |
| `shared_arrangement` | Shared arrangement |
| `to_be_agreed` | To be agreed before signing |

### 5.6 Joining start point

| Code | Label |
|---|---|
| `seafarer_residence` | From seafarer's residence |
| `nearest_international_airport` | From nearest international airport |
| `specified_city` | From specified city |
| `joining_port_only` | From joining port only |
| `to_be_agreed` | To be agreed before signing |

### 5.7 Repatriation / return responsibility

| Code | Label |
|---|---|
| `shipowner_arranges_pays` | Shipowner arranges and pays |
| `shipowner_reimburses` | Shipowner reimburses approved costs |
| `seafarer_arranges_self` | Seafarer arranges independently |
| `crewportglobal_b2b_support` | CrewPortGlobal supports as approved B2B service |
| `serious_default_exception_review` | Exception requires serious-default review under law/CBA |
| `to_be_agreed` | To be agreed before signing |

### 5.8 Return destination

| Code | Label |
|---|---|
| `place_of_residence` | Seafarer's place of residence |
| `place_of_signing` | Place where agreement was signed |
| `home_country_airport` | Airport in home country |
| `specified_city` | Specified city |
| `cba_defined_place` | Place defined by CBA |
| `mutually_agreed_place` | Mutually agreed place |
| `to_be_agreed` | To be agreed before signing |

### 5.9 Early termination reason

| Code | Label |
|---|---|
| `contract_completed` | Contract completed |
| `medical` | Medical reason |
| `family_emergency` | Family emergency |
| `vessel_operational` | Vessel operational reason |
| `employer_request` | Employer request |
| `seafarer_request` | Seafarer request |
| `disciplinary` | Disciplinary / serious default review |
| `force_majeure` | Force majeure |
| `visa_or_document_blocker` | Visa or document blocker |
| `other_review_required` | Other - review required |

### 5.10 Replacement handling

| Code | Label |
|---|---|
| `included_in_package` | Included in service package |
| `billable_replacement` | Billable replacement support |
| `discounted_replacement` | Discounted replacement support |
| `not_in_scope` | Not in CrewPortGlobal scope |
| `to_be_agreed` | To be agreed before signing |

### 5.11 Contract status

| Code | Label |
|---|---|
| `draft_from_platform_data` | Draft generated from platform data |
| `party_review` | Under party review |
| `terms_to_be_agreed` | Terms still to be agreed |
| `ready_for_signature` | Ready for signature |
| `signed_pending_embarkation` | Signed, pending embarkation |
| `active_onboard` | Active onboard |
| `completed` | Completed |
| `terminated_early` | Terminated early |
| `cancelled` | Cancelled |
| `disputed` | Disputed |

## 6. Draft Contract Text Skeleton

The following skeleton is a drafting baseline. It is not a final legal contract.

### 6.1 Parties

This Seafarer Employment Agreement is made between:

```text
Shipowner / Employer: {{employer_legal_name}}
Authorized representative: {{employer_representative_name}}, authority basis {{authority_evidence_reference}}
Seafarer: {{seafarer_full_name}}, passport / seafarer document {{seafarer_document_reference}}
Platform reference: {{platform_contract_reference}}
```

CrewPortGlobal may act as a digital workflow and evidence platform. Unless expressly stated in a separate signed agreement, CrewPortGlobal is not the seafarer's employer and does not replace the shipowner's employment, wage, travel, repatriation, safety, flag-state or MLC obligations.

### 6.2 Vessel and position

The seafarer is engaged for:

```text
Vessel: {{vessel_name}}
IMO / official number: {{vessel_identifier}}
Flag: {{vessel_flag}}
Vessel type: {{vessel_type}}
Position / rank: {{rank}}
Department: {{department}}
Joining port / place: {{joining_place}}
```

### 6.3 Contract term

The contract type is:

```text
{{contract_type}}
```

Expected start / joining date:

```text
{{joining_date}}
```

Expected duration or end date:

```text
{{contract_duration_or_end_date}}
```

Any extension must be agreed according to applicable law, flag-state requirements and any applicable collective bargaining agreement.

### 6.4 Wages and payment

The wage basis is:

```text
Currency: {{currency}}
Base wage: {{base_wage}}
Overtime / leave / allowance treatment: {{wage_components}}
Payment frequency: {{wage_payment_frequency}}
Payment method: {{wage_payment_method}}
Allotment / split payment: {{allotment_rule}}
Permitted deductions: {{permitted_deductions}}
```

No recruitment, placement or employment-access fee may be charged to the seafarer through CrewPortGlobal or deducted from wages as a condition of employment access.

### 6.5 Working time, rest and leave

Working time, rest periods, overtime, public holidays and paid leave shall follow:

```text
Applicable law / flag-state rule: {{applicable_law_reference}}
CBA, if any: {{cba_reference}}
Onboard working time system: {{working_time_rule}}
Leave treatment: {{leave_rule}}
```

### 6.6 Joining travel

The parties agree the following joining arrangement:

```text
Joining start point: {{joining_start_point}}
Joining travel responsibility: {{joining_travel_responsibility}}
Joining travel payer: {{joining_travel_payer}}
Visa / medical / document preparation responsibility: {{joining_document_responsibility}}
```

### 6.7 Repatriation and return

The parties agree the following return arrangement:

```text
Return destination: {{return_destination}}
Repatriation / return responsibility: {{return_responsibility}}
Return travel payer: {{return_payer}}
Return support notes: {{return_support_notes}}
```

Any exception based on serious default, disciplinary termination or other legally sensitive reason requires review under applicable law, CBA and documented evidence.

### 6.8 Medical care, insurance and welfare

The employer / shipowner shall provide or arrange medical care, illness/injury handling, emergency support and insurance according to:

```text
Applicable law / flag-state rule: {{applicable_law_reference}}
CBA, if any: {{cba_reference}}
Insurance / P&I reference: {{insurance_reference}}
Emergency contact process: {{emergency_contact_process}}
```

### 6.9 Documents and certificates

The seafarer must maintain valid documents and certificates required for the position. The employer / shipowner must identify required documents before joining.

```text
Required documents: {{required_document_list}}
Document review status: {{document_review_status}}
Visa / flag endorsements: {{visa_or_flag_endorsements}}
```

### 6.10 Early termination and replacement

Early termination, early disembarkation or replacement shall be handled according to:

```text
Early termination reasons: {{early_termination_reason_catalog}}
Replacement handling: {{replacement_handling}}
Notice requirement: {{notice_rule}}
Billing / service consequence: {{billing_consequence}}
```

### 6.11 Complaints and dispute route

The seafarer may use onboard, company, flag-state, port-state, union/CBA and CrewPortGlobal complaint channels where applicable.

```text
Employer complaint contact: {{employer_complaint_contact}}
CrewPortGlobal complaint route: {{platform_complaint_route}}
Applicable dispute forum / law: {{dispute_forum_reference}}
```

### 6.12 Platform evidence and audit

The parties acknowledge that CrewPortGlobal may retain workflow evidence related to profile, request, matching, contract generation, boarding, monthly service evidence, disembarkation, return support and billing basis, subject to privacy and contractual controls.

### 6.13 Signatures and copies

The agreement is effective only after required party confirmation or signature.

```text
Seafarer signature / confirmation: {{seafarer_signature}}
Employer representative signature / confirmation: {{employer_signature}}
Date and place of signing: {{signature_date_place}}
Copies issued to: {{copy_distribution}}
```

## 7. Contract Generation Workflow

The future platform workflow should be:

```text
1. Employer submits structured vacancy and preliminary contract terms.
2. Seafarer profile contains matching preferences and return/travel preferences.
3. Matching and shortlist workflow identifies candidate.
4. Employer proceeds with candidate.
5. Authorized employee opens the Contract Agreement Workspace.
6. The workspace shows the approved agreement text and imports verified data into embedded condition fields.
7. Authorized employee selects catalog values and resolves open terms with parties inside the clauses they affect.
8. Parties review and approve/sign the populated contract workspace.
9. After required party approval/signature, the generation script creates the contract from the approved template, verified seafarer data, verified shipowner/employer data, verified vessel data and the approved workspace values.
10. The generated contract receives version metadata and document hash.
11. Parties review generated output and confirm / sign where required by the workflow.
12. Signed contract creates employment_pending_embarkation status.
13. Boarding confirmation creates onboard_active status.
14. Monthly evidence supports billing.
15. Disembarkation and return support close the active voyage.
```

## 7A. Revision Note After CPG-BIZ-095

The earlier detached condition-form concept has been superseded.

The controlling future model is:

```text
Contract Agreement Workspace
+ embedded condition fields inside master-agreement clauses
+ party review in contract context
+ scripted generation after approval
```

This keeps selected terms connected to the legal clauses that explain their effect.

## 8. Blocking Rules Before Signature

The contract must not be marked `ready_for_signature` while these fields are unresolved:

1. parties and authority;
2. vessel and position;
3. wage amount and currency;
4. payment frequency;
5. payment method;
6. contract type and expected duration;
7. joining place;
8. joining travel responsibility;
9. return / repatriation responsibility;
10. return destination rule;
11. applicable law / CBA status;
12. no-fee seafarer acknowledgement;
13. required documents / certificates readiness status.

`to_be_agreed` may remain only if explicitly accepted as a controlled exception by authorized human review.

## 9. Proposed Next Implementation Task

Recommended next task:

```text
CPG-BIZ-096 - Contract workspace object, API and UI design
```

Scope:

1. reuse the clause IDs and field codes already defined in CPG-BIZ-094;
2. render those fields as embedded controls inside the Contract Agreement Workspace;
3. define workspace API payloads;
4. define signature / confirmation states;
5. define guard rules before `ready_for_signature`;
6. define employer and seafarer cabinet tasks;
7. define audit events and billing links.

## 10. Stage Status

This stage is documented.

No code, database, migration, runtime contract generation or legal publication changes were made.
