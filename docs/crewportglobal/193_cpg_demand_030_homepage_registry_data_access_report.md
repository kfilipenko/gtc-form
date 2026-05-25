# CPG-DEMAND-030 — Homepage Registry Data Access Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Version: 1.0
- Date: 2026-05-25
- Status: Implemented and verified on GTC1

## 1. Цель

Этот этап делает реальные безопасные данные реестра заметными для демонстрации, а не только статистическими счётчиками.

Проблема: на первом экране главной страницы были видны только количества заявок, судов и моряков. Сами безопасные строки live registry находились ниже и могли быть неочевидны для инвесторского просмотра.

## 2. Что изменено

### 2.1 Явный переход к данным

В верхний hero-блок добавлена основная кнопка:

```text
Show registry data / Показать данные
```

Кнопка ведёт к безопасному блоку:

```text
#home-registry-summary
```

### 2.2 Safe registry поднят выше пояснений

Блок live registry теперь расположен сразу после hero-блока и до `Service model`.

Это сохраняет порядок демонстрации:

1. сначала реальные счётчики;
2. затем безопасные строки заявок, судов и моряков;
3. затем краткие пояснения модели сервиса.

### 2.3 Больше безопасных строк

Homepage preview теперь показывает до 8 безопасных строк на категорию вместо 4:

```text
crew requests
vessels
seafarers
```

Read-only фильтры из CPG-DEMAND-029 сохранены:

```text
all records
requests
vessels
seafarers
matching-ready
with blockers
```

## 3. Privacy Boundary

Публичный просмотр остаётся contact-free.

Не показываются:

```text
email
contact_email
seafarer_email
phone
contact_phone
document_metadata
passport_number
medical_details
```

Показываются только безопасные operational/matching hints:

1. для заявок — title/rank, department, vessel type, join date, publication status, company/vessel label, readiness;
2. для судов — vessel name, vessel type, flag, company label, readiness;
3. для моряков — rank, department, availability, country/status, readiness.

## 4. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/index.html` | Добавлена кнопка `Show registry data`, live registry перемещён выше service-model пояснений, preview limit увеличен до 8 строк на категорию. |
| `tests/crewportglobal-homepage-live-dashboard.spec.ts` | Добавлена проверка hero CTA, перехода к registry section и порядка: registry до service model. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 193 и версия register 1.73. |
| `docs/crewportglobal/193_cpg_demand_030_homepage_registry_data_access_report.md` | Добавлен этот отчёт. |

## 5. Verification

Проверки:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

```bash
node - <<'NODE'
const fs = require('fs');
const html = fs.readFileSync('projects/crewportglobal/public/index.html', 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
scripts.forEach((script) => new Function(script));
console.log(`checked ${scripts.length} inline script(s)`);
NODE
```

Result: passed.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-live-dashboard.spec.ts
```

Result: 1 passed.

The focused test confirms:

1. the top-block `Show registry data` action is visible;
2. the action moves the visitor to the safe live registry section;
3. the registry section appears before the service-model explanation;
4. requests, vessels and seafarers remain visible in the safe registry preview;
5. seafarer email and phone remain absent from API and UI payloads.

### 5.1 Live Publication Check

```bash
projects/crewportglobal/scripts/deploy_public_live.sh
```

Result: passed.

Live checks:

```text
https://crewportglobal.com/
https://crewportglobal.com/api/v1/registry-summary
```

Result: passed.

At verification time the live registry endpoint returned real counts and 12 safe sample rows per registry object type. The homepage renders up to 8 rows per object type for a compact investor-facing view.

## 6. Следующий этап

Этап CPG-DEMAND-030 завершён.

Следующий практический шаг: создать отдельный защищённый registry detail view с пагинацией и расширенными safe columns для внутренней демонстрации, чтобы можно было показывать больше записей без раскрытия контактов, документов и restricted data.
