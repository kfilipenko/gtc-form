# CPG-BIZ-114 - Agent Workbench Page And Navigation Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-113 and Project Owner instruction
- Version: 1.0
- Date: 2026-06-07
- Status: Implemented; page shell and navigation verified

## 1. Назначение

Этот отчет фиксирует первый интерфейсный слой для самостоятельных агентских организаций.

Цель этапа: создать отдельную страницу и закладки для агентов, чтобы агент мог видеть полный рабочий цикл:

1. подтверждение полномочий агента;
2. создание объектов в интересах клиентов;
3. работу с моряками;
4. работу с судовладельцами, судами и вакансиями;
5. просмотр candidates / matching;
6. переход к contract workspace;
7. обработку duplicate / account / object claims;
8. audit boundary.

## 2. Граница реализации

В этом срезе реализованы:

1. отдельная страница:

```text
/agents/
```

2. новая группа главного меню:

```text
Agents
```

3. ссылки агентского цикла:

```text
Agent Portal
Seafarer
Demand
Candidates
Contracts
```

4. безопасный агентский workbench без выдачи новых runtime-полномочий.

В этом срезе не реализованы:

1. API агента;
2. автоматическое назначение agent organization по сессии;
3. доступ к чужим объектам;
4. подтверждение authority documents;
5. task-computation для агентских задач;
6. reassignment workflow;
7. уведомления по duplicate / account claims;
8. возможность выполнять операции без подтвержденного scope.

## 3. Связь С CPG-BIZ-113

CPG-BIZ-113 уже реализовал runtime migration 020 и создал DB-основу:

```text
agent_organizations
agent_users
agent_authority_documents
agent_object_creation_requests
agent_object_assignments
account_object_claims
agent_scope_audit_events
```

Текущий этап не меняет эти таблицы. Он создает видимый рабочий вход, который в следующем этапе должен быть подключен к этим данным.

## 4. Страница Агента

Страница `/agents/` показывает:

| Блок | Назначение |
|---|---|
| Agent workbench | Объясняет, что агент работает только в пределах verified authority и assignment scope. |
| Controlled scope first | Предупреждает, что страница не выдает доступ сама по себе. |
| Agent operations | Показывает один понятный рабочий цикл агента. |
| Agent cycle | Фиксирует этапы: Authority, Object request, Assignment, Form completion, Matching, Contract, Audit. |
| Control boundary | Подтверждает, что доступ должен вычисляться API на основании migration 020 records. |

Ссылки в операциях ведут к существующим рабочим поверхностям с `actor=agent`, где это применимо:

```text
/create-profile/?actor=agent
/post-vacancy/?actor=agent
/shipowners/candidates/?actor=agent
/contracts/workspace/?actor=agent
```

Эти ссылки подготавливают UX к будущему agent-scope API, но не обходят существующие guard-правила.

## 5. Навигация

В общий навигационный модуль добавлена группа:

```text
Agents
```

Это важно по двум причинам:

1. агент больше не смешивается с внутренней командой;
2. в будущем можно будет отделить `Team` как административно-контрольную группу от внешних / самостоятельных агентских организаций.

## 6. Файлы Изменены

| File | Change |
|---|---|
| `projects/crewportglobal/public/agents/index.html` | Добавлена отдельная страница агента с полным рабочим циклом и безопасным scope-boundary текстом. |
| `projects/crewportglobal/public/assets/crewportglobal-navigation.js` | Добавлена группа `Agents` и ссылки агентского цикла. |
| `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js` | Добавлены chrome-i18n ключи для нового агентского меню, чтобы не показывались технические ключи `nav.agent...`. |
| `tests/crewportglobal-navigation-menus.spec.ts` | Добавлены проверки видимости группы Agents и ссылок агентского меню. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 315. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Добавлен CPG-BIZ-114 в register history. |
| `docs/crewportglobal/business_processes/16_business_process_stage_standard_mapping_matrix.md` | Уточнено состояние agent onboarding/object scope stage после добавления страницы агента. |

## 7. Проверка На Портале

Страница для визуального контроля:

```text
https://crewportglobal.com/agents/
```

Меню должно показывать группу:

```text
Agents
```

Внутри группы должны быть ссылки:

```text
Agent Portal
Seafarer
Demand
Candidates
Contracts
```

## 8. Проверки

### 8.1 Static Diff Check

```bash
git diff --check
```

Result: passed.

### 8.2 Navigation Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts --reporter=list
```

Initial result: failed because the new `nav.agent...` keys were not present in the shared chrome i18n dictionary and were rendered as technical keys.

Fix applied:

```text
projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
```

Final result:

```text
8 passed
```

## 9. Следующий Этап

Следующий логичный этап:

```text
CPG-BIZ-115 - Agent organization API and task-computation scope implementation
```

Он должен подключить страницу `/agents/` к runtime-данным migration 020:

```text
agent organization
+ active agent user
+ verified authority
+ object assignment
+ current object state
= visible agent task / allowed operation
```

Этап CPG-BIZ-114 закончен как UI/navigation shell. Runtime agent permissions пока не расширялись.
