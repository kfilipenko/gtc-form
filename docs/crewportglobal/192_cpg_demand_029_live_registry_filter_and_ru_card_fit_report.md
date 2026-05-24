# CPG-DEMAND-029 — Live Registry Filter and Russian Card-Fit Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 — Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель

Этот этап исправляет отображение главной страницы для русского языка и делает безопасный read-only фильтр live registry пригодным для инвесторского просмотра.

Цель не меняет операционный процесс: данные остаются защищёнными, контакты и документы не публикуются, а фильтр показывает только безопасные счётчики и структурированные признаки готовности.

## 2. Что изменено

### 2.1 Русский текст в карточках

Верхние карточки счётчиков теперь допускают перенос длинных русских слов внутри карточки.

Исправлено:

1. добавлен перенос длинных подписей через `overflow-wrap: anywhere`;
2. карточкам задан `min-width: 0`;
3. сетка счётчиков получила устойчивую минимальную ширину колонок;
4. безопасные строки реестра также получили перенос длинных значений.

### 2.2 Read-only фильтр live registry

На главной странице используется read-only фильтр:

```text
All records / Все записи
Requests / Заявки
Vessels / Суда
Seafarers / Моряки
Matching-ready / Готово к сопоставлению
With blockers / С блокерами
```

Фильтр работает только на публичном безопасном представлении. Он не создаёт, не меняет и не удаляет записи.

### 2.3 Readiness hints

`GET /api/v1/registry-summary` проверен как источник безопасных preview rows с полями:

```text
readiness_status
readiness_blockers[]
```

Текущая базовая логика:

| Record type | Matching-ready when present | Blocker examples |
|---|---|---|
| Crew request | rank, department, vessel type, join date | `missing_rank`, `missing_department`, `missing_vessel_type`, `missing_join_date` |
| Vessel | vessel name, vessel type | `missing_vessel_name`, `missing_vessel_type` |
| Seafarer | primary rank, department, availability | `missing_rank`, `missing_department`, `missing_availability` |

Это только публичная подсказка готовности для инвесторского просмотра и ручной проверки. Это не matching score и не employment decision.

## 3. Privacy Boundary

Публичный endpoint по-прежнему исключает:

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

Главная страница показывает реальные счётчики и безопасные структурированные признаки, но не показывает контактные данные моряков, работодателей или защищённые документы.

## 4. Files Changed

| File | Change |
|---|---|
| `projects/crewportglobal/public/index.html` | Исправлен перенос русских подписей и скрытие неактивных registry-карточек; read-only фильтр live registry теперь визуально работает корректно. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Изменений в этом файле не потребовалось: активный endpoint уже возвращает безопасные readiness fields and counts без контактных данных. |
| `tests/crewportglobal-homepage-live-dashboard.spec.ts` | Добавлены проверки фильтра, отсутствия контактов в API/UI, matching-ready rows и отсутствия горизонтального переполнения русских подписей. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлен документ 192 и версия register 1.72. |
| `docs/crewportglobal/192_cpg_demand_029_live_registry_filter_and_ru_card_fit_report.md` | Добавлен этот отчёт. |

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

Result: checked 2 inline scripts.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-live-dashboard.spec.ts
```

Result: 1 passed.

The focused homepage test confirms:

1. real registry counters load from PostgreSQL;
2. the read-only filters switch between all records, requests, matching-ready and blockers;
3. matching-ready request, vessel and seafarer preview rows remain visible;
4. seafarer email and phone are absent from API and UI payloads;
5. Russian count-card labels do not overflow their cards.

```bash
npm run test:cpg-api
```

Result: 18 passed.

## 6. Следующий этап

Этап CPG-DEMAND-029 завершён.

Следующий практический шаг: добавить отдельный защищённый operator/investor-safe registry detail view для внутренней демонстрации, где можно будет просматривать больше безопасных строк с пагинацией, не раскрывая контакты, документы и restricted data.
