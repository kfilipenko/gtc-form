# CPG-BIZ-031 - Отчет о модели информационных потоков и состояний задач

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Documentation and process-control report
- Source task: Project Owner instruction after CPG-BIZ-030
- Version: 1.0
- Date: 2026-05-28
- Status: Documentation updated for Project Owner review

## 1. Цель этапа

Цель CPG-BIZ-031 - закрепить в описании бизнес-процессов унифицированное правило вычисления задач через информационный поток, тип объекта и текущее состояние объекта.

Это нужно, чтобы задачи для команды не выглядели как общий список ручных действий, а вычислялись из понятного бизнес-состояния:

```text
information stream
-> object type
-> current object state
-> business-process stage
-> computed operation
-> responsible group or historical active executor
-> visible task
-> allowed outcome
-> next state
```

## 2. Что добавлено в бизнес-процессы

В BP-012 добавлен новый раздел:

```text
7.1 Information Stream And Object-State Model
7.2 Functional Team Work Split
```

В BP-013 добавлено операционное правило:

```text
2.1 Information Stream Rule
```

Эти разделы показывают, что команда работает не с абстрактной очередью, а с разными управляемыми потоками данных.

## 3. Зафиксированные информационные потоки

| Поток | Основной объект | Итоговое решение | Основные исполнители |
|---|---|---|---|
| Seafarer supply | Seafarer profile, source cards, documents, availability | Моряк готов к matching, требует correction, blocked или unavailable | Group 2, `verification_team`, Group 5, `review_team` |
| Employer / shipowner demand account | Company, representative authority, client/commercial context | Работодатель подтвержден как B2B demand-side client, требует correction, paused или closed | Group 1, Group 5, Group 3, Group 4 |
| Vessel context | Vessel profile, vessel type, flag, operational context | Судно достаточно структурировано для crew request и matching, требует correction или blocked | Group 1, Group 5, `review_team` |
| Crew request / vacancy requirement | Vacancy request, demand workspace, structured requirement rows | Запрос готов к matching/shortlist, blocked, presentation-ready, closed или deletion pending | Group 1, `review_team`, Group 5, owners/Project Owner |

Первые три потока являются базовыми:

1. данные моряка формируют supply side;
2. данные судовладельца / работодателя формируют authorized demand-side client;
3. данные судна формируют vessel context.

Crew request / vacancy связывает эти потоки в matching process.

## 4. Практическое значение для команды

Добавленная модель позволяет разделить работу по функциональному признаку:

| Функция | Что делает команда | Кому передает результат |
|---|---|---|
| Seafarer data completion | Помогает моряку заполнить профиль, source cards, документы и availability | `verification_team` / Group 5 |
| Employer and vessel intake | Структурирует компанию, представителя, судно и запрос на экипаж | Group 5 или `review_team` |
| Verification and internal control | Проверяет evidence, authority, readiness, correction handoff и audit evidence | Владельцу данных для correction или следующему этапу |
| Matching and shortlist review | Сравнивает structured demand с safe candidate summaries и explains blockers | Internal shortlist approval / candidate presentation review |
| Commercial and billing control | Подтверждает B2B service basis, billing handoff и no-fee seafarer boundary | Billing/service completion records |

## 5. Почему это важно для будущего task engine

После этой фиксации задача должна вычисляться не только по operation code, но и по полной модели:

```text
stream + object + state + process stage + permission + assignment history
```

Это позволит:

1. показывать пользователю только одну главную computed operation;
2. назначать задачу правильной группе или историческому активному исполнителю;
3. не смешивать задачи моряков, судовладельцев, судов и crew requests;
4. строить будущих ИИ-агентов вокруг понятного состояния процесса;
5. объяснять инвесторам и аудиторам, какую именно работу выполняет команда;
6. переходить от описания бизнес-процесса к проверяемому приложению.

## 6. Измененные документы

| File | Change |
|---|---|
| `docs/crewportglobal/business_processes/12_crew_formation_service_business_process_manual.md` | Added the stream/object/state model and functional team work split. |
| `docs/crewportglobal/business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Added the operational information-stream rule for users, team and AI agents. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added core control for stream-first task computation and updated revision history. |
| `docs/crewportglobal/00_documentation_register.md` | Registered this report. |
| `docs/crewportglobal/220_cpg_biz_031_information_stream_process_state_model_report.md` | Added this report. |

## 7. Verification

This is documentation-only work.

No code, UI, DB migration, runtime behavior or tests were changed in this stage.

Validation performed:

```bash
git diff --check
```

Result: passed.

## 8. Next planned stage

Следующий этап:

```text
CPG-BIZ-032 - Employer and demand-side correction handoff verification
```

План следующего этапа:

1. Применить новую stream/state модель к employer, vessel и vacancy-request correction flows.
2. Проверить, что `needs_correction` по demand-side объекту убирает прежнюю active team task.
3. Проверить, что correction task появляется у правильного owner/employer-side пользователя или группы.
4. Проверить, что после исправления задача исчезает у владельца и возвращается на повторную проверку правильной группе или историческому исполнителю.
5. Если приложение не соответствует описанному процессу, внести минимальное исправление и подтвердить тестами.
