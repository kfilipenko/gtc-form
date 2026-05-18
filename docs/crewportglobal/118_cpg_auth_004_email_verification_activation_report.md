# CrewPortGlobal — CPG-AUTH-004 Email Verification And Account Activation Report

- Project: CrewPortGlobal.com
- Issue: #20 — CPG-AUTH-004
- Date: 2026-05-18
- Status: Implemented for Project Owner review

## Purpose

This document records the first password-account e-mail verification slice for CrewPortGlobal.

The implemented model keeps registration, authentication and authorization separate:

```text
Registration = physical person / user record
Authentication = password session plus verified ownership of the e-mail address
Authorization = later role, capability, data visibility and right-to-act decisions
```

## Implemented Scope

Created hash-only account e-mail verification support:

```text
crewportglobal.users.email_verification_status
crewportglobal.email_verification_tokens
```

The raw verification token is never stored in PostgreSQL. The database stores only:

```text
verification_token_hash
```

Added endpoints:

```text
POST /api/v1/auth/email/send-verification
POST /api/v1/auth/email/resend-verification
POST /api/v1/auth/email/verify
```

Updated existing auth endpoints:

```text
POST /api/v1/auth/register-password
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

## Registration Behavior

After password registration:

```text
1. user is created or confirmed;
2. password_hash is stored in user_credentials;
3. session cookie is issued;
4. email_verification_status becomes pending;
5. email_verification_tokens row is created;
6. verification link is sent or prepared through configured safe e-mail delivery;
7. /cabinet/ shows an email verification task until verification succeeds.
```

If e-mail delivery is not configured, registration still succeeds but returns:

```text
email_delivery_status = not_configured
```

The cabinet keeps the verification task open.

## Cabinet And Account Menu

The personal cabinet now shows a first-class task when the session user has not verified e-mail:

```text
Action required: verify your email address
Reason: We need to confirm that this email belongs to you before the account is fully activated.
Action: Resend verification email
```

After successful verification:

```text
email_verified_at is set
email_verification_status = verified
account_activation_status = active
cabinet verification task disappears
account menu shows Verified email
```

Before verification the account menu shows:

```text
Email not verified
```

## E-mail Delivery Boundary

The implementation reuses the existing protected SMTP delivery foundation.

No SMTP secrets were committed.

The production sender remains server-configured through protected environment, for example:

```text
/etc/crewportglobal/admin-access.env
```

Automated tests use capture/test mode only. Raw test tokens are returned only when:

```text
CREWPORTGLOBAL_AUTH_EMAIL_VERIFICATION_TEST_MODE=true
```

## Changed Files

```text
projects/crewportglobal/app/backend/db/migrations/009_create_email_verification_tokens.sql
projects/crewportglobal/app/backend/api/lib/user_email_verification.php
projects/crewportglobal/app/backend/api/lib/user_auth.php
projects/crewportglobal/app/backend/api/public/index.php
projects/crewportglobal/app/backend/api/README.md
projects/crewportglobal/public/assets/crewportglobal-navigation.js
projects/crewportglobal/public/assets/crewportglobal-docs.css
projects/crewportglobal/public/assets/crewportglobal-app.css
projects/crewportglobal/public/assets/crewportglobal-public-i18n.js
projects/crewportglobal/public/register/index.html
projects/crewportglobal/public/register/confirm/index.html
projects/crewportglobal/public/cabinet/index.html
playwright.crewportglobal.config.ts
playwright.crewportglobal.api.config.ts
tests/crewportglobal-auth-email-verification.spec.ts
```

## Verification Performed

```text
php -l projects/crewportglobal/app/backend/api/lib/user_email_verification.php — passed
php -l projects/crewportglobal/app/backend/api/lib/user_auth.php — passed
php -l projects/crewportglobal/app/backend/api/public/index.php — passed
psql -f projects/crewportglobal/app/backend/db/migrations/009_create_email_verification_tokens.sql — passed on local test DB
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-auth-email-verification.spec.ts — 1 passed
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-auth-password-session.spec.ts — 2 passed
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-cabinet-dashboard.spec.ts — 3 passed
npx playwright test -c playwright.crewportglobal.config.ts tests/crewportglobal-navigation-menus.spec.ts — 5 passed
npm run test:cpg-api — 15 passed
node projects/crewportglobal/scripts/check_public_i18n.js — passed with existing non-English fallback warnings
```

## Security Boundaries

Not implemented in this slice:

```text
password reset
phone verification
OAuth
CSRF framework
hard rate-limit enforcement
authorization capability approval
Stripe
OpenClaw
nginx/server configuration
deployment
```

No raw passwords, password hashes, raw session tokens, SMTP secrets or verification token hashes are returned by public API responses.

## Remaining Risks

E-mail delivery depends on protected server environment configuration. If SMTP is disabled or incomplete, accounts stay pending e-mail verification and the cabinet task remains visible.

Password reset should not be implemented until this verified e-mail foundation is approved and available in the target environment.

## Final Recommendation

Proceed to:

```text
CPG-AUTH-005 — Password reset and account recovery
```

only after Project Owner review confirms that the e-mail verification model, migration and cabinet task behavior are acceptable.
