# CPG-BIZ-052 - Коммерческий операционный цикл CrewPortGlobal

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: Project Owner approval to return from page cleanup to ISO/audit-style business-process description
- Version: 1.0
- Date: 2026-05-30
- Status: Documentation implemented for Project Owner review

## 1. Цель этапа

Цель этапа - вернуть работу к управляющему описанию бизнес-процессов и описать полный коммерческий цикл компании.

Причина: на сайте остается много описательных страниц, которые не выполняют функциональную задачу. CrewPortGlobal должен быть не учебным сайтом о crewing, а рабочей платформой:

```text
морякам - работа;
судовладельцам - качественная команда;
GTC INFORMATION TECHNOLOGY FZ-LLC - доказанная B2B-основа для вознаграждения.
```

## 2. Что подготовлено

Создан новый управляющий business-process документ:

```text
docs/crewportglobal/business_processes/15_crewportglobal_commercial_operating_cycle.md
```

Документ получил ID:

```text
BP-015 - Commercial Operating Cycle
```

## 3. Основное содержание BP-015

BP-015 описывает полный круговой цикл:

```text
Marketing
-> Registration
-> Verification
-> Service package / entitlement
-> Employer/vessel/crew request intake
-> Seafarer supply readiness
-> Request-supply matching
-> Shortlist and presentation
-> Employer proceeds with candidate
-> Embarkation confirmation
-> Monthly work/service evidence
-> Billing and revenue attribution
-> Service cycle closure
-> Seafarer follow-up and employer repeat request
-> New marketing / new cycle
```

Главная идея: процесс не заканчивается подбором кандидата. Он замыкается в повторный цикл после посадки моряка, фактической работы на судне, расчета, списания/возвращения моряка и новой потребности судовладельца.

## 4. Коммерческая модель

В документе зафиксирована комбинированная модель:

| Component | Trigger |
|---|---|
| Client onboarding package / subscription | Судовладелец начинает сотрудничество и выбирает пакет услуг. |
| Crew request processing fee | Судовладелец подтверждает `беру / proceed with candidate`. |
| Embarkation success fee | Моряк фактически взошел на борт судна. |
| Monthly actual service fee | Моряк фактически работает на судне в расчетном периоде. |
| Replacement continuity rule | Моряк не отработал срок, требуется срочная замена. |
| Optional services | Payroll cashier, logistics, visa/document support, medical coordination, training, crew rotation and other agreed services. |
| Bundled packages | Несколько услуг из прайса со скидкой не менее 10%. |

Сохранено обязательное ограничение:

```text
Моряк не оплачивает подбор, трудоустройство или доступ к вакансиям.
```

## 5. Evidence и audit basis

BP-015 фиксирует, что каждый этап должен производить доказуемый результат:

1. lead source;
2. registration record;
3. consent and no-fee acknowledgement;
4. company/vessel authority evidence;
5. service package / entitlement;
6. structured crew request;
7. matching explanation;
8. shortlist approval;
9. employer decision;
10. embarkation proof;
11. monthly work/service confirmation;
12. invoice basis;
13. payment/revenue attribution;
14. retention / repeat-sales task.

Это превращает процесс в доказательную базу оказанной услуги.

## 6. Functional site alignment

BP-015 вводит правило:

```text
page -> business stage -> working object -> computed task -> evidence -> next stage
```

Страница должна быть сохранена только если она:

1. приводит к регистрации;
2. создает или изменяет рабочий объект;
3. показывает computed task;
4. показывает безопасные реальные данные платформы;
5. является юридическим или trust-center документом;
6. поддерживает audit/compliance.

Описательные страницы без такой функции должны быть проверены на объединение, перенос или удаление.

## 7. Updated Registers

Обновлены:

```text
docs/crewportglobal/business_processes/00_business_process_register.md
docs/crewportglobal/00_documentation_register.md
```

## 8. Verification

Проверка выполнена как documentation-only:

```bash
rg -n "BP-015|15_crewportglobal_commercial_operating_cycle|246_cpg_biz_052" docs/crewportglobal
```

Result: BP-015 and document 246 are registered and discoverable.

No UI, backend, DB, migration or runtime behavior was changed.

## 9. External Orientation

Для ориентации использованы открытые страницы рынка:

1. Columbia Group - Crew Management: https://columbiagroup.org/service/crew-management/
2. Viking Crew - Management services: https://www.vikingcrew.com/management/
3. ILO - Maritime Labour Convention, 2006: https://www.ilo.org/international-labour-standards/maritime-labour-convention-2006

Они подтверждают общую рыночную логику: коммерческая ценность находится в crew management services, payroll, travel/logistics, documentation, compliance, reporting and continuity, а не в описательных страницах.

## 10. Следующий этап

Следующий этап:

```text
CPG-BIZ-053 - Functional page inventory against BP-015 commercial operating cycle
```

Цель:

1. пройти все страницы из временного полного меню;
2. назначить каждой странице бизнес-этап BP-015;
3. определить keep / merge / replace / move to cabinet / delete;
4. убрать описательную воду;
5. подготовить минимальную функциональную карту сайта;
6. после утверждения Project Owner выполнить изменения в приложении.
