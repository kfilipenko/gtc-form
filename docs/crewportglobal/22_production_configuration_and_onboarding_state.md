# CrewPortGlobal — Production Configuration and Onboarding State

## Purpose

This document records the current production publication model, nginx routing, onboarding flow state and validation baseline for CrewPortGlobal on GTC1.

It is intended as the team handover and operational reference after the latest Trust Center and onboarding work.

## Current delivery model

### Public source tree

- Project source root: `/var/www/gtc-form/projects/crewportglobal`
- Public site source: `/var/www/gtc-form/projects/crewportglobal/public`
- Internal canonical planning and legal drafts: `/var/www/gtc-form/docs/crewportglobal`
- Live published web root: `/var/www/crewportglobal.com`

### Canonical content model

- Public documents are authored in Markdown as canonical `index.md` files.
- Each public Markdown document now carries structured YAML frontmatter.
- The frontmatter is the source of document metadata such as:
  - `title`
  - `nav_label`
  - `category`
  - `description`
  - `trust_note`
  - `hero_ctas`
  - `summary_cards`
  - `acknowledgements`
  - `related_links`
- Generated HTML is written next to each Markdown file as `index.html`.
- Clean public routes resolve to the generated HTML first, while raw Markdown remains available at `index.md`.

### Generator

- Generator script: `/var/www/gtc-form/projects/crewportglobal/scripts/generate_public_pages.py`
- Python environment: `/var/www/.venv`
- Python packages used by the generator:
  - `markdown`
  - `pyyaml`
- The generator reads frontmatter automatically and no longer depends on a hardcoded document metadata registry.

## Current public pages

### Existing public docs now in frontmatter-driven generation

- `/about/`
- `/how-it-works/`
- `/for-shipowners/`
- `/for-seafarers/`
- `/legal/no-recruitment-fees/`
- `/legal/privacy/`
- `/legal/seafarer-candidate-agreement/`
- `/legal/terms/`
- `/legal/shipowner-service-terms/`
- `/legal/complaints/`

### Newly added Trust Center docs

- `/legal/recruitment-and-matching-policy/`
- `/legal/kyb-policy/`

### New onboarding-related pages

- `/onboarding/seafarer-registration/`
- `/verify/`

## Onboarding flow state

### Seafarer onboarding acceptance page

Path:

- `/var/www/gtc-form/projects/crewportglobal/public/onboarding/seafarer-registration/index.html`

What it does:

- collects seafarer email and password;
- provides password policy hints;
- includes explicit checkbox-based onboarding acknowledgements;
- checks email existence via same-origin `/auth/check_email`;
- creates account via same-origin `/auth/register`;
- stores onboarding acceptance context in localStorage for the browser session;
- redirects to CrewPortGlobal `/verify/?next=https://app.gtstor.com/user/`.

### Verification page

Path:

- `/var/www/gtc-form/projects/crewportglobal/public/verify/index.html`

What it does:

- supports token-based verification via `/auth/verify`;
- supports resend via `/auth/request_email_verification` when email is stored locally;
- allows safe continuation to `https://app.gtstor.com/user/` after verification.

## Production nginx routing

### Live config files

- Active target file: `/etc/nginx/sites-available/crewportglobal.com.conf`
- Active symlink: `/etc/nginx/sites-enabled/crewportglobal.com.conf`
- Repo copy: `/var/www/gtc-form/projects/crewportglobal/deploy/nginx/crewportglobal.com.conf`

### Live server behavior

- HTTP on port 80 redirects to HTTPS.
- HTTPS is served from `/var/www/crewportglobal.com`.
- Clean static routes use `try_files $uri $uri/index.html $uri/index.md $uri/ =404`.
- Raw Markdown requests still resolve with `text/markdown`.
- Security headers enabled:
  - HSTS
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: SAMEORIGIN`

### Same-origin auth proxy

CrewPortGlobal now proxies `/auth/` to the existing auth backend:

- upstream: `http://127.0.0.1:8085`
- proxied path prefix: `/auth/`

This removes the previous browser CORS blocker for registration from `crewportglobal.com` to `app.gtstor.com`.

## Publication workflow

### After any public Markdown change

Run:

```bash
/var/www/.venv/bin/python /var/www/gtc-form/projects/crewportglobal/scripts/generate_public_pages.py
```

Then publish:

```bash
rsync -a /var/www/gtc-form/projects/crewportglobal/public/ /var/www/crewportglobal.com/
```

### After nginx changes

Run:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Important:

- edit the real active target file in `/etc/nginx/sites-available/crewportglobal.com.conf`;
- remember that `/etc/nginx/sites-enabled/crewportglobal.com.conf` is a symlink;
- keep the repo copy aligned after operational changes.

## Validation baseline recorded on 2026-05-10

### Public routes

Validated as `HTTP/2 200` with `content-type: text/html`:

- `/`
- `/legal/seafarer-candidate-agreement/`
- `/legal/recruitment-and-matching-policy/`
- `/legal/kyb-policy/`
- `/onboarding/seafarer-registration/`
- `/verify/`

### Auth proxy

Validated live on `crewportglobal.com`:

- `GET /auth/status` -> `HTTP/2 401`, JSON from Express auth backend
- `POST /auth/check_email` -> `HTTP/2 200`, JSON response

This confirms that CrewPortGlobal can now perform same-origin auth calls needed by the onboarding flow.

## Outstanding follow-up

1. Perform a real browser registration with a disposable mailbox and complete the email verification handoff end-to-end.
2. Decide whether onboarding should submit additional profile fields to a future profile API after auth registration.
3. Confirm the final production complaint, privacy and general contact mailboxes before wider publication.
4. Keep team docs and repo nginx copy synchronized with any live config changes.