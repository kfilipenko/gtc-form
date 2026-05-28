# CPG-BIZ-030 - Отчет о проверке handoff-а correction task владельцу и возврате в review queue

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation and verification report
- Source task: продолжение CPG-BIZ-029 по утвержденной методике BP-012 / BP-013
- Version: 1.0
- Date: 2026-05-28
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Цель CPG-BIZ-030 - проверить, что результат review outcome `needs_correction` не оставляет прежнюю задачу активной в очереди команды, а корректно передает работу владельцу данных и затем возвращает объект на повторную проверку.

Проверяемый процесс:

```text
Review seafarer profile completeness
-> Needs correction
-> Owner correction task in cabinet
-> Owner resubmits corrected source card
-> Owner correction task disappears
-> Verification-team review task appears again
```

Этот этап выполняет правило BP-012/BP-013:

```text
описали этап -> проверили приложение -> исправили несоответствие -> протестировали -> зафиксировали результат -> перешли к следующему этапу
```

## 2. Проверенный бизнес-этап

| Process step | Business meaning | Проверяемая операция |
|---|---|---|
| CF-06 / CF-07 | Seafarer supply intake and readiness review | Reviewer проверяет профиль моряка и source-card readiness. |
| CF-07 correction route | Owner correction handoff | При `needs_correction` задача уходит из active team queue и появляется в личном кабинете владельца. |
| CF-07 resubmission | Return to verification queue | После исправления source card задача владельца исчезает, а review task повторно вычисляется для verification-team. |

## 3. Фактическая проверка приложения

Проверена цепочка на реальном UI/API сценарии:

1. Создан seafarer profile с source-card данными.
2. Verification-team открывает `Review seafarer profile completeness`.
3. Reviewer выбирает `QUAL-003 Certificate of competence` и записывает outcome `needs_correction`.
4. `/api/v1/team/workbench/tasks` больше не возвращает активную задачу `review_seafarer_profile_completeness` для этого профиля.
5. `/cabinet/?draft_id=...` показывает владельцу задачу `Action required: correct seafarer card`.
6. Задача указывает target card `QUAL-003 Certificate of competence` и содержит активную ссылку на `/create-profile/?draft_id=...#profile-section-qualifications`.
7. После сохранения исправленной секции `qualifications` карточка получает `pending_human_review`.
8. Cabinet correction task исчезает.
9. `/api/v1/team/workbench/tasks` снова возвращает `review_seafarer_profile_completeness` для verification-team.

## 4. Найденное несоответствие

Первый тест показал, что после исправления владельцем повторная задача возвращалась в group queue, но не персонализировалась на исторического исполнителя.

Причина:

1. Audit event `operator_review_decision_recorded` для `seafarer_profile` сохранял объектный ключ `seafarer_profile_id`.
2. Расчет historical assignment учитывал `record_id`, `queue_item_id`, `draft_id`, `vacancy_request_id`, `shortlist_draft_id`, `vacancy_application_id` и другие ключи.
3. Ключ `seafarer_profile_id` отсутствовал в списке assignment patterns.

Из-за этого правило "если сотрудник группы ранее выполнил аналогичную задачу по этому объекту, последующая задача назначается ему" не срабатывало для seafarer profile review correction cycle.

## 5. Внесенное исправление

Исправлен расчет assignment patterns:

```text
seafarer_profile_id
```

добавлен в список объектных идентификаторов, которые участвуют в поиске исторического активного исполнителя.

Изменение является узким:

1. Новые таблицы не создавались.
2. Миграции не выполнялись.
3. UI не менялся.
4. Runtime task model остался `data_derived_current_state`.
5. Assignment model остался `historical_active_executor_or_group_queue`.

## 6. Матрица поведения после исправления

| Stage result | Visible task behavior | Responsible party | Verified result |
|---|---|---|---|
| Seafarer profile is submitted | `Review seafarer profile completeness` appears | `verification_team` or historical active executor | Verified. |
| Reviewer records `needs_correction` | Same active team task disappears | No active reviewer task remains | Verified. |
| Correction is unresolved | Cabinet shows correction task to owner | Seafarer profile owner | Verified. |
| Owner opens correction task | Link opens exact profile card section | Seafarer profile owner | Verified. |
| Owner saves corrected source-card data | Card status becomes `pending_human_review` | Seafarer profile owner | Verified. |
| Correction task resolved | Cabinet task disappears | No owner correction task remains | Verified. |
| Re-review required | Team task reappears | Historical active verification-team executor, otherwise group queue | Verified after `seafarer_profile_id` assignment-pattern fix. |

## 7. Files changed

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Added `seafarer_profile_id` to computed assignment object patterns so correction resubmission can return to the historical active executor. |
| `tests/crewportglobal-operator-queue.spec.ts` | Extended the operator queue scenario to verify owner correction task visibility, exact correction link, correction disappearance and re-created verification-team task assignment. |
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Added the verified correction handoff to the business-process execution matrix. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Clarified that `seafarer_profile_id` participates in computed assignment and documented the owner correction handoff rule. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added core control and revision history entry for the verified correction handoff. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 219. |
| `docs/crewportglobal/219_cpg_biz_030_correction_owner_task_visibility_handoff_report.md` | Added this report. |

## 8. Verification

### 8.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Focused process test

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts -g "operator queue page renders submitted drafts from API"
```

Result: 1 passed.

The focused test confirms:

1. Team task opens the exact seafarer review workspace.
2. Restricted seafarer values remain hidden from reviewer workspace.
3. `needs_correction` removes the same active team task.
4. Owner cabinet receives a correction task for `QUAL-003 Certificate of competence`.
5. Owner correction task links to the exact profile section.
6. Owner correction clears the cabinet task.
7. Review task reappears for `verification_team`.
8. Reappeared task is assigned by historical active executor logic using `seafarer_profile_id`.

### 8.3 Focused UI regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-cabinet-dashboard.spec.ts
```

Result: 9 passed.

The focused UI regression confirms:

1. Cabinet correction tasks remain visible to the owner while correction is unresolved.
2. Cabinet correction tasks disappear after owner correction.
3. Operator queue review flows still work after assignment recomputation changes.
4. Vacancy application and candidate-search operator flows remain stable.

### 8.4 API regression

```bash
npm run test:cpg-api
```

Result: 18 passed.

The API regression confirms that registration, review, document, vacancy, candidate-search, deletion-request and operator-decision endpoints remain stable after the computed-assignment update.

## 9. Controlled gaps

1. The same correction-handoff verification still needs to be repeated for employer/company correction and vacancy-request correction flows.
2. The current test helper uses a Playwright-created team session for the verification actor; production user assignment depends on real active team-member sessions and audit events.
3. A future manager reassignment workflow is still not implemented; current assignment remains computed from audit history.

## 10. Next planned stage

Следующий этап:

```text
CPG-BIZ-031 - Employer and demand-side correction handoff verification
```

План следующего этапа:

1. Описать correction handoff для employer/company/vessel/vacancy demand-side объектов.
2. Проверить, что `needs_correction` по demand-side объекту убирает прежнюю active team task.
3. Проверить, что correction task появляется у правильного owner/employer-side пользователя или группы.
4. Проверить, что после исправления задача исчезает у владельца и возвращается на повторную проверку правильной группе или историческому исполнителю.
5. Исправить только минимальные несоответствия, если они будут выявлены.
