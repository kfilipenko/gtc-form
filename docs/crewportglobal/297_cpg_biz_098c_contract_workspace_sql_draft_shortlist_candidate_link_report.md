# CPG-BIZ-098C - Contract Workspace SQL Draft Shortlist Candidate Link Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: SQL draft correction report
- Source task: CPG-BIZ-098B approval by Project Owner
- Version: 1.0
- Date: 2026-06-04
- Status: SQL draft corrected; runtime migration not approved or executed

## 1. Purpose

This report records the correction of the documentation-only Contract Agreement Workspace SQL draft after CPG-BIZ-098B source-field reconciliation.

The correction ensures that a future contract proposal can be tied to:

```text
one vacancy / crew request
+ one exact selected candidate row
+ one seafarer profile
+ one employer / shipowner
+ one vessel
```

No DDL, DML, seed data, runtime migration, API code or UI code was executed in this stage.

## 2. Reason For Correction

The previous SQL draft linked a contract workspace to:

```text
shortlist_draft_id
vacancy_application_id
seafarer_profile_id
```

This was not precise enough for the future computed operation:

```text
Предложить контракт
```

The operation is not a generic shipowner action. It must be available only for a concrete candidate selected for a concrete request.

For that reason, the contract workspace needs a direct optional link to:

```text
operator_shortlist_candidates.shortlist_candidate_id
```

## 3. SQL Draft Change

Changed file:

```text
docs/crewportglobal/sql_drafts/018_contract_workspace_schema_draft.sql
```

Added to `contract_workspace_instances`:

```sql
shortlist_candidate_id UUID REFERENCES crewportglobal.operator_shortlist_candidates(shortlist_candidate_id) ON DELETE SET NULL
```

Added index:

```sql
CREATE INDEX IF NOT EXISTS contract_workspace_instances_shortlist_candidate_idx
  ON crewportglobal.contract_workspace_instances (shortlist_candidate_id, created_at DESC);
```

Added source traceability value:

```text
source_object_type = shortlist_candidate
```

This allows `contract_embedded_field_values` to record that a populated contract value came from the exact candidate shortlist row.

## 4. Confirmed Source Priority

The future contract creation flow should use source data in this order:

| Priority | Source | Purpose |
|---:|---|---|
| 1 | `operator_shortlist_candidates.shortlist_candidate_id` | Exact candidate row that triggered contract proposal. |
| 2 | `operator_shortlist_drafts.shortlist_draft_id` | Approved internal shortlist context. |
| 3 | `seafarer_profiles.seafarer_profile_id` | Candidate profile source. |
| 4 | `vacancy_requests.vacancy_request_id` | Crew request / demand source. |
| 5 | `employer_companies.company_id` | Shipowner / employer legal party source. |
| 6 | `vessels.vessel_id` | Vessel and flag source. |
| 7 | `vacancy_applications.vacancy_application_id` | Optional application / presentation evidence if such row exists. |

`vacancy_application_id` is no longer treated as the primary candidate-selection source because a candidate can be selected through internal matching and shortlist workflow without a direct candidate-submitted application.

## 5. Current Approval Position

The documentation-only SQL draft is now corrected for the candidate-selection source link.

However, the corrected draft is still not a runtime migration.

Current status:

```text
SQL draft corrected.
Runtime migration not approved.
DDL/DML not executed.
```

## 6. Impact On Future UI Discussion

The future shipowner-side button:

```text
Предложить контракт
```

should use the corrected source model.

Recommended future route:

```text
Shipowner cabinet
-> Vacancy / crew request
-> Candidate list
-> Candidate card
-> Предложить контракт
-> Contract Agreement Workspace
```

The button should pass:

```text
vacancy_request_id
shortlist_candidate_id
seafarer_profile_id
employer_company_id
vessel_id
```

The button must remain hidden or disabled if source records are incomplete, unverified or blocked.

## 7. Verification

Performed static checks:

```bash
git diff --check
```

Result: passed.

The SQL draft was not executed against PostgreSQL.

## 8. Next Recommended Stage

Recommended next gate:

```text
CPG-BIZ-098D - Corrected SQL draft approval decision for runtime migration packaging
```

At that gate the Project Owner can decide whether to:

1. approve conversion of the corrected SQL draft into a real runtime migration with tests; or
2. return the SQL draft for another revision.

After schema approval, the next functional design stage should be:

```text
CPG-BIZ-099 - Shipowner candidate review menu and Propose Contract computed operation design
```

