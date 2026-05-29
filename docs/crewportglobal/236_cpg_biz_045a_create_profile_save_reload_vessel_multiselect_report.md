# CPG-BIZ-045A - Create Profile Save Reload And Vessel-Type Multiselect Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source request: Project Owner testing feedback after CPG-BIZ-045
- Version: 1.0
- Date: 2026-05-29
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот корректирующий этап закрывает проблему, найденную при ручном тестировании анкеты моряка:

1. после заполнения полей, нажатия `Save / confirm data` и жесткой перезагрузки часть данных могла исчезать из формы;
2. поле `Preferred vessel types` было текстовым и не давало надежный справочный множественный выбор;
3. пользователю нужен вариант, когда тип судна не имеет значения для подбора.

Этап не меняет бизнес-границу submit-review: сохранение по-прежнему сохраняет данные и выполняет completeness check, но не создает operator review task без отдельного submit-review.

## 2. Найденная причина

Причина потери данных была в конфликте между двумя источниками восстановления формы:

1. backend draft после успешного сохранения;
2. browser local snapshot, который использовался для защиты несохраненных правок.

После успешного backend save старый локальный snapshot мог оставаться в браузере и при повторном открытии формы подменять свежие backend-данные пустыми или устаревшими значениями.

## 3. Исправленное правило

Для `/create-profile/` закреплено правило:

```text
после успешного Save / confirm data backend draft является источником истины;
локальный snapshot применяется только если он новее backend updated_at.
```

Теперь после успешного сохранения локальный snapshot для активного draft очищается. При загрузке формы backend draft загружается первым, а local snapshot применяется только как защита более свежих несохраненных правок.

## 4. Vessel-Type Multiselect

Поле `Preferred vessel types` переведено из свободного текста в справочный множественный выбор:

```text
reference_catalog: vessel_types
```

Добавлен нейтральный вариант:

```text
Any vessel type / Тип судна не важен
```

Правило выбора:

| Условие | Поведение |
|---|---|
| Пользователь выбирает конкретные типы судов | Сохраняется массив выбранных типов. |
| Пользователь выбирает `Any vessel type` | Конкретные типы снимаются. |
| Пользователь выбирает конкретный тип после `Any vessel type` | Нейтральный вариант снимается. |

Это сохраняет поле пригодным для будущего request-supply matching: конкретные типы судов дают структурированные значения, а нейтральный вариант явно означает отсутствие жесткого предпочтения.

## 5. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/create-profile/index.html` | Added backend-first reload behavior after save, local snapshot timestamp guard, multiselect vessel-type field, vessel catalog binding and `Any vessel type` option. |
| `tests/crewportglobal-create-profile-prefill.spec.ts` | Updated tests for multiselect vessel types and added hard-reload persistence regression after `Save / confirm data`. |
| `docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md` | Updated BP-014 with backend-first reload and list-valued reference-field rule. |
| `docs/crewportglobal/implemented_code_standards/01_standard_form_lifecycle.md` | Updated ICS-001 with reload source-of-truth and list-valued select adapter requirements. |
| `docs/crewportglobal/00_documentation_register.md` | Registered this report. |
| `docs/crewportglobal/236_cpg_biz_045a_create_profile_save_reload_vessel_multiselect_report.md` | Added this implementation report. |

## 6. Verification

### 6.1 Frontend Syntax

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/create-profile/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 2 inline scripts.

### 6.2 Backend Syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 6.3 Focused Create-Profile Regression

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts
```

Result: 13 passed.

The regression confirms:

1. existing draft prefill still works;
2. field edits are saved to backend by `Save / confirm data`;
3. hard reload restores backend data instead of stale local blanks;
4. local-only edits still survive before a backend draft exists;
5. vessel type is stored as a structured array;
6. `Any vessel type` remains selected after save and reload;
7. missing-item navigation and vacancy application history still work.

## 7. User Verification Link

The tested route remains:

```text
https://crewportglobal.com/create-profile/?draft_id=28f326c2-c86e-4036-8889-1717070adc60
```

Expected behavior:

1. select one or more vessel types, or select `Тип судна не важен`;
2. fill contact/address fields;
3. press `Save / confirm data`;
4. hard refresh the page;
5. saved fields remain visible.

## 8. Next Stage

The next planned stage remains:

```text
CPG-BIZ-046 - Owner correction resubmission gate and computed task recomputation alignment
```

Before that stage, the same reload rule must be treated as mandatory for all form adapters:

```text
successful backend save clears stale local snapshot;
backend draft wins after reload unless local snapshot is newer than backend updated_at.
```
