# CrewPortGlobal — Context Handoff and Next Work Plan

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: technical handoff / next-window continuation note
- Status: Active handoff

## 1. Purpose

This document preserves the current implementation state before moving work into a new Codex / VS Code window.

The current conversation context is close to full. A new window should continue from this document and the repository state rather than from memory.

## 2. Current Live State

The live domain is active:

- `https://crewportglobal.com/`
- `https://crewportglobal.com/create-profile/`
- `https://crewportglobal.com/post-vacancy/`
- `https://crewportglobal.com/vacancies/`
- `https://crewportglobal.com/verify/`

Important deployment detail:

- source public app path: `/var/www/gtc-form/projects/crewportglobal/public`
- live nginx root: `/var/www/crewportglobal.com`
- nginx site config: `/etc/nginx/sites-available/crewportglobal.com.conf`
- backend API entrypoint: `/var/www/gtc-form/projects/crewportglobal/app/backend/api/public/index.php`
- API route on live domain: `/api/v1/`

The domain was updated by syncing the public directory to the live root and enabling nginx FastCGI routing for `/api/v1/`.

## 3. Implemented Application Work

Completed implementation areas:

1. action-first public application shell;
2. shared app styling and maritime visual asset;
3. seafarer profile form connected to backend draft API;
4. employer/company/vessel draft flow;
5. vacancy request data model and API support;
6. operator review queue for seafarer profiles, company verification and vacancy requests;
7. reviewed public vacancy API at `GET /api/v1/vacancies`;
8. public vacancy board connected to real reviewed vacancies;
9. homepage live dashboard connected to vacancy API;
10. live publication workflow script.

Key publication script:

```bash
./projects/crewportglobal/scripts/publish_live_site.sh
```

This script syncs current public files into `/var/www/crewportglobal.com`, applies the CrewPortGlobal DB migrations, copies the nginx config and reloads nginx.

## 4. Current Data Safety Notes

Public vacancies must remain honest.

Current expected live API state after test cleanup:

```text
GET https://crewportglobal.com/api/v1/health -> ok
GET https://crewportglobal.com/api/v1/vacancies -> count: 0 unless real reviewed vacancies exist
```

Automated tests now close their own test vacancies after execution so fake test jobs should not remain published on the public board.

## 5. Verification Commands Used

Recent successful checks:

```bash
npm run check:cpg-i18n
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-homepage-live-dashboard.spec.ts tests/crewportglobal-homepage-language.spec.ts tests/crewportglobal-vacancy-board.spec.ts
git diff --check
```

Live checks used:

```bash
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -fsS https://crewportglobal.com/api/v1/vacancies
```

## 6. Important Files

Core frontend:

- `projects/crewportglobal/public/index.html`
- `projects/crewportglobal/public/create-profile/index.html`
- `projects/crewportglobal/public/post-vacancy/index.html`
- `projects/crewportglobal/public/vacancies/index.html`
- `projects/crewportglobal/public/verify/index.html`
- `projects/crewportglobal/public/assets/crewportglobal-app.css`

Core backend:

- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/app/backend/db/migrations/001_create_registration_foundation.sql`
- `projects/crewportglobal/app/backend/db/migrations/002_extend_seafarer_profiles_practical_fields.sql`
- `projects/crewportglobal/app/backend/db/migrations/003_create_vacancy_requests.sql`

Deployment:

- `projects/crewportglobal/deploy/nginx/crewportglobal.com.conf`
- `projects/crewportglobal/scripts/publish_live_site.sh`

Tests:

- `tests/crewportglobal-registration-api.spec.ts`
- `tests/crewportglobal-homepage-live-dashboard.spec.ts`
- `tests/crewportglobal-vacancy-board.spec.ts`
- `tests/crewportglobal-operator-queue.spec.ts`
- `tests/crewportglobal-create-profile-prefill.spec.ts`
- `tests/crewportglobal-homepage-language.spec.ts`

## 7. Recommended Next Work

Next practical tasks:

1. improve the seafarer profile workflow from a single form into a clearer multi-section CV workspace;
2. add document readiness fields for certificates, passport, medical, visas and availability evidence;
3. add employer-side “my vacancy request” review/status view after save;
4. add operator detail views with clearer sections instead of raw JSON only;
5. add basic access boundary for `/verify/` before wider exposure;
6. add seed/manual admin path for creating one real reviewed vacancy when business data is ready;
7. improve mobile layout for dense app screens;
8. keep live publication only through `publish_live_site.sh` or an equivalent controlled deploy step.

## 8. New Window Prompt

Use this prompt in a new Codex / VS Code window:

```text
Продолжаем CrewPortGlobal в /var/www/gtc-form.

Контекст: смотри docs/crewportglobal/70_context_handoff_and_next_work_plan_2026_05_14.md и docs/crewportglobal/69_international_maritime_application_goal_and_task_backlog.md.

Текущий live-домен https://crewportglobal.com уже обслуживается из /var/www/crewportglobal.com, а исходники приложения находятся в /var/www/gtc-form/projects/crewportglobal/public.
API подключен через /api/v1/.

Перед работой:
1. Выполни git status --short --untracked-files=all.
2. Не откатывай изменения пользователя.
3. Если меняешь публичные страницы, после тестов публикуй через ./projects/crewportglobal/scripts/publish_live_site.sh.
4. Проверяй npm run check:cpg-i18n, профильные Playwright-тесты и live API health/vacancies.

Следующая задача: продолжить превращать сайт в удобное международное приложение для моряков и работодателей. Начни с улучшения рабочего сценария профиля моряка или операторской очереди, сохраняя честную публикацию вакансий только после review.
```

## 9. VS Code / Codex Usage Notes

Recommended order:

1. finish a logical slice of work;
2. run tests;
3. publish to live domain only if the slice affects public pages;
4. review `git status`;
5. commit the slice;
6. when context is above roughly 80 percent, create or update a handoff document;
7. open a new Codex chat and paste the new-window prompt from this document.

Do not rely on the full chat history when the context is nearly full. The repository, documentation and test results should become the source of truth.
