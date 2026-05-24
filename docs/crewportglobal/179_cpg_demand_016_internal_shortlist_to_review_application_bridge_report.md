# CPG-DEMAND-016 - Bridge from Internal Shortlist to Vacancy Application Review Queue

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-DEMAND-015
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель

Этот отчет фиксирует первый контролируемый bridge между утвержденным внутренним shortlist draft и существующей очередью review-заявок `vacancy_applications`.

Цель этапа - позволить оператору после `approved_internal` создать или переиспользовать внутренние vacancy application records для дальнейшего human review, не создавая employer-facing presentation.

Этап не публикует кандидатов, не переводит заявки в `presented`, не открывает employer visibility, не создает matching score и не принимает employment decision.

## 2. Почему выбран именно bridge, а не прямое employer presentation

В коде уже существует принятый путь employer-facing presentation:

```text
vacancy_applications.application_status = presented
```

Этот переход выполняется через operator review queue и защищен guard:

```text
cpg_vacancy_application_approval_guard()
```

Поэтому CPG-DEMAND-016 не создает параллельный механизм публикации кандидатов работодателю. Новый bridge только заводит включенных кандидатов из approved internal shortlist в уже существующую review queue как:

```text
submitted_for_human_review
```

Дальнейший переход в `presented` остается отдельным human-review шагом и продолжает проходить через existing approval guard.

## 3. Backend/API Surface

Добавлен protected operator endpoint:

```text
POST /api/v1/operator/shortlist-drafts/{shortlist_draft_id}/review-applications
```

Endpoint доступен только через temporary operator access boundary, как и другие `/operator/` routes текущего этапа.

Request body допускает только внутреннюю заметку:

```json
{
  "operator_note": "optional internal note"
}
```

Заметка не переносится в employer-facing `candidate_note`, чтобы не допустить случайной публикации внутреннего текста работодателю при будущем переходе в `presented`.

## 4. Guard Matrix

Bridge разрешен только если все условия выполнены:

| Condition | Required value | Blocker code when failed |
|---|---|---|
| Shortlist draft status | `approved_internal` | `shortlist_draft_not_approved_internal` |
| Draft employer visibility | `false` | `shortlist_draft_employer_visible` |
| Draft archived state | not archived | `shortlist_draft_archived` |
| Draft rejected state | not rejected | `shortlist_draft_rejected` |
| Included candidates | at least 1 | `no_included_candidates` |
| Current internal approval guard | `ready_for_internal_approval` | `internal_approval_guard_not_ready` |
| Candidate row employer visibility | `false` | `shortlist_candidate_employer_visible` |
| Candidate stored guard | `ready_for_internal_shortlist` | `included_candidate_guard_blocked` |
| Candidate minimized snapshot | no forbidden employer keys | `included_candidate_forbidden_field_risk` |
| Existing vacancy application | not `presented` | `candidate_already_presented_to_employer` |

Blocked bridge response:

```text
409 shortlist_review_application_guard_blocked
```

Blocked response side effects:

```json
{
  "creates_vacancy_applications": false,
  "changes_application_statuses": false,
  "moves_applications_to_presented": false,
  "presented_to_employer": false,
  "employer_visible": false
}
```

## 5. Status Transition Boundary

The bridge can create or reuse records only in the internal application-review lane:

| Previous state | Bridge behavior | Result state | Employer visible |
|---|---|---|---:|
| no existing application | creates application | `submitted_for_human_review` | false |
| `submitted_for_human_review` | reuses application | unchanged | false |
| `in_review` | reuses application | unchanged | false |
| `withdrawn` | resets to review | `submitted_for_human_review` | false |
| `rejected` | resets to review | `submitted_for_human_review` | false |
| `presented` | blocked | unchanged | already existing external state, not created by bridge |

The bridge never writes:

```text
application_status = presented
```

## 6. Employer-Facing Payload Boundary

The endpoint response does not return:

```text
contact_email
contact_phone
seafarer_email
document_metadata
seafarer_workspace
restricted medical data
family / next-of-kin data
identity document numbers
```

Created application rows still require `contact_email` internally because the existing `vacancy_applications` table has a `NOT NULL` constraint from the public application flow. The value is read server-side from `crewportglobal.users.email` and is not returned by the new endpoint.

## 7. UI Surface

Changed UI page:

```text
/verify/
```

After an internal shortlist draft is approved, the candidate-search panel now enables:

```text
Create review applications
```

The UI calls:

```text
POST /api/v1/operator/shortlist-drafts/{shortlist_draft_id}/review-applications
```

The UI displays:

```text
Review applications created: N. Status: submitted_for_human_review. Employer visible: false.
```

The UI still does not call employer presentation endpoints.

## 8. Audit Trail

Successful bridge execution writes:

```text
operator_shortlist_review_applications_created
```

Audit source:

```text
operator_shortlist_review_application_bridge
```

Audit payload records:

1. `shortlist_draft_id`.
2. `vacancy_request_id`.
3. `review_application_guard`.
4. created/reused/reset application summary.
5. explicit `moves_applications_to_presented=false`.
6. explicit `presented_to_employer=false`.
7. explicit `employer_visible=false`.

The audit payload does not include candidate email or broad document metadata.

## 9. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added review-application bridge guard, protected POST endpoint, internal vacancy application upsert, audit event and no-presented/no-employer-visible side effects. |
| `projects/crewportglobal/public/verify/index.html` | Added `Create review applications` action after internal shortlist approval, guarded 409 rendering and result summary. |
| `tests/crewportglobal-registration-api.spec.ts` | Extended API workflow to stage review applications from approved internal shortlist and confirm employer presented candidates remain empty. |
| `tests/crewportglobal-operator-queue.spec.ts` | Extended operator UI workflow to create review applications and confirm internal status plus no sensitive contact exposure. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 179 to the documentation register. |
| `docs/crewportglobal/179_cpg_demand_016_internal_shortlist_to_review_application_bridge_report.md` | Added this report. |

## 10. Verification

### 10.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 10.2 Embedded Frontend Syntax

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

### 10.3 Focused API Check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "operator candidate search returns read-only exact matches and blockers"
```

Result: 1 passed.

The focused API check confirms:

1. Internal shortlist approval remains guarded.
2. Approved internal shortlist can create a review application.
3. Created review application status is `submitted_for_human_review`.
4. Hold-only / not-approved shortlist cannot create review applications.
5. The bridge does not move any application to `presented`.
6. Employer presented-candidate payload remains empty.
7. Endpoint responses do not expose `contact_email`, `contact_phone` or `document_metadata`.

### 10.4 Focused UI Check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator vacancy detail runs read-only candidate search"
```

Result: 1 passed.

The focused UI check confirms:

1. Operator can run candidate search.
2. Operator can create internal shortlist draft.
3. Operator can approve internal shortlist.
4. Operator can create review applications from the approved internal shortlist.
5. UI displays `submitted_for_human_review`.
6. UI keeps `Employer visible: false`.
7. Sensitive candidate contacts and broad metadata are not rendered.

### 10.5 Focused Operator UI Suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Result: 3 passed.

### 10.6 API Regression

```bash
npm run test:cpg-api
```

Result: 16 passed.

## 11. Remaining Controlled Gaps

1. The bridge creates internal review applications only; employer-facing presentation is still a later step.
2. The existing vacancy application review queue remains the authority for moving `submitted_for_human_review` or `in_review` to `presented`.
3. There is no dedicated shortlist-to-application history page yet.
4. The bridge does not implement scoring; it only carries forward already guarded include decisions.

## 12. Next Planned Step

The next stage should connect the existing vacancy application review queue more explicitly with candidates created by internal shortlist bridge:

1. Show the source shortlist draft ID in the operator vacancy-application detail.
2. Preserve the existing `cpg_vacancy_application_approval_guard()` as the final employer-presentation guard.
3. Add a focused UI/API check proving that a bridge-created review application can be reviewed but cannot become `presented` unless final presentation consent/source-card/employer-payload guard passes.

This CPG-DEMAND-016 stage is complete. The bridge is implemented, documented and verified; the next planned work is the final guarded transition from bridge-created review applications through the existing vacancy-application approval path.
