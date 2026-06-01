# CPG-BIZ-060 - Home Conversion Rebuild And Role Registration Task

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Execution task for Project Owner approval
- Source request: Project Owner approval to rebuild homepage as a conversion page after CPG-BIZ-059
- Version: 1.0
- Date: 2026-06-01
- Status: Approved by Project Owner; implemented in document 255

## 1. Purpose

This task defines the next controlled rebuild of the CrewPortGlobal public homepage and first registration route.

The goal is to turn the homepage from an operational explanation page into a conversion page for two primary audiences:

1. seafarers who want contracts without recruitment fees;
2. shipowners, ship managers and maritime employers who need verified crew candidates.

This task did not authorize code, DB migration or runtime changes until Project Owner approved execution.

Project Owner approval was received on 2026-06-01, and implementation is recorded in:

```text
docs/crewportglobal/255_cpg_biz_060_home_conversion_rebuild_report.md
```

## 2. Business Problem

The current homepage still reduces conversion because:

1. the first screen speaks about process instead of user result;
2. zero values and empty vacancy states can demotivate new users;
3. legal and operational language appears before the user understands the benefit;
4. too many links compete for attention;
5. registration feels like bureaucracy before value;
6. the page does not clearly split the journey for seafarers and employers.

The homepage must sell the practical result:

```text
Seafarers find contracts faster.
Employers receive structured crew requests and reviewed candidate supply.
```

## 3. Approved Conversion Principle

The first public screen must answer three questions in seconds:

1. Who is this for?
2. What result do I get?
3. What should I click now?

The first screen must not explain the whole workflow, legal model or internal review process.

## 4. Required First-Screen Scenarios

The homepage must show two clear entry routes:

| Audience | Primary CTA | Expected route |
|---|---|---|
| Seafarer | `Create profile in 2 minutes` / `Создать профиль за 2 минуты` | Registration as platform participant, then seafarer profile route |
| Shipowner / Employer | `Post crew request in 3 minutes` / `Разместить заявку за 3 минуты` | Registration as platform participant, then employer/company/vessel/request route |

The current registration page for a physical person must be renamed conceptually from:

```text
registration of physical person
```

to:

```text
Platform participant
Участник платформы
```

After the participant account is created, the system must route the user according to selected platform role:

1. seafarer -> `/create-profile/`;
2. employer / shipowner / ship manager -> `/post-vacancy/` or the controlled employer onboarding route if one is available;
3. unclear role -> role selection step before profile/request data collection.

## 5. Offer Copy Direction

### 5.1 Seafarer offer

Recommended wording:

```text
Find a contract faster: create a seafarer profile in 2 minutes, with no recruitment fees.
```

Russian:

```text
Найдите контракт быстрее: профиль моряка за 2 минуты, без рекрутинговых сборов.
```

### 5.2 Employer offer

Recommended wording:

```text
Close crew needs predictably: structured requests and reviewed candidates in one process.
```

Russian:

```text
Закрывайте экипаж предсказуемо: структурированная заявка и проверенные кандидаты в одном процессе.
```

### 5.3 Universal subheading

Do not depend on the product name, because the brand may change.

Recommended wording:

```text
The platform connects seafarers and maritime employers through a transparent, verifiable workflow without unnecessary bureaucracy at the start.
```

Russian:

```text
Платформа соединяет моряков и судовладельцев через прозрачный проверяемый процесс без лишней бюрократии на старте.
```

## 6. First-Screen Content Rules

The first screen must:

1. hide zero counters if values are zero or not conversion-positive;
2. not show `No public vacancies yet` in the first screen;
3. avoid legal/operational explanations before the user chooses a path;
4. show one dominant CTA per audience path;
5. use short commercial language;
6. keep registration links visible and role-specific;
7. avoid broad lists of every possible page.

## 7. Trust Block

Immediately below the offer or CTA area, show a compact trust block.

Approved trust points:

1. no recruitment fees for seafarers;
2. employer and data review;
3. transparent process and team support.

The trust block must be compact. It must not become a legal explanation.

Example:

```text
No seafarer fees
Reviewed employer data
Transparent support process
```

Russian:

```text
Без комиссий для моряков
Проверка работодателей и данных
Прозрачный процесс и поддержка
```

## 8. Social Proof Requirements

The homepage must prepare space for social proof.

### 8.1 Partner companies

Add a section:

```text
Our Partners
Наши партнеры
```

Behavior:

1. title is visible;
2. partner list opens on click or controlled expand;
3. each partner may show company name and logo;
4. publication must be controlled by an internal flag, not automatic for every registered company;
5. partner logos may be demo data until real permission is obtained.

### 8.2 Employer logo support

Future data model must allow employer/company registration to store a logo.

Required future capability:

```text
employer_company_logo
partner_publication_allowed
partner_display_name
partner_display_order
```

The implementation agent must first inspect current DB and upload standards before proposing a SQL patch.

No DB change is approved by this task alone.

### 8.3 Short stories and testimonials

Add a future section for short stories:

1. seafarer story;
2. shipowner/employer story;
3. operations/support story if useful.

The first implementation may use demo stories clearly marked as demo/internal preview if real testimonials are not approved yet.

The eventual public version must not publish personal data or company endorsement without permission.

## 9. Conversion Metrics

The implementation must prepare measurement points for:

1. homepage -> CTA click;
2. CTA click -> registration start;
3. registration start -> step 1 completed;
4. step 1 completed -> full registration completed;
5. role split: seafarer vs employer.

The task does not require full analytics implementation if no analytics standard exists yet.

If no existing analytics/event standard exists, the implementation agent must first document or create a reusable implemented-code standard before adding event tracking.

## 10. Non-Scope

This task does not authorize:

1. direct production DB migration;
2. employer logo DB changes without SQL patch review;
3. public publication of real partner names without approval;
4. public publication of real testimonials without approval;
5. automatic matching decisions;
6. automatic employment decisions;
7. removal of legal documents;
8. hidden bypass of required consent or review gates.

## 11. Required Implementation Sequence After Approval

After Project Owner approves this task, the agent must proceed in this order:

1. inspect current homepage, registration route and role-selection logic;
2. inspect current employer/company upload standards for possible logo reuse;
3. prepare a concrete UI/content implementation plan for the homepage;
4. update homepage first screen to two primary routes;
5. rename the physical-person registration concept to `Platform participant`;
6. implement role-based redirect after participant registration;
7. hide zero/empty-state counters from the first screen;
8. add compact trust block;
9. add partner/social-proof placeholder section using safe demo data or controlled live data;
10. add tests for route CTAs, language, responsive layout and no misleading zero-first-screen state;
11. write an implementation report in Russian.

## 12. Acceptance Criteria

The task is complete only when:

1. homepage first screen has separate seafarer and employer scenarios;
2. each scenario has one clear primary CTA;
3. the physical-person registration wording is replaced by platform participant wording;
4. role-based redirect is implemented or explicitly blocked with a documented reason;
5. zero counters and empty vacancy states do not dominate the first screen;
6. trust block is compact and visible;
7. partner/social-proof section is prepared with controlled publication rules;
8. no legal or internal process text dominates the first screen;
9. tests pass;
10. documentation register is updated;
11. final report is written in Russian and states the next stage.

## 13. Approval Gate

Project Owner approval was received on 2026-06-01 before execution.

The implementation report was prepared as:

```text
255_cpg_biz_060_home_conversion_rebuild_report.md
```

The implementation report must include:

1. changed pages;
2. changed routes;
3. registration redirect behavior;
4. social-proof data handling;
5. verification results;
6. next recommended stage.
