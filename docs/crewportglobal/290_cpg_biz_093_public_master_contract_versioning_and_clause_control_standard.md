# CPG-BIZ-093 - Public Master Contract Versioning And Clause Control Standard

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Business-process / contract-generation standard
- Source task: Project Owner clarification after CPG-BIZ-092
- Version: 1.0
- Date: 2026-06-03
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

The role of the employee or AI agent is to prepare the instance from approved data, not to author a new legal document.

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
6. let AI generate replacement legal wording.

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
6. party review confirmations are present;
7. no unresolved blocker remains;
8. generated document hash is recorded;
9. no fixed clause has been edited outside the approved version.

## 8. AI Agent Boundary

AI agents may assist by:

1. extracting data from documents;
2. suggesting field mappings;
3. identifying missing variables;
4. comparing selected terms with the approved catalog;
5. detecting inconsistency between request, profile, vessel and contract fields;
6. preparing a review summary.

AI agents must not:

1. invent legal clauses;
2. change fixed wording;
3. approve a new master agreement version;
4. decide a legal conflict;
5. mark the contract ready for signature without human and party confirmation.

## 9. Formal Document Reference Rule

Operational pages should not repeat legal text.

When a page refers to contract terms, the UI should use:

```text
Regulated by: Seafarer / Shipowner Master Agreement, clause {number}.
```

or:

```text
Terms selected under: Master Agreement version {version}.
```

This keeps public pages, forms, translations and AI outputs synchronized with the controlling document.

## 10. Implementation Consequences

The future implementation should create:

1. master agreement version storage;
2. clause library / template storage;
3. variable catalog versioning;
4. contract draft object;
5. selected-term storage;
6. generated document hash;
7. party-review events;
8. signature guard;
9. controlled exception workflow;
10. audit events for template and instance changes.

## 11. Sources Used For Orientation

Official orientation sources:

1. ILO Maritime Labour Convention, 2006 page - `https://www.ilo.org/international-labour-standards/maritime-labour-convention-2006`
2. UK MCA MGN 477 (M), Amendment 5 - seafarers' employment agreements - `https://www.gov.uk/government/publications/mgn-477-m-amendment-5-mlc-2006-seafarers-employment-agreements/mgn-477-m-amendment-5-mlc-2006-seafarers-employment-agreements`
3. UK MCA MGN 478 (M), Amendment 1 - seafarers' wages - `https://www.gov.uk/government/publications/mgn-478-m-maritime-labour-convention-2006-seafarers-wages/mgn-478-m-amendment-1-maritime-labour-convention-2006-seafarers-wages`
4. UK MCA MGN 479 (M), Amendment 1 - repatriation of seafarers - `https://www.gov.uk/government/publications/mgn-479-m-maritime-labour-convention-2006-repatriation-of-seafarers/mgn-479-m-amendment-1-maritime-labour-convention-2006-repatriation-of-seafarers`

These sources are orientation only. The project standard controls how CrewPortGlobal manages its template versions and generated contract instances.

## 12. Next Stage

The next recommended stage is:

```text
CPG-BIZ-094 - Master contract clause library and catalog seeding design
```

That stage should convert the CPG-BIZ-091/092 contract sections into versioned clause IDs and approved selectable catalog values.
