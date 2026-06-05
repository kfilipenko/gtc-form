# CPG-BIZ-105 - Отчет о встречном поиске работы моряком и запросе на контракт

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Отчет о реализации
- Исходная задача: распоряжение Project Owner после CPG-BIZ-104
- Версия: 1.0
- Дата: 2026-06-05
- Статус: Реализовано и проверено

## 1. Назначение

Этот отчет фиксирует встречный поток поиска работы моряком.

Ранее основной matching-flow шел от судовладельца:

```text
заявка на экипаж -> поиск кандидатов -> shortlist -> решение судовладельца -> предложение контракта
```

Теперь добавлен второй вход в тот же процесс:

```text
проверенный профиль моряка -> подходящие опубликованные вакансии -> запрос моряка на рассмотрение контракта -> vacancy_applications -> существующий review / employer / contract workflow
```

Цель изменения - дать моряку активную операцию поиска подходящей вакансии без обхода проверок, shortlist/candidate-presentation guard и правил contract workspace.

## 2. Реализованный объем

Добавлена страница:

```text
/seafarers/job-search/
```

Добавлен API endpoint:

```text
GET /api/v1/seafarer/job-search?draft_id={seafarer_profile_id}
```

Страница подключена:

1. в меню `Seafarers / Моряки` как `Job Search / Поиск работы`;
2. в личный кабинет моряка как вычисляемая задача, если по профилю найдены подходящие вакансии;
3. в существующий request flow через `POST /api/v1/vacancies/{vacancy_request_id}/applications`.

## 3. Поведение matching и guard

| Условие | Что видит пользователь | Запрос разрешен? |
|---|---|---:|
| Нет черновика/профиля моряка | Ссылка на создание или открытие профиля | Нет |
| Профиль не готов к matching | Показываются blockers | Нет |
| Вакансия не опубликована | Вакансия блокируется guard | Нет |
| Работодатель/компания не проверены | Вакансия блокируется guard | Нет |
| Ранг, департамент, тип судна или зарплата не совпадают | Показываются причины несовпадения | Нет |
| Профиль готов + вакансия опубликована + работодатель проверен | Вакансия доступна для запроса | Да |
| Уже есть активный application request | Показывается существующий запрос | Повторный запрос не создается |

Запрос моряка создает или повторно использует контролируемый контекст `vacancy_applications`.

Он не создает:

1. статус трудоустройства;
2. экземпляр контракта;
3. счет или billing record;
4. неограниченную employer-facing выдачу данных кандидата;
5. автоматическое решение о найме.

## 4. Граница конфиденциальности

Страница поиска работы показывает моряку только безопасную информацию по стороне вакансии:

1. должность;
2. департамент;
3. тип судна;
4. дату посадки;
5. срок контракта;
6. диапазон зарплаты;
7. безопасное отображаемое имя компании;
8. объяснение совпадения или blockers.

Страница не раскрывает других кандидатов и контактные данные кандидатов. Собственный email моряка может использоваться внутри запроса application, но не отображается как публичный matching-контент.

## 5. Обновление бизнес-процесса

В документации бизнес-процессов новый поток закреплен как:

```text
CF-08A - Seafarer job-search counter-flow
```

Встречный поток подключается к существующему коммерческому процессу и не создает конкурирующий маршрут.

Обновлены документы:

| Документ | Изменение |
|---|---|
| `business_processes/12_crew_formation_service_business_process_manual.md` | Добавлен этап CF-08A, пример задачи и строка verified role-based execution. |
| `business_processes/13_crew_formation_operating_instructions_for_users_team_ai.md` | Добавлены инструкции моряку по поиску работы и запросу рассмотрения контракта. |
| `business_processes/16_business_process_stage_standard_mapping_matrix.md` | Добавлена строка матрицы stage-to-standard для встречного потока моряка. |
| `business_processes/00_business_process_register.md` | Добавлен control 73 и revision 3.36. |

## 6. Измененные файлы

| Файл | Изменение |
|---|---|
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлен endpoint поиска вакансий моряком и helper-функции matching. |
| `projects/crewportglobal/public/seafarers/job-search/index.html` | Добавлена страница моряка с подходящими вакансиями, blockers и действием request. |
| `projects/crewportglobal/public/cabinet/index.html` | Добавлена вычисляемая задача поиска работы в личном кабинете моряка. |
| `projects/crewportglobal/public/assets/crewportglobal-navigation.js` | Добавлен пункт меню `Job Search`; нормализован fallback label для проверки документов. |
| `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js` | Добавлены EN/RU/PT строки меню для поиска работы. |
| `tests/crewportglobal-navigation-menus.spec.ts` | Добавлена проверка навигации для `/seafarers/job-search/`. |
| `tests/crewportglobal-post-vacancy-workspace.spec.ts` | Добавлена end-to-end проверка поиска работы моряком и отправки запроса. |

## 7. Проверка

Проверка PHP-синтаксиса:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Результат: passed.

Проверка inline JavaScript:

```bash
node - <<'NODE'
const fs = require('fs');
for (const file of [
  'projects/crewportglobal/public/seafarers/job-search/index.html',
  'projects/crewportglobal/public/cabinet/index.html'
]) {
  const html = fs.readFileSync(file, 'utf8');
  const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map((match) => match[1]).filter((script) => script.trim());
  scripts.forEach((script) => new Function(script));
  console.log(`${file}: checked ${scripts.length} inline script(s)`);
}
NODE
```

Результат: passed.

Проверка whitespace/diff:

```bash
git diff --check
```

Результат: passed.

Регрессия навигации:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts
```

Результат: 8 passed.

End-to-end проверка поиска работы моряком:

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-post-vacancy-workspace.spec.ts
```

Результат: 3 passed.

Проверка подтверждает, что путь поиска работы моряком работает на созданных demo seafarer/vacancy данных.

## 8. Ссылки для проверки на портале

Для ручного визуального контроля:

```text
https://crewportglobal.com/seafarers/job-search/
https://crewportglobal.com/cabinet/
https://crewportglobal.com/create-profile/
```

Если `draft_id` моряка отсутствует, сначала нужно открыть или создать профиль моряка, затем вернуться в `Job Search / Поиск работы`.

## 9. Оставшиеся контролируемые gaps

1. Уведомление судовладельца и прием seafarer-initiated request пока используют существующий application/review path; отдельную панель handoff можно улучшить следующим этапом.
2. Match score является объяснительным признаком и не должен трактоваться как автоматическое решение о трудоустройстве.
3. Предложение контракта остается под контролем existing employer decision и Contract Agreement Workspace.

## 10. Следующий этап

Рекомендуемый следующий этап:

```text
CPG-BIZ-106 - Seafarer-initiated request handoff to shipowner candidate/contract workspace
```

На этом этапе следует показать судовладельцу понятную и безопасную employer-facing задачу, когда моряк запрашивает рассмотрение контракта по подходящей вакансии.
