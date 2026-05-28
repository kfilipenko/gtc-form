# CPG-BIZ-024 - Проверка supply-side задачи, ссылки и границ видимости данных

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation / verification report
- Source task: continuation after CPG-BIZ-023
- Version: 1.0
- Date: 2026-05-28
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Цель этапа - проверить, что вычисляемая задача по seafarer supply-side процессу открывает не общий список, а конкретный внутренний рабочий объект, и что при выполнении задачи сохраняется утвержденная граница видимости чувствительных данных.

Проверяемый участок бизнес-процесса:

```text
CF-06 Seafarer supply intake
-> CF-07 Document and readiness review
```

Этап подтверждает, что задача:

1. вычисляется из текущего состояния профиля моряка;
2. видна группе `verification_team`;
3. открывается из `/team/` по активной ссылке названия задачи;
4. приводит на конкретный workspace `/verify/` с заданным `queue_type=seafarer_profile` и `queue_item_id`;
5. позволяет выполнить review outcome;
6. не раскрывает restricted family, medical, identity, reference-contact и raw contact values;
7. пишет audit actor context по выполненной операции.

## 2. Проверенный пользовательский сценарий

Проверенный сценарий:

| Шаг | Проверка | Результат |
|---|---|---|
| 1 | Создается синтетический seafarer profile с безопасными рабочими полями и restricted test values | Данные созданы через тестовый API/DB helper |
| 2 | `/team/` загружает computed task для `verification_team` | Task title отображается как активная ссылка |
| 3 | Ссылка задачи открывает `/verify/?queue_type=seafarer_profile&queue_item_id=...#review-workspace` | Открывается конкретный seafarer workspace, не общий список |
| 4 | Workspace показывает безопасную summary-информацию | Видны rank, department, availability, readiness и restricted summary counts |
| 5 | Workspace не показывает restricted details | Скрыты kin/child/identity/reference-contact/medical detail values |
| 6 | General operator пытается открыть restricted medical endpoint | API возвращает `403 restricted_medical_capability_required` |
| 7 | Operator records `needs_correction` | Audit event содержит actor context и responsible group |

## 3. Матрица границ видимости данных

| Группа данных | Видно в рабочем пространстве verifier/operator | Скрыто в рабочем пространстве verifier/operator | Контроль |
|---|---|---|---|
| Summary профиля | Безопасное имя, rank, department, availability | Личные контактные email/phone за пределами утвержденного operator scope | Scoped operator payload |
| Source-card readiness | Статус карточки, readiness state, repeated-row counts | Raw unrestricted workspace JSON | Scoped workspace summary |
| Family / next-of-kin | Только restricted summary/count | Имя, телефон, email next-of-kin и конкретный текст примечания | Маскирование `restricted_family_record` |
| Children records | Только count / restricted summary | Имя ребенка, дата рождения, пол и подробная связь | Маскирование `restricted_family_record` |
| Identity documents | Document kind и expiry/status там, где это нужно | Passport, seafarer ID, visa numbers, issuing authority и raw document ids | Identity number exclusion |
| Previous employer references | Company-level context, если он безопасен | Reference person, phone и email | `reference_contact_details_restricted` |
| Medical readiness | Medical readiness/expiry status, если безопасно | Illness, injury, surgery и sick-off details | `restricted_medical_details_hidden` |
| Restricted medical direct endpoint | General operator не получает доступ | Полные restricted medical data | `403 restricted_medical_capability_required` плюс audit |

## 4. Проверка доступа к restricted medical data

Прямой доступ general operator к restricted medical details был проверен через:

```text
GET /api/v1/operator/seafarer-medical/{draft_id}
```

Ожидаемый и подтвержденный ответ:

```text
403 restricted_medical_capability_required
audit_recorded = true
```

Это подтверждает текущее правило процесса:

1. general verifier/operator may review readiness and restricted summary;
2. general verifier/operator may not read restricted medical details;
3. future dedicated medical-review capability remains a separate controlled workflow.

## 5. Audit и подтверждение assignment evidence

Review operation проверена через audit evidence.

После `needs_correction` последний audit payload `operator_review_decision_recorded` для seafarer draft содержит:

```text
queue_type = seafarer_profile
decision = needs_correction
target_group_code = verification_team
```

Это подтверждает правило BP-012/BP-013:

```text
previous stage result
+ current object state
+ responsible group/permission
+ active historical executor for the same object and group
= visible task for person or group queue
```

## 6. Измененные файлы этого этапа

| Файл | Изменение |
|---|---|
| `tests/crewportglobal-operator-queue.spec.ts` | Расширен regression test для seafarer-profile computed task: проверка точной ссылки workspace, отсутствие restricted fields, отказ restricted medical endpoint и audit actor-context assertion. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | В BP-012 добавлено проверенное правило исполнения supply-side задачи. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | В BP-013 добавлена инструкция для verifier по supply-side задаче. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 213 и revision 1.93. |
| `docs/crewportglobal/213_cpg_biz_024_supply_side_task_execution_data_scope_report.md` | Добавлен этот отчет на русском языке. |

## 7. Проверка

### 7.1 Фокусная проверка supply-side задачи

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator queue page renders submitted drafts from API"
```

Результат:

```text
1 passed
```

Тест подтверждает:

1. `/team/` computed task link opens the exact seafarer workspace.
2. The task title and object description are the working link.
3. The workspace allows the verifier review action.
4. Restricted family, child, identity, reference-contact and medical detail values are absent.
5. Restricted summary markers remain visible where appropriate.
6. Direct restricted medical access is blocked with audit.
7. Review outcome writes actor context for `verification_team`.

### 7.2 Фокусный operator queue suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
```

Результат:

```text
4 passed
```

Suite подтверждает, что demand-side queue behavior, shortlist-related operator behavior и новая проверка seafarer supply-side task остаются совместимыми.

## 8. Оставшиеся контролируемые gaps

1. A dedicated restricted-medical reviewer capability is still not implemented. Current behavior intentionally blocks general operator access.
2. The current task workbench still depends on computed state and audit history, not a separate persisted assignment table.
3. Employer-facing candidate publication remains outside this stage and must continue to pass the presentation guard.
4. A deeper employer/vessel demand-side data-scope verification remains a separate next stage.

## 9. Результат этапа

Этап завершен.

Supply-side computed task path теперь проверен по утвержденному циклу проверки бизнес-процесса:

```text
described process stage
-> checked application behavior
-> corrected focused regression coverage
-> tested
-> documented as verified
```

## 10. Следующий запланированный этап

Рекомендуемый следующий этап:

```text
CPG-BIZ-025 - Employer and vessel demand-side task execution and data-scope verification
```

Цель следующего этапа:

1. verify employer/company/vessel demand-side tasks in the same way;
2. confirm links open exact internal workspaces;
3. confirm the operation is executable or explicitly blocked;
4. confirm employer authority, vessel context and demand fields do not leak unnecessary internal data;
5. update BP-012/BP-013 only after the application behavior is verified.
