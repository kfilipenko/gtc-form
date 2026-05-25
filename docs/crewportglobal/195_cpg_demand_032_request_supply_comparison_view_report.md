# CPG-DEMAND-032 — Protected Request-Supply Comparison View Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-031
- Version: 1.0
- Date: 2026-05-25
- Status: Implemented and verified on GTC1

## 1. Цель

Этап добавляет внутреннюю страницу сравнения:

```text
crew request -> candidate supply
```

Цель — до создания shortlist показать оператору, почему кандидат подходит или блокируется по конкретной заявке.

Этап не меняет matching algorithm, не создает shortlist, не создает vacancy application, не публикует кандидатов работодателю и не принимает employment decision.

## 2. Реализованная Страница

Добавлена защищенная страница:

```text
/team/matching/
```

Страница использует существующие backend endpoints:

```text
GET /api/v1/operator/registry-detail?type=vacancy_requests
GET /api/v1/operator/vacancies/{vacancy_request_id}/candidate-search
```

Backend `candidate-search` остается источником истины для:

1. matched dimensions;
2. hard blockers;
3. warnings;
4. structured requirement results;
5. no-side-effect boundary.

## 3. Что Видит Оператор

Для выбранной crew request отображается:

1. safe demand summary: request title, rank, department, vessel type, join date, company, vessel, publication status;
2. demand readiness status and blockers;
3. structured child requirements;
4. candidate count summary: shown, match-ready, review-possible, blocked;
5. candidate cards with safe profile fields;
6. matched dimensions;
7. blocker codes;
8. warning codes;
9. dimension-level comparison.

Dimension-level comparison includes:

| Dimension | Output |
|---|---|
| Rank | demand rank -> candidate rank |
| Vessel type | demand vessel type and match source |
| Availability | candidate availability against join date |
| Department | demand department -> candidate department |
| COC | required / matched count |
| Endorsement | required / matched count |
| Training | required / matched count |
| Sea service | required / matched count |
| Passport validity | minimum and remaining validity |
| Medical validity | minimum and remaining validity |

## 4. Access And Navigation

Navigation added:

```text
/team/ -> Request-supply comparison
/team/registry/ -> Compare request-supply button for vacancy_request rows
/team/matching/ -> Open shortlist workspace
```

Direct URL with a selected request:

```text
/team/matching/?vacancy_request_id=<vacancy_request_id>
```

Access remains protected by the same operator/team access model as the candidate-search endpoint.

## 5. Privacy Boundary

The page must not render:

```text
contact_email
seafarer_email
contact_phone
document_metadata
passport_number
medical_details
```

Displayed candidate information is limited to safe operational matching fields already returned by candidate-search:

1. display name;
2. rank;
3. department;
4. availability status/date;
5. review status;
6. matched dimensions;
7. blocker/warning codes;
8. safe document readiness summaries.

## 6. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/team/matching/index.html` | Added protected request-supply comparison page. |
| `projects/crewportglobal/public/team/index.html` | Added Team link to request-supply comparison. |
| `projects/crewportglobal/public/team/registry/index.html` | Added compare link for crew request rows. |
| `tests/crewportglobal-operator-queue.spec.ts` | Extended the existing operator flow to verify the comparison view, matched candidate, blocked candidate, blockers and privacy exclusions. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 195 to the register. |
| `docs/crewportglobal/195_cpg_demand_032_request_supply_comparison_view_report.md` | Added this report. |

## 7. Verification

### 7.1 Embedded Frontend Syntax

```bash
node inline script syntax check for /team/matching/, /team/registry/ and /team/
```

Result: passed.

### 7.2 Focused Operator Flow

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

The focused flow confirms:

1. `/team/matching/` loads through a valid team session.
2. It renders request data and candidate supply comparison.
3. It shows exact matched candidate as `match_ready`.
4. It shows blocked candidate with `rank_mismatch` and `vessel_type_mismatch`.
5. It does not render candidate e-mail, contact fields or broad document metadata.
6. The page remains read-only before shortlist creation.

### 7.3 Protected Registry Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-protected-registry-detail.spec.ts
```

Result: 1 passed.

This confirms the registry detail page remains protected and safe after adding the compare link.

## 8. Следующий Этап

Следующий этап после проверки: добавить controlled handoff from comparison view to internal shortlist draft creation.

That handoff should keep the current guard order:

1. compare request-supply;
2. create internal shortlist draft only from operator action;
3. approve internal shortlist;
4. create review applications;
5. review candidate presentation;
6. only then allow guarded employer-facing presentation.
