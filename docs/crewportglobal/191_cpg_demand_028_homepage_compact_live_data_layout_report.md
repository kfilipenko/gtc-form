# CPG-DEMAND-028 - Компактная главная страница с live data первым экраном

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner homepage UX correction after CPG-DEMAND-027
- Version: 1.0
- Date: 2026-05-24
- Status: Implemented and verified on GTC1

## 1. Цель

Цель этапа - привести главную страницу к более практичному международному product-site формату:

1. сначала показать реальные данные платформы;
2. убрать лишние пояснения из первого экрана;
3. не повторять содержание документарных разделов;
4. оставить короткую коммерческую и операционную суть;
5. сохранить запрет на публичный показ контактных и чувствительных данных.

## 2. Что изменено

### 2.1 Верхний блок

В первый экран вынесены live-панели:

```text
registered crew requests
registered vessels
registered seafarers
```

Теперь посетитель сразу видит реальные операционные данные, а не только пояснительный текст.

### 2.2 Формулировки

Удалена формулировка:

```text
Registered platform data for demonstration
```

Новая формулировка:

```text
Registered platform data
```

Русская версия:

```text
Зарегистрированные данные платформы
```

Также сокращены hero-тексты, чтобы страница говорила о продукте, данных и защищенной видимости, а не повторяла внутренние документы.

### 2.3 Service model

Блок:

```text
Service model
The platform compares demand with supply after verified registration.
```

переведен в компактный accordion/details формат.

По умолчанию видны только заголовки:

1. Employer demand.
2. Seafarer supply.
3. Authorization evidence.
4. Scoped visibility.
5. Human review.
6. Authenticated cabinet.

Пояснение открывается только после клика по заголовку.

## 3. Что сохранено

Сохранены:

1. live vacancy board;
2. homepage registry summary;
3. API status;
4. public vacancy count;
5. запрет на показ e-mail и телефонов;
6. запрет на публичный показ document metadata;
7. английские и русские i18n-строки.

## 4. Файлы изменены

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/public/index.html` | Перестроен первый экран, live data вынесены наверх, Service model переведен в раскрывающиеся пункты, сокращены EN/RU тексты. |
| `tests/crewportglobal-homepage-live-dashboard.spec.ts` | Добавлены проверки отсутствия `for demonstration`, свернутого Service model и раскрытия текста по клику. |
| `docs/crewportglobal/00_documentation_register.md` | Зарегистрирован документ 191. |
| `docs/crewportglobal/191_cpg_demand_028_homepage_compact_live_data_layout_report.md` | Добавлен этот отчет. |

## 5. Verification

Проверка выполнена на GTC1.

```bash
node inline script syntax check for projects/crewportglobal/public/index.html
```

Result: checked 2 inline scripts.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-live-dashboard.spec.ts
```

Result: 1 passed.

Focused homepage test confirms:

1. live registry counters are visible on the homepage;
2. live vacancy board still loads;
3. the phrase `for demonstration` is absent from visible homepage content;
4. Service model details are collapsed by default;
5. Service model text opens after clicking the heading;
6. public registry preview still excludes seafarer e-mail and phone.

## 6. Завершение этапа и следующий шаг

Этап завершен после прохождения focused homepage test и проверки отсутствия generated Playwright artifacts в рабочем дереве.

Следующий этап: добавить read-only фильтр live registry для инвесторского просмотра:

1. All records.
2. Crew requests.
3. Vessels.
4. Seafarers.
5. Matching-ready.
6. Records with blockers.

Фильтр должен оставаться публично безопасным и не раскрывать контактные данные.
