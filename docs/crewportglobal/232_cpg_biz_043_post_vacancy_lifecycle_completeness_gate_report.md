# CPG-BIZ-043 - Подключение lifecycle completeness gate к /post-vacancy/

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source standard: BP-014 - Standard Form Lifecycle And Validation Module
- Version: 1.0
- Date: 2026-05-28
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот отчет фиксирует выполнение Phase C по стандарту BP-014.

Цель этапа - распространить утвержденный стандарт `Save / confirm data -> backend completeness -> numbered missing items -> field navigation/highlighting` на employer-side форму:

```text
/post-vacancy/
```

Теперь форма работодателя, судна и crew request показывает пользователю нумерованные `E-*`, `V-*`, `R-*` пункты, которые нужно заполнить до будущей отправки на проверку оператору.

Этот этап не добавляет submit-to-operator endpoint, не создает операторские задачи, не меняет БД, не выполняет миграции, не публикует вакансии и не принимает решений о найме.

## 2. Что реализовано

`/post-vacancy/` подключен к общему frontend helper:

```text
projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js
```

Реализовано:

1. кнопка формы переименована в `Save / confirm data`;
2. после сохранения draft вызывается backend completeness endpoint;
3. добавлена панель completeness для employer/company, vessel и crew request streams;
4. панель показывает `E-*`, `V-*`, `R-*` missing items;
5. click по missing item открывает точное поле или upload panel;
6. незаполненные поля подсвечиваются;
7. после успешной загрузки документа completeness пересчитывается;
8. смена языка перерисовывает summary и список без потери состояния.

## 3. Demand-side streams

| Stream | Объект | Примеры missing items |
|---|---|---|
| `E-*` | Employer/company account | `E-1.2: Primary contact name`, `E-4.D1: Company registration document` |
| `V-*` | Vessel context | `V-2.1: Vessel type` |
| `R-*` | Crew request / vacancy requirement | `R-1.1: Requested rank`, `R-3.1: Joining date`, `R-4.2: Salary minimum` |

## 4. User behavior

Пользователь сохраняет данные одной видимой кнопкой:

```text
Save / confirm data
```

После сохранения система:

1. сохраняет текущий draft;
2. запускает backend completeness;
3. показывает количество недостающих пунктов;
4. показывает список нумерованных пунктов;
5. дает активные ссылки на конкретные поля.

Если анкета неполная, пользователь видит, что именно нужно заполнить. Будущая отправка оператору должна оставаться заблокированной до `can_submit_to_operator = true`.

## 5. Files changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/post-vacancy/index.html` | Added demand-side completeness panel, shared lifecycle helper integration, `E/V/R` missing-item navigation, field highlighting and re-check after save/upload. |
| `projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js` | Added focus after section/field navigation so missing-item clicks move the user to the exact field. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Added regression test for demand completeness missing items, highlight behavior and exact field navigation. |
| `docs/crewportglobal/business_processes/14_standard_form_lifecycle_and_validation_module.md` | BP-014 updated: Phase C marked completed; next stage moved to shared protected-upload helper normalization. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added business-process control for demand-side lifecycle completeness adoption. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 232. |
| `docs/crewportglobal/232_cpg_biz_043_post_vacancy_lifecycle_completeness_gate_report.md` | Added this report. |

## 6. Verification

### 6.1 Syntax

```bash
node --check projects/crewportglobal/public/assets/crewportglobal-form-lifecycle.js
```

Result: passed.

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/post-vacancy/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  .map((match) => match[1])
  .filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: checked 2 inline scripts.

### 6.2 Focused demand completeness check

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts -g "post vacancy save confirm renders demand completeness items"
```

Result: 1 passed.

The test confirms:

1. incomplete demand draft can be saved;
2. backend `E/V/R` missing items are rendered;
3. `E-4.D1`, `V-2.1`, `R-1.1`, `R-3.1` appear in the UI;
4. missing field cards are highlighted;
5. clicking `R-3.1` changes URL hash to `#post-join-date`;
6. focus lands on the exact field requiring completion.

### 6.3 Focused `/post-vacancy/` suite

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Result: 3 passed.

The suite confirms:

1. upload validation still shows exact file limit and type validation;
2. demand completeness UI works;
3. existing save/reload/publication/candidate-pipeline behavior remains working;
4. no sensitive candidate email is exposed in employer candidate list.

## 7. Controlled gaps

1. Submit-to-operator review button/endpoint is still not implemented in this slice.
2. Operator task creation remains prohibited until backend completeness passes in a future submit-review gate.
3. Protected upload UI still uses page-local validation/rendering and should be normalized through a shared upload helper in the next phase.

## 8. Следующий этап

Следующий этап:

```text
CPG-BIZ-044 - Shared protected upload helper normalization
```

Цель следующего этапа:

1. вынести frontend upload validation/status rendering в общий helper;
2. подключить helper к `/create-profile/` и `/post-vacancy/`;
3. сохранить 10 MB limit, allowed formats and exact backend error messages;
4. оставить upload behavior без изменения для пользователя;
5. покрыть regression tests для обеих форм.

