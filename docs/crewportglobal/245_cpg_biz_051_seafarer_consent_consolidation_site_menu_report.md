# CPG-BIZ-051 - Консолидация consent flow моряка и черновое сквозное меню сайта

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner instruction to consolidate seafarer consent into `/create-profile/`, retire duplicate onboarding route and expose all active portal pages through a role-grouped navigation menu
- Version: 1.1
- Date: 2026-05-30
- Status: Implemented and verified locally; visible full-site menu correction applied

## 1. Цель

Цель этапа - убрать дублирующий экран согласий моряка и оставить один юридически и операционно понятный финальный блок подтверждения в анкете:

```text
/create-profile/#profile-section-consent
```

Подтверждение теперь связано с конкретными данными и документами, которые моряк внес в анкету. Это лучше для пользователя и чище для последующей проверки: команда видит, что согласие относится именно к сохраненному профилю, документам и подготовке matching.

Вторая цель этапа - добавить на страницы портала черновое общее меню всех пользовательских и командных страниц, сгруппированное по ролям. Это нужно для полного визуального обхода сайта, выявления лишних страниц и подготовки финальной карты навигации.

## 2. Что изменено в consent flow

В `/create-profile/` расширен финальный блок `Agreement and consent`.

Пользователь видит одно понятное подтверждение, что он:

1. присоединяется к договору оказания услуг CrewPortGlobal;
2. дает согласие на обработку персональных данных;
3. подтверждает достоверность данных и документов;
4. понимает правило отсутствия платы с моряка за трудоустройство;
5. понимает, что дополнительные платные услуги не являются условием доступа к работе;
6. соглашается с Privacy Policy и Complaint Handling Procedure.

В форме оставлен один checkbox. Моряк не должен проходить два отдельных consent-экрана.

## 3. Structured Backend Consent Flags

Backend больше не ограничивается одним мутным текстовым подтверждением.

В `consent_details` сохраняются структурированные признаки:

| Field | Meaning |
|---|---|
| `agreement_confirmed` | Пользователь присоединился к договору оказания услуг. |
| `personal_data_consent` | Пользователь дал согласие на обработку персональных данных. |
| `no_fee_acknowledged` | Пользователь подтвердил понимание no-fee rule для моряков. |
| `optional_services_acknowledged` | Пользователь понял, что дополнительные платные услуги не являются условием доступа к работе. |
| `data_accuracy_confirmed` | Пользователь подтвердил достоверность данных и документов. |
| `complaint_policy_acknowledged` | Пользователь согласился с Complaint Handling Procedure. |
| `consent_bundle_version` | Версия пакета финального подтверждения. |

Для обратной совместимости сохранена поддержка:

```text
matching_publication.data_processing_confirmation = i_confirm
consent_details.obligation_confirmation = i_confirm
consent_details.agreement_value = i_agree
```

Проверка completeness `S-11.1` принимает старые сохраненные профили, но для новых структурированных профилей требует все шесть флагов.

## 4. Retired Onboarding Route

Страница:

```text
/onboarding/seafarer-registration/
```

удалена из активного пользовательского маршрута.

Ссылки на нее убраны из public navigation и тестов. Документ 244 остается исторической записью о предыдущем временном решении, но активный процесс теперь определен настоящим документом:

```text
/create-profile/ -> Agreement and consent -> Save / confirm data -> Submit to operator review
```

Это устраняет двойное подтверждение и снижает раздражение пользователя при заполнении большой анкеты.

## 5. Role-Grouped Site Menu

В общий navigation helper добавлено черновое меню всех страниц портала.

Меню сгруппировано по ролям и зонам работы:

| Group | Pages |
|---|---|
| Home | `/`, `/about/`, `/how-it-works/`, `/language.html` |
| For Seafarers | `/for-seafarers/`, `/create-profile/`, `/vacancies/`, `/vacancies/detail/` |
| For Employers | `/for-shipowners/`, `/post-vacancy/` |
| Documents | `/legal/terms/`, `/legal/privacy/`, `/legal/no-recruitment-fees/`, `/legal/seafarer-candidate-agreement/`, `/legal/shipowner-service-terms/`, `/legal/recruitment-and-matching-policy/`, `/legal/verification-policy/`, `/legal/complaints/` |
| Team | `/team/`, `/team/documents/`, `/team/matching/`, `/team/registry/`, `/team/shortlists/`, `/verify/`, `/admin/access/` |
| Registration / Cabinet | `/register/`, `/register/authorization/`, `/register/authorization/selected/`, `/register/authorization/seafarer-specialist/`, `/register/authorization/buyer-employer/`, `/register/confirm/`, `/register/next/`, `/cabinet/` |

Это меню является черновым рабочим инструментом для аудита сайта. После полного обхода страниц оно должно быть сокращено до финальной пользовательской навигации.

После визуальной проверки Project Owner меню было уточнено: пункты больше не скрыты внутри dropdown-групп. Все группы меню выводятся открытым блоком-картой сайта в верхней навигационной зоне, чтобы Project Owner мог видеть полный перечень страниц без поиска по вторичным ссылкам.

## 6. Shared Navigation Coverage

Проверено, что все public HTML routes в `projects/crewportglobal/public` имеют mount point:

```text
data-cpg-navigation
```

Страницы команды и admin/cabinet, у которых раньше не было общей навигации, подключены к shared navigation helper.

Для исключения устаревшего кэша все public HTML pages получили versioned asset references:

```text
crewportglobal-docs.css?v=20260530-menu-audit
crewportglobal-navigation.js?v=20260530-menu-audit
crewportglobal-public-i18n.js?v=20260530-menu-audit
```

## 7. Измененные файлы

| File | Change |
|---|---|
| `projects/crewportglobal/public/create-profile/index.html` | Расширен финальный consent checkbox; добавлены structured consent flags; CTA больше не ведет на retired onboarding route. |
| `projects/crewportglobal/app/backend/api/public/index.php` | Добавлена нормализация boolean flags и проверка структурированного consent в `S-11.1`. |
| `projects/crewportglobal/public/assets/crewportglobal-navigation.js` | Добавлено роль-группированное черновое меню всех страниц портала; после визуального замечания Project Owner меню переведено из dropdown в открытый visible site-map block. |
| `projects/crewportglobal/public/assets/crewportglobal-public-i18n.js` | Добавлены EN/RU/PT ключи для новых групп и пунктов меню. |
| `projects/crewportglobal/public/assets/crewportglobal-docs.css` | Добавлены стили для открытого role-grouped site-map menu. |
| `projects/crewportglobal/public/onboarding/seafarer-registration/index.html` | Удалена retired page из активного маршрута. |
| `projects/crewportglobal/public/team/index.html` and team subpages | Подключена shared navigation. |
| `projects/crewportglobal/public/admin/access/index.html` | Подключена shared navigation. |
| `projects/crewportglobal/public/cabinet/index.html` | Подключена shared navigation. |
| `projects/crewportglobal/scripts/check_public_i18n.js` | Удален retired onboarding route из обязательной i18n-проверки. |
| `tests/crewportglobal-homepage-language.spec.ts` | Обновлены проверки под новое меню и retired onboarding route. |
| `tests/crewportglobal-seafarer-excel-aligned-cards.spec.ts` | Добавлена проверка structured consent flags. |
| `projects/crewportglobal/README.md` | Зафиксирован новый маршрут финального подтверждения моряка. |

## 8. Verification

### 8.1 Backend syntax

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
```

Result: passed.

### 8.2 Frontend module syntax

```bash
node --check projects/crewportglobal/public/assets/crewportglobal-navigation.js
node --check projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
```

Result: passed.

### 8.3 Public i18n route scan

```bash
node projects/crewportglobal/scripts/check_public_i18n.js
```

Result: checked 33 public HTML files and 987 unique i18n keys.

### 8.4 Inline JavaScript syntax

Checked inline scripts on:

```text
/create-profile/
/cabinet/
/team/
/team/documents/
/team/matching/
/team/registry/
/team/shortlists/
/admin/access/
```

Result: passed.

### 8.5 Focused Playwright checks

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-language.spec.ts
```

Result: 10 passed.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-seafarer-excel-aligned-cards.spec.ts
```

Result: 1 passed.

```bash
npx playwright test -c playwright.crewportglobal.api.config.ts tests/crewportglobal-registration-api.spec.ts -g "questionnaire completeness"
```

Result: 2 passed.

```bash
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts
```

Result: 8 passed.

The navigation suite confirms that the top navigation exposes the full site menu and that the listed routes can be opened from the menu model.

## 9. Remaining Controlled Notes

1. Документ 244 остается исторической записью предыдущего решения, но его route больше не является активным маршрутом моряка.
2. Новое меню намеренно показывает все страницы, включая командные и admin routes, чтобы Project Owner мог пройти по порталу и определить лишние страницы.
3. После утверждения финальной структуры меню нужно будет сократить внешний public menu до понятной навигации без служебных страниц.
4. Если потребуется мягкая совместимость для старых внешних ссылок, можно позже добавить короткий redirect/support page вместо deleted route. Сейчас route исключен из обязательного маршрута.
5. На время аудита меню отображается открыто, а не dropdown-списком, потому что задача этапа - обнаружить все страницы и убрать скрытую навигацию.

## 10. Следующий этап

Следующий этап:

```text
CPG-BIZ-052 - Full portal page audit through role-grouped site menu
```

Цель следующего этапа:

1. последовательно открыть все страницы из нового меню;
2. определить назначение каждой страницы;
3. отметить лишние, дублирующие или устаревшие страницы;
4. подготовить финальную карту сайта;
5. после утверждения Project Owner убрать лишние маршруты и оставить минимальный понятный сайт.
