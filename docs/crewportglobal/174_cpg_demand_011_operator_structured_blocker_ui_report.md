# CPG-DEMAND-011 - Operator Structured Blocker UI Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Follow-up implementation slice after CPG-DEMAND-010
- Version: 1.0
- Date: 2026-05-23
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the operator UI slice that makes structured demand requirement evaluation visible in the `/verify/` candidate-search panel.

The purpose is to let an operator see why a candidate is ready or blocked against structured COC, endorsement, training and sea-service requirements before any shortlist draft object is designed.

This slice does not create shortlists, publish candidates, present candidates to employers, change vacancy application status, add database schema or change backend matching behavior.

## 2. Scope Implemented

The `/verify/` vacancy-detail candidate-search card now renders a structured requirement summary from:

```text
candidate.dimension_results.coc_requirements
candidate.dimension_results.endorsement_requirements
candidate.dimension_results.training_requirements
candidate.dimension_results.sea_service_requirements
```

Each required dimension is shown as:

```text
Structured requirements: COC requirements: matched 1/1 | Training requirements: blocked 0/1 (missing: Basic Safety Training)
```

The UI uses only the safe `dimension_results` summary returned by the read-only candidate-search endpoint. It does not expose raw certificate numbers, document IDs, contacts, raw workspace JSON or employer-facing payloads.

## 3. UI Behavior Matrix

| Candidate state | UI behavior |
|---|---|
| Structured requirement matched | Shows `{dimension}: matched {matched_count}/{required_count}`. |
| Structured requirement missing | Shows `{dimension}: blocked {matched_count}/{required_count}` and a safe missing requirement label when available. |
| Dimension not required | Does not render that structured dimension. |
| General blockers exist | Existing blocker line still shows blocker codes/messages such as `coc_requirement_missing`. |
| Documents summary exists | Existing document summary line remains unchanged. |

## 4. Data Boundary

The UI remains operator-internal and read-only.

No-side-effect boundary remains:

```text
no vacancy applications created
no candidate status changes
no vacancy status changes
no employer visibility
no shortlist draft object
```

The UI continues to assert that candidate search does not display:

```text
seafarer email
contact_email
contact_phone
document_metadata
```

## 5. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/verify/index.html` | Added structured requirement summary rendering, labels and styling for candidate-search cards. |
| `tests/crewportglobal-operator-queue.spec.ts` | Extended the candidate-search UI test with structured demand requirements, synthetic structured candidate evidence and visible matched/blocked assertions. |
| `docs/crewportglobal/174_cpg_demand_011_operator_structured_blocker_ui_report.md` | This implementation report. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 174 to the register. |

## 6. Verification

The implementation was verified on GTC1.

### 6.1 Focused UI Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search without sensitive candidate contacts"
```

Result: 1 passed.

The focused test confirms:

1. The vacancy contains structured COC, training and sea-service demand requirements.
2. The exact candidate has synthetic matching structured evidence.
3. The UI shows matched structured requirement summaries for the exact candidate.
4. The UI shows blocked structured requirement summaries and blocker codes for the mismatch candidate.
5. Sensitive contact and raw metadata fields remain hidden.

### 6.2 Focused Operator Queue Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

## 7. Next Recommended Step

The next implementation slice can design an internal shortlist draft object.

Recommended constraints for that slice:

1. Use only candidates returned by the structured evaluator.
2. Store shortlist draft rows as operator-internal and not employer-facing by default.
3. Keep approval guard checks mandatory before any presentation transition.
4. Keep visa, language and general requirements in manual-review mode until catalog cleanup and Project Owner rules are approved.
