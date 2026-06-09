# CPG-BIZ-124 - Agent Assignment Context Enforcement Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-119; originally queued as form-level assignment-context enforcement
- Version: 1.1
- Date: 2026-06-09
- Status: Implemented and verified on GTC1

## 1. Назначение

Этот этап закрепляет runtime guard для агентского открытия рабочих форм.

После CPG-BIZ-119 агент получал assignment-specific ссылки на:

```text
/create-profile/?draft_id=...&actor=agent&assignment_id=...
/post-vacancy/?draft_id=...&actor=agent&assignment_id=...
```

CPG-BIZ-124 проверяет уже сами API формы: агент не может сохранить, открыть completeness, отправить на review или работать с документами по одному только `draft_id`.

Важно по нумерации: после CPG-BIZ-119 номера CPG-BIZ-120..123 были заняты контрактными шаблонами. Поэтому этот ранее запланированный этап оформлен как CPG-BIZ-124.

## 2. Реализованный Guard

Добавлен общий backend guard для agent form context:

```text
actor=agent
assignment_id={agent_object_assignment_id}
```

Guard требует:

1. активную authenticated agent session;
2. membership в agent organization;
3. assignment, принадлежащий этой agent organization;
4. `assignment_status` active/limited;
5. verified/limited authority organization;
6. verified/limited authority document;
7. непросроченное authority document;
8. соответствие assignment тому draft/object, который редактируется.

Если agent-mode открыт без `assignment_id`, API возвращает:

```text
403 agent_assignment_context_required
```

Если assignment не соответствует редактируемому draft:

```text
403 agent_assignment_draft_mismatch
```

## 3. Покрытые API

Agent assignment context теперь проверяется в:

| Endpoint | Enforcement |
|---|---|
| `POST /api/v1/registration/drafts` | Agent-mode creation through generic form is blocked; object creation must start from approved assignment/object request. |
| `GET /api/v1/registration/drafts/{draft_id}` | Requires matching assignment when `actor=agent`. |
| `PATCH /api/v1/registration/drafts/{draft_id}` | Requires matching assignment before profile/demand update. |
| `GET /api/v1/registration/drafts/{draft_id}/completeness` | Requires matching assignment before completeness read. |
| `POST /api/v1/registration/drafts/{draft_id}/submit-review` | Requires matching assignment before state transition. |
| `GET /api/v1/registration/drafts/{draft_id}/documents` | Requires matching assignment before document list read. |
| `POST /api/v1/registration/drafts/{draft_id}/documents` | Requires matching assignment before protected upload. |
| `GET /api/v1/seafarer/workspace` | In agent-mode, `draft_id` is resolved as represented seafarer, not as the agent account. |
| `PATCH /api/v1/seafarer/workspace/sections/{section}` | Requires matching seafarer assignment before workspace section update. |
| Seafarer consent/readiness helpers | Require matching assignment when called in agent-mode. |

Supported assignment matches:

| Assignment object type | Valid form context |
|---|---|
| `person_user` | Draft owned by that user. |
| `seafarer_profile` | `/create-profile/` draft whose profile source user matches the assignment. |
| `employer_company` | `/post-vacancy/` draft whose primary company user matches the assignment. |
| `vessel` | `/post-vacancy/` draft whose primary company user matches the vessel owner context. |
| `vacancy_request` | `/post-vacancy/` draft whose `created_by_user_id` matches the assignment context. |

## 4. Frontend Changes

Shared draft client:

```text
public/assets/crewportglobal-registration-drafts.js
```

now carries agent context from the current URL into all draft API calls:

```text
actor=agent
assignment_id=...
agent_organization_id=...
```

It also avoids using ordinary browser-local saved `draft_id` in agent-mode when no explicit URL `draft_id` is present.

The form pages now preserve agent context after successful save:

```text
public/create-profile/index.html
public/post-vacancy/index.html
```

so saving no longer rewrites the URL to plain `?draft_id=...` and loses the assignment.

## 5. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added shared agent form context guard, draft/object matching, guarded draft/completeness/submit/seafarer workspace routes. |
| `projects/crewportglobal/app/backend/api/lib/document_uploads.php` | Added assignment-context enforcement for protected document list/upload. |
| `projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js` | Propagates agent context into query/body/multipart requests and preserves URL context. |
| `projects/crewportglobal/public/create-profile/index.html` | Uses shared URL builder to keep `actor=agent&assignment_id`. |
| `projects/crewportglobal/public/post-vacancy/index.html` | Uses shared URL builder to keep `actor=agent&assignment_id`. |
| `tests/crewportglobal-registration-api.spec.ts` | Extended agent API regression for demand-form and seafarer-profile assignment enforcement. |

## 6. Verification

### 6.1 Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
php -l projects/crewportglobal/app/backend/api/lib/document_uploads.php
node -c projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js
```

Result: passed.

### 6.2 Focused API Regression

Focused scenario:

```bash
npx playwright test tests/crewportglobal-registration-api.spec.ts -g "agent API exposes verified authority management context"
```

Result: passed.

The focused test confirms:

1. agent-mode draft update without assignment returns `403 agent_assignment_context_required`;
2. demand draft update with matching assignment returns `agent_context`;
3. seafarer workspace in agent-mode resolves the represented `draft_id`, not the agent account;
4. seafarer workspace with a different seafarer draft returns `403 agent_assignment_draft_mismatch`;
5. claim reassignment still removes only the reassigned account assignment from the previous agent while unrelated seafarer assignments remain visible.

## 7. Remaining Controlled Gaps

1. UI field subsets are not yet reduced per assignment type; the guard controls access to the form context, not field-level edit policy.
2. Owner/previous-agent notification after assignment/reassignment remains future work.
3. Contract workspace agent assignment enforcement remains future work for the contract-specific endpoints.
4. Generic agent-mode creation through public forms is blocked; agent-created new object flow should continue through controlled object creation requests and platform approval.

## 8. Next Stage

Addendum on 2026-06-09:

After Project Owner review, a higher-order governance standard was inserted before the notification implementation. CPG-BIZ-125 is now:

```text
CPG-BIZ-125 - Agent representation conflict and personal contract-signature standard
```

The notification implementation is moved forward to:

```text
CPG-BIZ-126 - Owner, previous-agent and represented-party notification after assignment/reassignment
```

Recommended next stage:

```text
CPG-BIZ-126 - Owner, previous-agent and represented-party notification after assignment/reassignment
```

Goal: when platform control assigns or reassigns a represented object, notify the relevant owner, represented party and previous agent, and expose a safe audit-visible notification/task record without leaking unrelated object data.
