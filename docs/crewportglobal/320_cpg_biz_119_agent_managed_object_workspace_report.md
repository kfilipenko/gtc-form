# CPG-BIZ-119 - Agent-Managed Object Workspace Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-118
- Version: 1.0
- Date: 2026-06-08
- Status: Implemented and verified on GTC1

## 1. Назначение

Этот этап закрепляет рабочую карточку объекта, которым управляет агент.

Цель: чтобы агент видел не только строку assignment, а конкретный безопасный рабочий объект:

1. кто управляет объектом;
2. на каком основании агент имеет право работать с объектом;
3. какой статус assignment и authority;
4. какие безопасные поля объекта доступны в карточке;
5. какая следующая рабочая ссылка открывает форму/пространство редактирования;
6. почему работа заблокирована, если полномочие или assignment не проходят guard.

Этап не создает новую миграцию, не меняет статус моряка, работодателя, судна, вакансии, договора, заявки или employment-события.

## 2. Реализованный API

Добавлен защищенный endpoint:

```text
GET /api/v1/agents/objects/{agent_object_assignment_id}/workspace
```

Endpoint доступен только активному пользователю agent organization.

Endpoint возвращает:

| Поле | Назначение |
|---|---|
| `workspace_model` | Модель ответа: `agent_scoped_object_workspace`. |
| `assignment` | Assignment, object type, object id, source, visibility scope, responsibility. |
| `participant_card` | Безопасная карточка участника/объекта. |
| `participant_card.managed_by` | Текущий `Managed by` / `Управляется` actor. |
| `participant_card.authority` | Тип, статус и срок действия полномочия агента. |
| `participant_card.safe_fields` | Безопасные поля объекта для рабочего просмотра. |
| `object_snapshot` | Минимальный source snapshot из текущих таблиц. |
| `workspace_guard` | `can_edit`, `guard_status`, blocker и обязательные условия. |
| `actions` | Следующие рабочие ссылки, включенные только при пройденном guard. |

## 3. Guard

Рабочий объект открывается только если assignment принадлежит текущей agent organization.

Обычное выполнение доступно только когда:

1. agent organization имеет статус `verified` или `limited`;
2. authority organization имеет статус `verified` или `limited`;
3. assignment имеет статус `active` или `limited`;
4. authority document имеет статус `verified` или `limited`;
5. authority document не просрочен.

Assignment со статусами:

```text
reassigned
revoked
archived
```

не открывается как рабочий объект агента.

## 4. Безопасные карточки объектов

Поддержаны object types:

| Object type | Safe fields |
|---|---|
| `person_user` | Name, Email, Roles, Registration status, Active account. |
| `seafarer_profile` | Name, Email, Rank, Department, Availability, Country, Review status. |
| `employer_company` | Company, Registration number, Country, Company type, Verification status, Primary contact. |
| `vessel` | Vessel, IMO, Vessel type, Flag, Company. |
| `vacancy_request` | Vacancy, Rank, Department, Vessel type, Join date, Contract duration, salary range, Company, Vessel, Publication status. |

Эти карточки не заменяют сами формы. Они дают агенту контекст перед переходом в scoped edit workspace.

## 5. UI

Обновлена страница:

```text
/agents/
```

Изменения:

1. назначенный объект в списке теперь открывается ссылкой;
2. ссылка ведет на:

```text
/agents/?assignment_id={agent_object_assignment_id}#agent-workspace
```

3. computed task `manage_represented_object` теперь ведет не к общей строке списка, а к конкретному scoped workspace;
4. добавлен блок `Scoped object workspace`;
5. блок показывает:
   - object type;
   - object ID;
   - assignment status;
   - authority type/status/validity;
   - `Managed by`;
   - safe fields;
   - доступные рабочие действия.

Если guard заблокирован, рабочие действия остаются disabled и показывается blocker.

## 6. Рабочие ссылки

Для object types формируются следующие действия:

| Object type | Action |
|---|---|
| `person_user` | Open account workspace. |
| `seafarer_profile` | Open `/create-profile/` with `actor=agent` and `assignment_id`. |
| `employer_company` / `vessel` / `vacancy_request` | Open `/post-vacancy/` with `actor=agent` and `assignment_id`. |
| `contract_workspace` | Open `/contracts/workspace/` with `actor=agent` and `assignment_id`. |

Важно: переход по ссылке не отменяет backend guard конкретной формы. Этот этап только передает assignment context и показывает правильную рабочую точку входа.

## 7. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added agent scoped object workspace endpoint, safe object snapshots, workspace guard and assignment-specific route. |
| `projects/crewportglobal/public/agents/index.html` | Added scoped workspace block, participant-card rendering, safe fields and assignment-specific object links. |
| `tests/crewportglobal-registration-api.spec.ts` | Extended agent API regression to verify scoped workspace, managed-by participant card, safe fields, enabled action and old reassigned assignment invisibility. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 320. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added process control for scoped agent object workspace. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | Marked CPG-BIZ-119 as implemented in the agent onboarding/object-scope stage. |
| `docs/crewportglobal/320_cpg_biz_119_agent_managed_object_workspace_report.md` | Added this report. |

## 8. Verification

### 8.1 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Embedded Frontend Syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/agents/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 1 inline script.

### 8.3 Focused API Regression

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "agent API exposes verified authority management context"
```

Result: passed.

The focused test confirms:

1. a reassigned object is visible only to the new verified agent;
2. the new agent opens `/agents/objects/{assignment_id}/workspace`;
3. workspace model is `agent_scoped_object_workspace`;
4. `workspace_guard.can_edit = true`;
5. participant card shows the new `Managed by` agent;
6. safe fields include the represented account email;
7. `open_agent_account_workspace` is enabled;
8. old reassigned assignment returns 404 for the previous agent.

### 8.4 Full API Regression

```bash
npm run test:cpg-api
```

Result: passed, 23 tests.

## 9. Remaining Controlled Gaps

1. `/create-profile/` and `/post-vacancy/` still need stronger runtime enforcement of `actor=agent&assignment_id=...` inside their own save/update endpoints.
2. Owner/previous-agent notification channel remains future work.
3. Object-specific edit forms are linked from the workspace but not yet reduced to agent-only scoped field subsets.
4. No new DDL/migration was required for this slice.

## 10. Next Stage

Recommended next stage:

```text
CPG-BIZ-120 - Agent assignment context enforcement in profile and demand forms
```

Goal: when `/create-profile/` or `/post-vacancy/` is opened with `actor=agent&assignment_id=...`, the form save/update API must verify that the assignment belongs to the current agent, is active/limited, has verified authority and matches the object being edited.
