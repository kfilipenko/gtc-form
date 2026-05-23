# CPG-DEMAND-014 — Operator Internal Shortlist Draft UI Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-013
- Version: 1.0
- Date: 2026-05-23
- Status: Implemented and verified on GTC1

## 1. Purpose

This report records the operator-facing UI slice for internal shortlist drafts.

The purpose of this slice is to let the operator create an internal shortlist draft from the existing `/verify/` candidate-search panel while preserving the CPG-DEMAND-013 approval guard and no-employer-visibility boundary.

This slice does not publish candidates, create vacancy applications, change application statuses, expose candidates to employers, implement scoring, or make employment decisions.

## 2. Implementation Scope

Changed UI surface:

```text
/verify/
```

The vacancy detail candidate-search panel now shows:

1. Internal shortlist decision controls per candidate.
2. Default `include` for candidates without hard candidate-search blockers.
3. Default `hold` for blocked candidates.
4. Disabled `include` option for candidates with hard candidate-search blockers.
5. Optional internal operator note per candidate.
6. `Create internal shortlist draft` action.
7. Created draft status and candidate guard summary.
8. Explicit `Employer visible: false` result text.

## 3. Guard And Visibility Behavior

The UI calls the existing CPG-DEMAND-013 operator-only endpoint:

```text
POST /api/v1/operator/vacancies/{vacancy_request_id}/shortlist-drafts
```

The backend remains the source of truth for approval guard decisions.

UI behavior:

| Candidate condition | Default UI decision | Include selectable? | Backend guard authority |
|---|---|---:|---|
| Candidate has no candidate-search blockers | `include` | Yes | Yes |
| Candidate has candidate-search blockers | `hold` | No | Yes |
| Operator changes candidate to `exclude` | `exclude` | Not applicable | Yes |
| Include request fails consent/source-card guard | Shows `Internal shortlist guard blocked` | Not stored | Yes |

The UI renders the stored internal draft returned by the backend and shows:

```text
draft_status
employer_visible
operator_decision
approval_guard_result.approval_status
approval_guard_result.approval_blockers[].code
```

## 4. No Employer-Facing Boundary

The UI does not call employer presentation endpoints.

The created shortlist draft result still comes from internal-only storage:

```text
operator_shortlist_drafts.employer_visible = false
operator_shortlist_candidates.employer_visible = false
```

The UI test confirms the candidate-search panel and internal draft result do not display:

```text
candidate email
contact_email
contact_phone
document_metadata
```

## 5. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/verify/index.html` | Added internal shortlist draft controls, i18n strings, result rendering and safe 409 guard handling inside the existing candidate-search panel. |
| `tests/crewportglobal-operator-queue.spec.ts` | Extended the operator candidate-search UI regression to create an internal shortlist draft, confirm guard output and confirm no sensitive candidate contact exposure. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 177 to the internal documentation register. |
| `docs/crewportglobal/177_cpg_demand_014_operator_shortlist_draft_ui_report.md` | Added this implementation report. |

## 6. Verification

### 6.1 Embedded Frontend Syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/verify/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 2 inline scripts.

### 6.2 Focused Operator UI Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

The focused test confirms:

1. Candidate search still renders match-ready and blocked candidates.
2. Structured blockers remain visible for blocked candidates.
3. Internal shortlist draft creation succeeds from `/verify/`.
4. Exact candidate is stored as `include` with `ready_for_internal_shortlist`.
5. Blocked candidate is stored as `hold` with guard blockers.
6. Employer visibility remains false.
7. Sensitive contact and broad document metadata are not rendered.

### 6.3 Focused Operator UI Suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

## 7. Remaining Controlled Gaps

1. No list/history view of previous internal shortlist drafts is implemented in this slice.
2. No internal approval transition from draft to employer presentation is implemented.
3. No employer-facing candidate publication is implemented.
4. Operator note editing after draft creation remains a future workflow.

## 8. Next Recommended Step

The next slice can design and implement an internal shortlist approval workflow.

That workflow should remain blocked from employer-facing presentation until:

1. Internal shortlist draft exists.
2. Candidate include decisions pass the approval guard.
3. Required consent events are active.
4. Required source-card corrections are resolved.
5. Employer-facing payload allow/deny checks pass.
