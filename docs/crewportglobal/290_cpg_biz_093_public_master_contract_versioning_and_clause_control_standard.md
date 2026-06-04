# CPG-BIZ-093 - Public Master Contract Versioning And Clause Control Standard

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Business-process / contract-generation standard
- Source task: Project Owner clarification after CPG-BIZ-092
- Version: 1.3
- Date: 2026-06-04
- Status: Drafted for Project Owner review

## 1. Purpose

This standard fixes the contract-generation model for future seafarer / shipowner contract work.

The project does not intend to create a new negotiated legal text for every case.

The intended model is:

```text
approved public master agreement
+ immutable fixed clauses
+ approved variable catalogs
+ verified platform records
+ selected terms
+ party confirmations
= generated contract instance
```

The standard contract should contain fixed legal clauses and defined places where variables are selected. The parties select conditions that the agreement already permits; they do not rewrite the agreement text.

## 2. Master Agreement Rule

The future seafarer / shipowner contract must be managed as a versioned public master agreement.

The master agreement controls:

1. fixed clauses;
2. definitions;
3. permitted variable fields;
4. approved catalog values;
5. clause hierarchy;
6. signature requirements;
7. audit and evidence rules.

Each generated contract instance must store:

| Field | Purpose |
|---|---|
| `master_agreement_version` | Identifies the approved fixed text used. |
| `catalog_version` | Identifies the approved selectable values used. |
| `selected_terms` | Stores selected structured conditions. |
| `source_record_ids` | Links employer, vessel, vacancy, seafarer and document records. |
| `party_confirmation_events` | Records who confirmed which terms and when. |
| `generated_document_hash` | Protects the generated document from unnoticed changes. |
| `signature_status` | Shows whether the instance is draft, party-review, signed or blocked. |

## 2A. Contract Agreement Workspace And Generation Procedure

The portal contract must be prepared through a dedicated Contract Agreement Workspace.

The workspace is not a separate questionnaire detached from the agreement. It is a full contract workspace where approved variable fields are embedded inside the relevant master-agreement clauses.

The required sequence is:

1. An authorized employee opens the Contract Agreement Workspace for the selected seafarer, shipowner/employer, vessel and vacancy/request.
2. The workspace shows the approved master agreement text with embedded fields only where the agreement permits selectable or linked conditions.
3. The employee selects or completes embedded variable fields, including wage, payment method, contract period, joining, return, repatriation, replacement and service-evidence terms.
4. The populated workspace is submitted to the parties for review in contract context.
5. The seafarer and shipowner/employer approve the populated agreement and its embedded field values.
6. Immediately after required party approval/signature, the system runs the contract-generation script.
7. The script creates the contract from:
   - verified seafarer data;
   - verified shipowner/employer data;
   - verified vessel data;
   - the approved master agreement template;
   - the approved populated Contract Agreement Workspace.
8. The generated document receives a platform reference, version metadata and document hash.

This procedure prevents:

1. incorrect legal wording;
2. distortion of agreed commercial or voyage data;
3. use of unapproved terms;
4. manual edits to fixed clauses;
5. loss of evidence showing what the parties approved.

## 3. What Requires Legal Review

Legal review is required for:

1. the first production master agreement;
2. any change to fixed clause wording;
3. new legally material catalog values;
4. new clause sets for flag-state, CBA or mandatory-law requirements;
5. exception handling that is not covered by the approved agreement;
6. dispute-driven clause interpretation;
7. material changes in applicable law, MLC implementation, CBA wording or licensing model.

This review is a version-control event. It approves or rejects a template version or catalog version.

## 4. What Does Not Require New Drafting Each Time

After a master agreement version and its catalogs are approved, ordinary generated contract instances do not require new legal drafting when they use only:

1. approved fixed clauses;
2. approved catalog values;
3. verified platform records;
4. calculated dates, amounts or identifiers within approved rules;
5. party confirmations recorded by the portal;
6. no free-text legal clause changes.

The role of the employee is to prepare embedded field values inside the approved Contract Agreement Workspace, not to author a new legal document.

## 5. Immutable Clause Control

Fixed clauses must be immutable in ordinary workflows.

Allowed:

1. select approved variants;
2. fill structured fields;
3. attach verified records;
4. mark `to_be_agreed` before final agreement;
5. request controlled exception review.

Not allowed:

1. rewrite legal clauses inside the operational UI;
2. insert unapproved free-text legal terms;
3. override mandatory required fields;
4. remove no-fee or complaint controls;
5. sign a contract with unresolved required variables;
6. generate replacement legal wording outside the approved master agreement.

## 6. International Baseline And Mandatory Rules

The project baseline should be aligned with internationally recognized maritime labor standards, including MLC-style controls for seafarers' employment agreements, wages, repatriation, medical care, complaint handling and signed copies.

The platform must not describe this as a simple rule that international law always overrides national law.

The correct operating rule is:

```text
international maritime labor baseline
+ approved master agreement
+ flag-state / CBA / mandatory-law controls
= compliant contract instance
```

If a flag-state law, applicable CBA or mandatory protection requires a condition that is not supported by the approved master agreement, the instance must be blocked or routed to controlled legal/template review.

If a mandatory rule gives the seafarer greater protection than the default template, the template must support that protection through an approved clause version, approved variable value or controlled exception.

## 7. Party Review And Signature Guard

A generated contract instance can move to `ready_for_signature` only when:

1. master agreement version is approved;
2. catalog version is approved;
3. employer, vessel and seafarer records are linked;
4. required variables are completed;
5. `to_be_agreed` fields are resolved or controlled as exceptions;
6. party review confirmations for the populated Contract Agreement Workspace are present;
7. no unresolved blocker remains;
8. generated document hash is recorded;
9. no fixed clause has been edited outside the approved version.

## 8. Formal Document Reference Rule

Operational pages should not repeat legal text.

When a page refers to contract terms, the UI should use:

```text
Regulated by: Seafarer / Shipowner Master Agreement, clause {number}.
```

or:

```text
Terms selected under: Master Agreement version {version}.
```

This keeps public pages, forms, translations and generated documents synchronized with the controlling document.

## 9. Implementation Consequences

The future implementation should create:

1. master agreement version storage;
2. clause library / template storage;
3. variable catalog versioning;
4. contract draft object;
5. selected-term storage;
6. contract workspace object;
7. embedded field value storage;
8. party approval/signature events for the populated contract workspace;
9. generation script that produces the contract from the approved template and approved workspace values;
10. generated document hash;
11. signature guard;
12. controlled exception workflow;
13. audit events for template, embedded field, workspace and instance changes.

## 10. Sources Used For Orientation

Official orientation sources:

1. ILO Maritime Labour Convention, 2006 page - `https://www.ilo.org/international-labour-standards/maritime-labour-convention-2006`
2. UK MCA MGN 477 (M), Amendment 5 - seafarers' employment agreements - `https://www.gov.uk/government/publications/mgn-477-m-amendment-5-mlc-2006-seafarers-employment-agreements/mgn-477-m-amendment-5-mlc-2006-seafarers-employment-agreements`
3. UK MCA MGN 478 (M), Amendment 1 - seafarers' wages - `https://www.gov.uk/government/publications/mgn-478-m-maritime-labour-convention-2006-seafarers-wages/mgn-478-m-amendment-1-maritime-labour-convention-2006-seafarers-wages`
4. UK MCA MGN 479 (M), Amendment 1 - repatriation of seafarers - `https://www.gov.uk/government/publications/mgn-479-m-maritime-labour-convention-2006-repatriation-of-seafarers/mgn-479-m-amendment-1-maritime-labour-convention-2006-repatriation-of-seafarers`

These sources are orientation only. The project standard controls how CrewPortGlobal manages its template versions and generated contract instances.

## 11. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.3 | 2026-06-04 | GTC IT / AI Assistant | Replaced the user-facing separate condition-form model with the Contract Agreement Workspace and embedded condition fields model |
| 1.2 | 2026-06-03 | GTC IT / AI Assistant | Updated next stage after completion of CPG-BIZ-094 clause library and catalog seed |
| 1.1 | 2026-06-03 | GTC IT / AI Assistant | Removed internal automation provisions and added an interim condition-form procedure later superseded by the CPG-BIZ-095 workspace model |
| 1.0 | 2026-06-03 | GTC IT / AI Assistant | Initial public master contract versioning and clause-control standard |

## 12. Next Stage

CPG-BIZ-094 has now defined the first clause library and catalog seed.
CPG-BIZ-095 has clarified that the user-facing contract model is the Contract Agreement Workspace with embedded condition fields.

The next recommended stage is:

```text
CPG-BIZ-096 - Contract workspace object, API and UI design
```

That stage should define the workspace object, API payload, embedded field rendering, validation errors, party approval states, generated document preview and guard response before any runtime implementation.
