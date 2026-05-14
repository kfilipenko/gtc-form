# CrewPortGlobal — CPG-OPS-016 Operator Access Token Boundary Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-14
- Document type: Implementation report
- Status: Implemented, verified and published to the live site

## 1. Purpose

This report records the temporary operator access boundary added after the `/verify/` page became a practical review console.

The goal is to prevent public access to operator queue data and operator review decisions before the platform has full user login, roles and sessions.

## 2. Implemented Scope

Implemented changes:

1. protected `GET /api/v1/operator/review-queue` with an operator token check;
2. protected `PATCH /api/v1/operator/review-queue/{draft_id}/status` with the same token check;
3. accepted either `X-CPG-Operator-Token` or `Authorization: Bearer ...`;
4. added an operator token prompt to `/verify/`;
5. stored the browser-entered token only in `sessionStorage`;
6. added Playwright test configuration support for local operator tokens;
7. added API coverage for missing or wrong operator tokens;
8. changed the `/verify/` queue renderer from HTML string injection to DOM text nodes for safer display of user-submitted data;
9. added nginx/FPM snippet support so the live token is held outside the repository.

## 3. Runtime Configuration

The backend reads the operator token from:

```bash
CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN
```

Fallback environment variable:

```bash
CPG_OPERATOR_ACCESS_TOKEN
```

For live nginx/FPM publication, the token is passed through:

```text
/etc/nginx/snippets/crewportglobal-operator-access.conf
```

The publish script creates that snippet when it is missing. The secret must not be committed to the repository.

## 4. Safety and Product Boundaries

This is a temporary access boundary, not final platform authentication.

It intentionally does not replace:

1. real operator accounts;
2. password or SSO login;
3. role-based access control;
4. audit attribution to a named operator.

The next security step should be account-based operator authentication with explicit roles.

## 5. Changed Files

Core implementation:

- `projects/crewportglobal/app/backend/api/public/index.php`
- `projects/crewportglobal/public/verify/index.html`
- `projects/crewportglobal/deploy/nginx/crewportglobal.com.conf`
- `projects/crewportglobal/scripts/publish_live_site.sh`

Configuration and tests:

- `playwright.crewportglobal.config.ts`
- `playwright.crewportglobal.api.config.ts`
- `tests/crewportglobal-registration-api.spec.ts`
- `projects/crewportglobal/app/backend/api/README.md`

## 6. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/public/index.php
npm run check:cpg-i18n
npm run test:cpg-api
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts tests/crewportglobal-create-profile-prefill.spec.ts tests/crewportglobal-register-routing.spec.ts tests/crewportglobal-vacancy-board.spec.ts tests/crewportglobal-homepage-live-dashboard.spec.ts
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-operator-queue.spec.ts
git diff --check
```

Additional `/verify/` browser sanity check:

1. open `/verify/` without a session token;
2. confirm the operator access prompt appears without console errors;
3. enter the configured local token;
4. confirm the queue loads;
5. confirm no horizontal overflow on a `390x1000` viewport.

Live checks after publication:

```bash
./projects/crewportglobal/scripts/publish_live_site.sh
curl -k -fsS https://crewportglobal.com/api/v1/health
curl -k -i https://crewportglobal.com/api/v1/operator/review-queue
curl -k -fsS -H "X-CPG-Operator-Token: <token>" https://crewportglobal.com/api/v1/operator/review-queue
curl -k -fsS https://crewportglobal.com/verify/
curl -k -fsS https://crewportglobal.com/api/v1/vacancies
```

Live result:

1. health stays public;
2. operator queue without a token returns `401`;
3. operator queue with the configured token returns `ok: true`;
4. `/verify/` contains the access prompt and structured detail view code;
5. public vacancies return `ok: true` with `count: 0`;
6. live operator queue currently has 10 non-UI review items and 0 active `ui.*@example.com` test items.
