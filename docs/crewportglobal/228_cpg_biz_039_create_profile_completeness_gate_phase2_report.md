# CPG-BIZ-039 - Create Profile Completeness Gate Phase 2 Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: CPG-BIZ-035 Phase 2
- Version: 1.4
- Date: 2026-05-28
- Status: Implemented and verified on GTC1

## 1. Цель этапа

Этот этап подключает анкету моряка `/create-profile/` к backend completeness endpoint, созданному на Phase 1.

Цель: пользователь сохраняет черновик одной видимой кнопкой `Save / confirm data`, система проверяет полноту обязательных полей и документов по canonical `S-*` схеме и показывает пользователю, какие пункты надо заполнить до отправки оператору.

Этап не отправляет анкету оператору, не создает operator-review task, не меняет статус review и не реализует автоматическое решение о трудоустройстве.

## 2. Реализованное поведение

| Область | Реализация |
|---|---|
| Единая кнопка | Основная кнопка формы теперь называется `Save / confirm data`. |
| Section-save controls | Старые кнопки `Save section` скрыты из обычного пользовательского интерфейса. |
| Backend completeness | После сохранения форма вызывает `GET /api/v1/registration/drafts/{draft_id}/completeness`. |
| Missing items | Пользователь видит нумерованные `S-*` пункты из backend ответа, например `S-1.3` или `S-12.D1`. |
| Field highlighting | Поля и секции, связанные с missing items, подсвечиваются другим цветом. |
| Section links | Missing item является ссылкой на соответствующую секцию формы. |
| Save / confirm persistence | Кнопка `Save / confirm data` теперь сначала сохраняет введенные значения, затем запускает completeness check. |
| Autosave | Изменения полей сохраняются немедленно в локальный browser snapshot; для существующего `draft_id` или после заполнения имени/email они дополнительно синхронизируются в backend. |
| Submit boundary | Отдельная отправка оператору в этом этапе не активируется. |

### 2.1 Исправление перехода по demand-side замечаниям

После визуальной проверки было выявлено, что demand-side замечание `R-4.2: Salary minimum`, показанное на `/create-profile/` для employer/demand draft, не переводило пользователя к соответствующему полю заявки судовладельца.

Исправлено:

1. `E-*`, `V-*` и `R-*` поля в questionnaire schema теперь имеют точные `target_url` на конкретные поля `/post-vacancy/`.
2. `/create-profile/` различает локальные `S-*` ссылки и demand-side ссылки на `/post-vacancy/`.
3. При переходе по `R-4.2` открывается:

```text
/post-vacancy/?draft_id=...#post-salary-min
```

4. `/post-vacancy/` подсвечивает поле, указанное в hash, чтобы пользователь сразу видел пункт, требующий доработки.

### 2.2 Исправление сохранения контактов, адресов и незавершенной анкеты

После пользовательской проверки было выявлено, что изменения в разделе `Personal contact and addresses` / `Permanent and registration addresses`, а также любые поля незавершенной анкеты, могли быть потеряны при перезагрузке страницы до завершения backend autosave.

Исправлено:

1. Все обычные поля формы без файлового ввода сохраняются в локальный browser snapshot сразу после изменения.
2. Если backend draft еще не может быть создан, потому что имя/email не заполнены, введенные данные все равно восстанавливаются после перезагрузки страницы.
3. Когда появляется `draft_id` или существующий draft открыт по ссылке, восстановленные локальные значения ставятся в очередь backend autosave.
4. Для уже существующего `draft_id` background autosave больше не зависит от повторного заполнения имени и email в форме.
5. Пустой email не отправляется в `PATCH /api/v1/registration/drafts/{draft_id}`, поэтому существующий backend email не затирается и не вызывает ошибку валидации.
6. Если пользователь меняет поле во время уже выполняющегося autosave, форма ставит повторное сохранение в очередь и выполняет его после завершения текущего запроса.
7. Добавлены регрессионные тесты: локально заполненные поля восстанавливаются до создания backend draft; быстро измененные поля существующего draft восстанавливаются сразу после перезагрузки; контактные и адресные поля доходят до backend и сохраняются после reload.

### 2.3 Исправление кнопки `Save / confirm data` как реальной точки сохранения

После дополнительной пользовательской проверки было выявлено, что кнопка `Save / confirm data` могла запускать контроль полноты, но не гарантировала сохранение введенных значений в двух случаях:

1. существующий `draft_id` открыт, но видимое поле email пустое;
2. новый черновик еще не может быть создан в backend, потому что имя/email не заполнены.

Исправлено:

1. При нажатии `Save / confirm data` форма всегда сначала сохраняет текущий browser snapshot.
2. Если `draft_id` уже существует, backend save выполняется даже при пустом видимом email; существующий backend email сохраняется и не затирается пустым значением.
3. Если backend draft еще нельзя создать из-за отсутствия имени/email, кнопка сохраняет значения локально и показывает пользователю, что черновик сохранен в браузере.
4. Completeness check запускается только после успешного backend save или при уже существующем backend draft.
5. Файловые поля не сохраняются в browser snapshot из-за ограничений безопасности браузера; документы по-прежнему сохраняются только через отдельный upload flow.
6. Добавлен regression test, подтверждающий, что `Save / confirm data` сохраняет контактные и адресные поля существующего draft даже при пустом видимом email, а значения остаются после reload.

## 3. Пользовательский процесс

1. Пользователь заполняет анкету моряка.
2. Поля сохраняются автоматически сначала локально в браузере, затем в backend при наличии `draft_id` или минимальных данных для создания draft.
3. Пользователь нажимает единственную видимую кнопку `Save / confirm data`.
4. Система сначала сохраняет текущие введенные значения.
5. Если backend draft доступен, система сохраняет значения в backend.
6. Система запускает backend completeness check.
7. Если есть missing items, пользователь видит список `S-*` пунктов и подсветку полей.
8. Пользователь открывает нужную секцию по ссылке, исправляет данные и снова нажимает `Save / confirm data`.
9. До полной готовности анкета остается owner-side draft и не передается оператору.

## 4. Файлы изменены

| File | Change |
|---|---|
| `projects/crewportglobal/app/backend/api/lib/questionnaire_schema.php` | Changed demand-side completeness target URLs from generic form anchor to exact field anchors, including `R-4.2 -> #post-salary-min`. |
| `projects/crewportglobal/public/assets/crewportglobal-registration-drafts.js` | Added `getCompleteness(draftId)` helper for the shared registration draft API client. |
| `projects/crewportglobal/public/create-profile/index.html` | Connected Save / confirm flow to completeness endpoint, added S-code rendering, section links, field highlighting, hidden section-save controls and background autosave; added cross-page demand-side missing-item navigation; fixed existing-draft autosave for contact/address fields; added local browser snapshot restore for unsaved edits before backend draft creation; made `Save / confirm data` perform a real local/backend save before completeness control. |
| `projects/crewportglobal/public/post-vacancy/index.html` | Added hash-target field highlighting for direct demand-side missing-item links. |
| `tests/crewportglobal-create-profile-prefill.spec.ts` | Added regressions for one visible Save / confirm action, backend `S-*` missing items, highlighted fields/sections, `R-4.2` cross-page field navigation, local-only draft restore before backend draft creation, immediate restore after reload, contact/address autosave persistence after reload and Save / confirm persistence for existing draft edits with empty visible email. |
| `tests/crewportglobal-seafarer-workspace-form.spec.ts` | Updated old section-save assertions to the approved one-button Save / confirm behavior. |
| `docs/crewportglobal/00_documentation_register.md` | Registered document 228. |
| `docs/crewportglobal/business_processes/00_business_process_register.md` | Added Phase 2 business-process control for `/create-profile/`. |
| `docs/crewportglobal/224_cpg_biz_035_questionnaire_save_completeness_gate_implementation_task.md` | Marked Phase 2 as implemented and shifted remaining phases. |
| `docs/crewportglobal/227_cpg_biz_038_backend_completeness_analyzer_api_contract_report.md` | Updated next-stage note after Phase 2 implementation. |
| `docs/crewportglobal/228_cpg_biz_039_create_profile_completeness_gate_phase2_report.md` | Added this report. |

## 5. Контроль границ

| Boundary | Status |
|---|---|
| No DB migration | Preserved. |
| No operator task on save | Preserved. Completeness endpoint remains no-side-effect. |
| No automatic submit | Preserved. |
| No matching score | Preserved. |
| No employer-facing publication | Preserved. |
| No broad sensitive-field exposure | Preserved; completeness response contains numbered field/document blockers and target URLs, not protected document paths. |

## 6. Verification

Verification commands:

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/create-profile/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: passed, checked 2 inline scripts.

Additional syntax and schema checks after demand-link correction:

```bash
php -l projects/crewportglobal/app/backend/api/lib/questionnaire_schema.php
php projects/crewportglobal/app/backend/api/tests/questionnaire_schema_test.php
```

Result: passed.

```bash
node - <<'NODE'
const fs = require('fs');
for (const file of ['projects/crewportglobal/public/create-profile/index.html', 'projects/crewportglobal/public/post-vacancy/index.html']) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
  scripts.forEach((script) => new Function(script));
  console.log(`${file}: checked ${scripts.length} inline script(s)`);
}
NODE
```

Result: passed, checked 2 inline scripts per page.

Focused Playwright verification:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts tests/crewportglobal-seafarer-workspace-form.spec.ts
```

Result: passed, 8 tests.

Focused demand-link regression:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts -g "demand completeness link"
```

Result: passed, 1 test.

Relevant focused suite after the correction:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Result: passed, 11 tests.

Focused contact/address persistence regression:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts -g "autosaves contact"
```

Result: passed, 1 test.

Focused Save / confirm persistence regressions:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts -g "local-only|save confirm persists existing draft"
```

Result: passed, 2 tests.

Focused local restore regressions:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-create-profile-prefill.spec.ts -g "local-only|immediately after reload"
```

Result: passed, 2 tests.

The focused suite confirms:

1. `/create-profile/` keeps one visible `Save / confirm data` action for draft confirmation;
2. old section-save controls are hidden from the ordinary user flow;
3. backend `S-*` missing items are rendered after save;
4. missing fields and document sections are highlighted;
5. `S-*` missing item links open the exact form section;
6. `R-4.2` demand-side missing item opens `/post-vacancy/?draft_id=...#post-salary-min`;
7. `/post-vacancy/` highlights the target salary minimum field;
8. existing draft prefill and patch flow still work;
9. contact and address edits autosave on an existing `draft_id` and remain after page reload;
10. `Save / confirm data` saves local-only fields before backend draft creation;
11. `Save / confirm data` saves existing draft edits to backend even when visible email is empty;
12. fields entered before backend draft creation are restored from local browser storage after reload;
13. quickly edited existing-draft fields are restored immediately after reload and then synced to backend;
14. extended seafarer workspace fields still persist through save/reload;
15. cabinet seafarer completeness tasks still derive from partial structured workspace.

## 7. Следующий этап

Следующий этап по плану:

```text
CPG-BIZ-035 Phase 3 - /post-vacancy/ autosave plus one Save / confirm action
```

На Phase 3 тот же стандарт должен быть применен к demand-side форме:

1. одна видимая кнопка `Save / confirm data`;
2. backend `E/V/R-*` missing items;
3. подсветка employer, vessel и crew-request полей;
4. отсутствие team-review task до явной submit-review операции;
5. сохранение approval guard и data-minimization boundaries.
