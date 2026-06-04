# CPG-BIZ-100 - Отчет о реализации shipowner candidate contract proposal

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-099
- Version: 1.0
- Date: 2026-06-04
- Status: Implemented and verified on GTC1

## 1. Назначение этапа

Этот этап реализует первый исполнимый переход от решения судовладельца по представленному кандидату к созданию Contract Agreement Workspace.

Цель: после того как кандидат был представлен работодателю и работодатель выбирает решение `Proceed with candidate`, система должна показать вычисленную операцию `Propose contract` и создать или открыть существующее рабочее пространство договора.

Это не является подписанием договора, не публикует кандидата шире, не меняет статус трудоустройства и не создает автоматическое решение о найме.

## 2. Что реализовано

### 2.1 DB migration

Добавлена миграция:

```text
projects/crewportglobal/app/backend/db/migrations/019_contract_proposal_employer_status.sql
```

Миграция расширяет допустимые значения:

```text
vacancy_applications.employer_shortlist_status
```

Новое значение:

```text
proceed_with_candidate
```

Это состояние фиксирует решение работодателя продолжить работу с конкретным кандидатом перед подготовкой договора.

### 2.2 API

Добавлен endpoint:

```text
POST /api/v1/employer/vacancy-applications/{vacancy_application_id}/contract-proposal
```

Endpoint принимает:

```json
{
  "employer_draft_id": "..."
}
```

Endpoint выполняет guard-проверки:

1. работодатель имеет доступ к заявке через свою компанию;
2. candidate application существует и относится к этой компании;
3. кандидат находится в `application_status = presented`;
4. работодатель выбрал `employer_shortlist_status = proceed_with_candidate`;
5. у кандидата есть `seafarer_profile_id`;
6. есть утвержденный master contract template;
7. есть утвержденный contract field catalog;
8. если Contract Agreement Workspace уже существует для этой вакансии и моряка, он переиспользуется;
9. операция фиксируется в audit event.

### 2.3 Presented candidates payload

Employer draft payload теперь дополняет каждого presented candidate данными для contract proposal:

```text
seafarer_profile_id
shortlist_candidate_id
shortlist_draft_id
contract_operation
```

`contract_operation` показывает:

```text
operation_code
visible
enabled
next_action
blockers[]
existing_contract_workspace_id
source_traceability_status
```

Если кандидат был выбран через internal shortlist, `source_traceability_status` становится:

```text
shortlist_candidate_linked
```

Если кандидат пришел через legacy/public vacancy application без shortlist candidate row, статус остается:

```text
degraded_legacy_without_shortlist_candidate
```

Такой degraded режим разрешен только как обратная совместимость тестового/public application flow; дальнейшая нормальная модель должна идти через shortlist candidate link.

### 2.4 UI

На странице:

```text
/post-vacancy/
```

в карточке presented candidate добавлены:

1. кнопка `Proceed with candidate`;
2. computed contract status;
3. кнопка `Propose contract`, если guard разрешает создание workspace;
4. отображение blocker codes, если операция заблокирована;
5. повторный вызов `Propose contract` открывает/переиспользует существующий workspace и не создает дубль.

## 3. Границы безопасности

Этот этап сохраняет утвержденные границы:

1. договор не генерируется;
2. договор не подписывается;
3. candidate employment status не создается;
4. employer-facing candidate data не расширяется контактными/private полями;
5. Contract Agreement Workspace создается только после employer decision to proceed;
6. template/catalog должны быть утверждены до создания workspace;
7. audit event фиксирует создание, повторное использование или blocked guard.

## 4. Связь с бизнес-процессом

Этап относится к цепочке:

```text
Employer-facing presentation
-> Employer feedback / candidate decision
-> Contract Agreement Workspace
```

В матрице BP-016 это закрывает runtime-часть ранее описанного CPG-BIZ-099:

```text
shipowner candidate review menu
-> proceed_with_candidate
-> propose_contract
-> Contract Agreement Workspace
```

## 5. Измененные файлы

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/db/migrations/019_contract_proposal_employer_status.sql` | Добавлена миграция для `proceed_with_candidate`. |
| `playwright.crewportglobal.config.ts` | Подключена миграция 019 к UI test DB setup. |
| `playwright.crewportglobal.api.config.ts` | Подключена миграция 019 к API test DB setup. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлены contract proposal helpers, payload operation, PATCH status alias, POST endpoint, guard и audit events. |
| `projects/crewportglobal/public/post-vacancy/index.html` | Добавлены UI-кнопки `Proceed with candidate` и `Propose contract`, blocker rendering и contract operation status. |
| `tests/crewportglobal-registration-api.spec.ts` | Добавлена API-проверка contract proposal creation/reuse. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Добавлена UI-проверка employer candidate pipeline -> contract proposal. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлена запись документа 300. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Добавлен контроль CPG-BIZ-100. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | Обновлена матрица BP-016 после реализации. |
| `docs/crewportglobal/300_cpg_biz_100_shipowner_candidate_contract_proposal_implementation_report.md` | Добавлен этот отчет. |

## 6. Проверка

### 6.1 DB migration

```bash
PGHOST=127.0.0.1 PGUSER=gtc_user PGPASSWORD=gtc_pass PGDATABASE=gtc_db \
psql -v ON_ERROR_STOP=1 \
-f projects/crewportglobal/app/backend/db/migrations/019_contract_proposal_employer_status.sql
```

Result: passed.

### 6.2 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 6.3 Embedded frontend syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/post-vacancy/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 2 inline scripts.

### 6.4 Diff whitespace

```bash
git diff --check
```

Result: passed.

### 6.5 Focused API check

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "employer vacancy request flows"
```

Result: 1 passed.

Confirmed:

1. employer candidate status can move to `proceed_with_candidate`;
2. contract proposal creates `contract_workspace_instances` with `draft_from_platform_data`;
3. repeated proposal reuses the existing workspace;
4. employer draft payload exposes `existing_contract_workspace_id`.

### 6.6 Focused UI check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts -g "post vacancy workspace"
```

Result: 1 passed.

Confirmed:

1. employer sees the presented candidate;
2. employer marks candidate contacted/interview requested;
3. employer selects `Proceed with candidate`;
4. employer creates contract workspace from `/post-vacancy/`;
5. UI shows `Contract: Open contract workspace`;
6. no horizontal overflow appears.

## 7. Remaining controlled gaps

1. Contract workspace detail page is not implemented yet.
2. Embedded contract field prefill UI is not implemented yet.
3. Party review/signature approval is not implemented yet.
4. Scripted final contract generation is not implemented yet.
5. Normal production flow should prefer shortlist-linked candidates; degraded legacy application flow remains only for compatibility and tests.

## 8. Next stage

Next recommended stage:

```text
CPG-BIZ-101 - Contract Agreement Workspace detail view and embedded field prefill implementation
```

That stage should open the concrete workspace created by `Propose contract`, show verified source facts, show embedded condition fields, and keep party approval/signature and final generation behind separate guards.
