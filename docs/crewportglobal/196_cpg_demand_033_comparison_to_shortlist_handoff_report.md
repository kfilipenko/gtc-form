# CPG-DEMAND-033 — Controlled Comparison-To-Shortlist Handoff Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-032
- Version: 1.0
- Date: 2026-05-25
- Status: Implemented and verified on GTC1

## 1. Цель

Этап добавляет controlled handoff со страницы сравнения:

```text
/team/matching/
```

к созданию internal shortlist draft.

Цель — дать оператору путь от объясненного результата `crew request -> candidate supply` к внутреннему shortlist draft без обхода backend approval guard.

## 2. Реализованное Поведение

На странице `/team/matching/` добавлена секция:

```text
Controlled shortlist handoff
```

После запуска comparison страница формирует управляемый список кандидатов:

| Candidate condition | Default decision | Include selectable |
|---|---|---:|
| Candidate has no candidate-search hard blockers | `include` | Yes |
| Candidate has candidate-search hard blockers | `hold` | No |
| Operator wants to remove candidate from draft | `exclude` | Yes |

Оператор может добавить internal note перед созданием draft.

## 3. Backend Guard Boundary

Frontend не принимает финальное решение о допуске кандидата.

Создание draft выполняется только через существующий protected endpoint:

```text
POST /api/v1/operator/vacancies/{vacancy_request_id}/shortlist-drafts
```

Backend заново проверяет:

1. candidate is present in current candidate-search results;
2. hard candidate-search blockers;
3. structured demand requirement match;
4. required consent events;
5. unresolved source-card correction blockers;
6. forbidden employer payload field risk;
7. no employer visibility.

If backend guard blocks an `include`, no draft is created.

## 4. UI Result

On successful draft creation, `/team/matching/` displays:

1. draft status;
2. `Employer visible: false`;
3. candidate decision;
4. candidate guard status;
5. blocker codes for held/blocked candidates;
6. protected link to the next draft task in `/verify/`.

The next task link uses:

```text
/verify/?queue_type=operator_shortlist_draft&queue_item_id=<shortlist_draft_id>&shortlist_draft_id=<shortlist_draft_id>&task_operation=approve_internal_shortlist
```

## 5. No Employer-Facing Boundary

This slice does not:

1. create vacancy applications;
2. change application statuses;
3. expose candidates to employers;
4. publish candidate data;
5. run automatic scoring;
6. make employment decisions.

The created object remains:

```text
operator_shortlist_drafts.employer_visible = false
operator_shortlist_candidates.employer_visible = false
```

## 6. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/team/matching/index.html` | Added controlled shortlist handoff controls, safe default decisions, POST to existing guarded endpoint, guard-error display and next-task link. |
| `tests/crewportglobal-operator-queue.spec.ts` | Extended the team-session flow to create an internal shortlist draft from `/team/matching/` and continue with the computed approval task. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 196 to the register. |
| `docs/crewportglobal/196_cpg_demand_033_comparison_to_shortlist_handoff_report.md` | Added this report. |

## 7. Verification

### 7.1 Embedded Frontend Syntax

```bash
node inline script syntax check for /team/matching/
```

Result: passed.

### 7.2 Focused Operator Flow

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

Verified:

1. `/team/matching/` runs comparison.
2. Match-ready candidate defaults to `include`.
3. Blocked candidate defaults to `hold` and cannot be included from UI.
4. Internal shortlist draft is created through backend guard.
5. Team task changes from `create_internal_shortlist_draft` to `approve_internal_shortlist`.
6. Candidate contacts and broad document metadata remain hidden.
7. Employer visibility remains false.
8. Existing approval and review-application workflow after handoff still works.

## 8. Следующий Этап

Этап завершен.

Следующий практический этап — добавить shortlist draft history/list view, чтобы операторы и менеджеры могли видеть созданные internal drafts, их статусы, ответственных и следующий доступный computed operation без поиска через отдельную заявку.
