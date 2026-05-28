# CPG-BIZ-041 - Standard Form Lifecycle Module Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Отчет о стандартизации
- Source task: Project Owner approval after CPG-BIZ-040 multi-role upload correction
- Version: 1.0
- Date: 2026-05-28
- Status: Standard documented; implementation sequence approved for next slices

## 1. Цель

Этот отчет фиксирует переход от точечных правил отдельных форм к единому стандарту обработки анкет CrewPortGlobal.

Поводом стала найденная на практике ошибка: аккаунт с несколькими ролями мог открывать форму моряка, но backend выбирал не тот role context, из-за чего загрузка seafarer-документа блокировалась сообщением:

```text
form_type does not match the registration draft role
```

Исправление показало, что проблема шире одной формы. Все анкеты должны работать через один жизненный цикл:

```text
role context -> draft context -> save -> completeness -> upload -> submit gate -> computed task
```

## 2. Новый Стандарт

Добавлен бизнес-процессный стандарт:

```text
docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md
```

Он определяет единый lifecycle для:

1. анкеты моряка;
2. анкеты работодателя / судовладельца;
3. анкеты судна;
4. заявки / вакансии на экипаж;
5. protected upload;
6. correction forms;
7. submit-to-review gate;
8. вычисляемых задач команды.

## 3. Ключевое Решение

Форма не должна сама определять правила проверки и отправки.

Правила должны находиться в общем lifecycle module:

```text
form configuration
+ authenticated account
+ requested role context
+ draft/object state
+ canonical mandatory-field schema
+ protected-upload policy
+ current corrections
= save, completeness, submit and task behavior
```

## 4. Потоки Данных

| Поток | Объект | Префикс | Ответственный пользователь | Команда |
|---|---|---|---|---|
| Seafarer supply | `seafarer_profile` | `S-*` | Моряк | `verification_team` |
| Employer / shipowner account | `employer_company` | `E-*` | Работодатель / представитель | `verification_team` |
| Vessel context | `vessel` | `V-*` | Работодатель / представитель | `verification_team` |
| Crew request / vacancy | `vacancy_request` | `R-*` | Работодатель / представитель | `review_team` |
| Document evidence | `uploaded_documents` | `*.D*` | Загружающий пользователь | Verification/review group |

## 5. Backend Contract

Стандарт требует, чтобы backend для каждой формы явно определял:

| Элемент | Назначение |
|---|---|
| `draft_id` | Черновик или рабочий объект. |
| `role` | Контекст роли: `seafarer`, `employer`, `shipowner`, `crewing_manager`. |
| `form_type` | Тип формы: `seafarer`, `employer`, `vessel`, `crew_request`. |
| owner / assignment | Право редактировать, проверять или контролировать объект. |
| completeness schema | Единый источник обязательных полей. |
| upload policy | Единые правила документов. |

Особенно важно: если у пользователя несколько ролей, backend обязан использовать валидный запрошенный role context, а не первую найденную роль.

## 6. Frontend Contract

Для всех форм закреплена единая модель:

| Функция | Стандарт |
|---|---|
| Загрузка черновика | С явным `role` и `form_type`. |
| Автосохранение | Сохраняет изменения без создания review task. |
| Главная кнопка | Одна видимая `Save / confirm data`. |
| Проверка полноты | Только через backend completeness endpoint. |
| Missing items | Нумерованные `S/E/V/R` пункты. |
| Переход к полю | Клик по пункту ведет к конкретному полю/разделу. |
| Подсветка | Незаполненные обязательные поля выделяются. |
| Upload | Показывает форматы, лимит 10 MB и точную ошибку. |
| Submit | Недоступен до `can_submit_to_operator = true`. |

## 7. Текущий Baseline

| Страница | Статус |
|---|---|
| `/create-profile/` | Частично соответствует стандарту: autosave, Save/confirm, `S-*` missing items, подсветка, role-aware seafarer context, upload diagnostics. |
| `/post-vacancy/` | Частично соответствует стандарту: role-aware employer context и upload diagnostics есть; полный `E/V/R` completeness UI еще предстоит внедрить. |
| `/cabinet/` | Correction tasks уже есть; надо синхронизировать их с тем же numbered missing-item standard. |
| `/verify/` | Review workspace и computed tasks есть; надо продолжить вывод lifecycle stage/result из единого контракта. |
| `/team/` | Task title/stage/visibility condition уже внедрены; надо продолжить привязку к lifecycle result. |

## 8. Необходимые Модули

Backend:

| Module | Назначение |
|---|---|
| `questionnaire_schema.php` | Canonical required-field schema. |
| `questionnaire_completeness.php` | Completeness analyzer. |
| role-aware draft context helper | Единое определение роли и формы. |
| `document_uploads.php` | Protected upload policy. |
| future submit-review helper | Gate transition and audit. |

Frontend:

| Module | Назначение |
|---|---|
| `crewportglobal-registration-drafts.js` | API client for draft/save/completeness with role support. |
| future `crewportglobal-form-lifecycle.js` | Save/confirm, autosave, missing-item rendering, field navigation. |
| future `crewportglobal-protected-upload.js` | Shared upload validation and error rendering. |
| page adapter | Mapping HTML fields to canonical `S/E/V/R` codes. |

## 9. Реализационная Последовательность

| Phase | Scope | Результат |
|---|---|---|
| Phase A | Документировать стандарт. | BP-014 и этот отчет. |
| Phase B | Вынести verified `/create-profile/` логику в shared frontend helper. | Общий модуль без изменения поведения. |
| Phase C | Применить полный Save/completeness gate к `/post-vacancy/`. | `E/V/R` missing items и подсветка. |
| Phase D | Вынести upload UI в shared protected upload helper. | Одинаковая загрузка на всех формах. |
| Phase E | Реализовать gated submit-review endpoint. | Создание team task только после backend completeness pass. |
| Phase F | Синхронизировать owner correction tasks с numbered missing-item standard. | Единая коррекция и resubmit. |

## 10. Контрольные Ограничения

Этот этап не меняет:

1. UI runtime behavior;
2. DB schema;
3. migrations;
4. matching algorithm;
5. employment decision logic;
6. employer-facing publication;
7. payment/subscription logic.

## 11. Проверка

Выполнена документационная проверка:

1. BP-014 добавлен как отдельный стандарт.
2. Business Process Register обновлен.
3. Main Documentation Register обновлен.
4. Стандарт согласован с уже внедренными CPG-BIZ-033 - CPG-BIZ-040 controls.
5. Следующий этап определен без изменения runtime behavior.

## 12. Следующий Этап

Следующий этап:

```text
CPG-BIZ-042 - Shared frontend form lifecycle helper extraction
```

Цель следующего этапа - вынести уже проверенную логику `/create-profile/` в общий frontend module без изменения поведения формы:

1. autosave;
2. Save / confirm data;
3. completeness rendering;
4. missing-item navigation;
5. field/section highlighting;
6. role-aware draft reads.

После этого тот же модуль будет подключен к `/post-vacancy/`.

