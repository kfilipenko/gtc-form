# CPG-BIZ-048 - Упрощение подтверждения договора и обработки персональных данных

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: визуальное замечание Project Owner по блоку `Data processing confirmation`
- Version: 1.0
- Date: 2026-05-29
- Status: Implemented and verified on focused checks

## 1. Цель

Цель этапа - заменить технический блок подтверждений в анкете моряка на понятное пользователю подтверждение присоединения к условиям сервиса и согласия на обработку персональных данных.

До исправления `/create-profile/` показывал несколько служебных полей:

```text
Data processing confirmation
Seafarer obligation date
Seafarer obligation place
Obligation confirmation
Agreement date
Agreement
Source / consent comments
```

Такой вид больше похож на внутреннюю карточку учета, чем на нормальную пользовательскую форму присоединения к условиям сервиса.

## 2. Принятое решение

Пользователь видит одно понятное подтверждение в конце формы:

```text
I have read and agree to the CrewPortGlobal service agreement and consent to processing my personal data for profile verification, matching preparation and communication about platform services.
```

Русская версия:

```text
Я ознакомился и присоединяюсь к договору оказания услуг CrewPortGlobal, а также даю согласие на обработку моих персональных данных для проверки профиля, подготовки подбора и связи по услугам платформы.
```

Рядом с подтверждением размещены ссылки:

```text
/legal/seafarer-candidate-agreement/
/legal/privacy/
```

## 3. Практика оформления

Для пользовательского интерфейса принят clickwrap-подход:

1. подтверждение не прячется в длинном юридическом тексте;
2. пользователь выполняет явное действие checkbox;
3. формулировка написана простым языком;
4. условия сервиса и политика конфиденциальности доступны по ссылкам;
5. подтверждение находится в конце формы перед сохранением/проверкой.

Такой подход согласован с общим принципом: согласие должно быть явным, понятным и подтверждаемым действием пользователя.

Практика сверена с открытыми источниками по оформлению согласия:

1. GDPR Article 7 требует, чтобы запрос согласия был представлен в понятной, доступной и ясно отличимой форме.
2. ICO guidance по valid consent указывает, что согласие должно быть specific, informed и подтверждаться clear affirmative action; предварительно отмеченные поля или бездействие не подходят.

Ссылки для контрольной проверки:

```text
https://gdpr-info.eu/art-7-gdpr/
https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/what-is-valid-consent/
```

## 4. Реализация

Измененная страница:

```text
/create-profile/
```

Изменения:

1. Блок `Data processing confirmation` удален из раздела `Matching publication request`.
2. Раздел `Publication` оставлен только для запроса matching после проверки.
3. Добавлен отдельный финальный раздел:

```text
Agreement and consent
```

4. `S-11.1` теперь ведет к:

```text
/create-profile/#profile-section-consent
```

5. Внутренние поля совместимости сохранены скрыто, чтобы не ломать текущий backend contract:

```text
matching_publication.data_processing_confirmation
consent_details.obligation_date
consent_details.obligation_confirmation
consent_details.agreement_date
consent_details.agreement_value
```

6. При активном checkbox система сохраняет:

```text
data_processing_confirmation = i_confirm
obligation_confirmation = i_confirm
agreement_value = i_agree
agreement_date = current date, если дата еще не была записана
```

## 5. Измененные файлы

| File | Change |
|---|---|
| `projects/crewportglobal/public/create-profile/index.html` | Заменен служебный блок согласия на один checkbox с текстом присоединения к договору и согласия на обработку персональных данных; добавлены EN/RU тексты и ссылки на legal pages. |
| `projects/crewportglobal/app/backend/api/lib/questionnaire_schema.php` | `S-11.1` переадресован на новый финальный consent section. |
| `tests/crewportglobal-seafarer-workspace-form.spec.ts` | Обновлен тест с `selectOption` на checkbox confirmation. |
| `tests/crewportglobal-seafarer-excel-aligned-cards.spec.ts` | Обновлен тест под новую модель: пользователь подтверждает один checkbox, compatibility fields заполняются системой. |
| `docs/crewportglobal/00_documentation_register.md` | Добавлена регистрация документа 242. |
| `docs/crewportglobal/242_cpg_biz_048_seafarer_agreement_consent_confirmation_report.md` | Добавлен настоящий отчет. |

## 6. Контрольные границы

Этот этап не меняет:

1. базу данных;
2. миграции;
3. модель consent events;
4. approval guard;
5. employer-facing visibility;
6. matching scoring;
7. employment decision logic.

## 7. Проверка

Выполнены проверки:

```bash
php -l projects/crewportglobal/app/backend/api/lib/questionnaire_schema.php
```

Result: passed.

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

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-workspace-form.spec.ts tests/crewportglobal-seafarer-excel-aligned-cards.spec.ts
```

Result: 4 passed.

The focused tests confirm:

1. One checkbox confirmation is stored as `i_confirm`.
2. Hidden compatibility fields are populated by the system.
3. Reload from saved draft preserves the confirmation state.
4. Existing seafarer workspace persistence remains intact.
5. Catalog-backed fields continue to use select/catalog controls in tests.

## 8. Следующий этап

После визуального подтверждения следует проверить, нужен ли аналогичный финальный clickwrap-блок в `/post-vacancy/` для судовладельца:

```text
I have read and agree to the Shipowner Service Agreement and confirm that I am authorized to submit company, vessel and crew-request data.
```

Этот следующий этап должен сохранить тот же принцип: одно понятное подтверждение в конце формы, ссылки на договор и политику, скрытая совместимость с backend contract без лишних служебных полей в UI.
