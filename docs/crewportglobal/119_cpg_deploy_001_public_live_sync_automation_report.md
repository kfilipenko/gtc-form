# CrewPortGlobal — CPG-DEPLOY-001 Public Live Sync Automation Report

- Project: CrewPortGlobal.com
- Date: 2026-05-18
- Status: Implemented for Project Owner review
- Scope: public/frontend publication only

## Purpose

This document records the fix for the publication gap detected after the account menu, cabinet and e-mail verification work.

The problem was not browser cache and not the cabinet code itself. The server serves public HTML, CSS, JavaScript and assets from:

```text
/var/www/crewportglobal.com
```

The repository source of truth is:

```text
/var/www/gtc-form/projects/crewportglobal/public
```

When code changes were committed in the repository but not synchronized to the live root, the domain continued to serve old public files. As a result:

```text
https://crewportglobal.com/assets/crewportglobal-navigation.js
```

still contained the old `Login / Register` navigation item, and:

```text
https://crewportglobal.com/cabinet/
```

returned `404` until the public root was synchronized.

## Implemented Script

Created a dedicated frontend/public deploy script:

```text
projects/crewportglobal/scripts/deploy_public_live.sh
```

The script synchronizes only:

```text
projects/crewportglobal/public/
```

to:

```text
/var/www/crewportglobal.com/
```

## Boundaries

The script does not:

```text
apply database migrations
execute psql
change backend PHP runtime code
change nginx configuration
reload nginx
touch protected environment files
touch SMTP secrets
touch uploaded document storage
touch OpenClaw
touch Stripe/payment configuration
```

This makes the script safe for frequent public/frontend publication.

## Safety Controls

The script includes:

```text
single-run lock with flock
source directory checks
live root safety checks
required index.html check
required shared navigation asset check
optional git pull --ff-only
optional public i18n validator
rsync synchronization
optional stale-file deletion
optional dry run
post-deploy live smoke checks
```

The default synchronization preserves:

```text
.well-known/
```

for certificate challenge files.

## Commands

Manual public deploy:

```bash
cd /var/www/gtc-form
projects/crewportglobal/scripts/deploy_public_live.sh
```

Dry run:

```bash
cd /var/www/gtc-form
projects/crewportglobal/scripts/deploy_public_live.sh --dry-run
```

Pull latest `main` first, then publish:

```bash
cd /var/www/gtc-form
projects/crewportglobal/scripts/deploy_public_live.sh --git-pull
```

Run without deleting stale live files:

```bash
cd /var/www/gtc-form
projects/crewportglobal/scripts/deploy_public_live.sh --no-delete
```

## Environment Variables

```text
ROOT_DIR=/var/www/gtc-form
PUBLIC_SOURCE=projects/crewportglobal/public
LIVE_ROOT=/var/www/crewportglobal.com
PUBLIC_BASE_URL=https://crewportglobal.com
CPG_DEPLOY_GIT_PULL=0
CPG_DEPLOY_RUN_I18N_CHECK=1
CPG_DEPLOY_RUN_SMOKE_CHECKS=1
CPG_DEPLOY_DELETE_STALE=1
CPG_ALLOW_CREATE_LIVE_ROOT=0
```

## Recommended Automatic Trigger

The recommended production-safe approach is to run this script after `main` is updated on GTC1.

### Option A — Server Timer

Create a server-side systemd service that runs:

```bash
/var/www/gtc-form/projects/crewportglobal/scripts/deploy_public_live.sh --git-pull
```

Recommended service draft:

```ini
[Unit]
Description=CrewPortGlobal public live deploy

[Service]
Type=oneshot
User=kfilipenko
WorkingDirectory=/var/www/gtc-form
ExecStart=/var/www/gtc-form/projects/crewportglobal/scripts/deploy_public_live.sh --git-pull
```

Recommended timer draft:

```ini
[Unit]
Description=Run CrewPortGlobal public live deploy periodically

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
Unit=crewportglobal-public-deploy.service

[Install]
WantedBy=timers.target
```

This option keeps secrets out of GitHub and uses the server-local repository.

### Option B — GitHub Actions SSH Deploy

Create a GitHub Actions workflow that connects to GTC1 over SSH after push to `main` and runs:

```bash
cd /var/www/gtc-form
projects/crewportglobal/scripts/deploy_public_live.sh --git-pull
```

This option gives immediate deployment after GitHub updates, but requires SSH deploy key management in GitHub secrets.

## Post-Deploy Checks

The script verifies:

```text
GET /api/v1/health
HEAD /
HEAD /register/
HEAD /cabinet/
assets/crewportglobal-navigation.js contains Account / Login
/register/ contains Create account and open cabinet
```

## Verification Performed

Safe checks completed for this slice:

```text
bash -n projects/crewportglobal/scripts/deploy_public_live.sh — passed
projects/crewportglobal/scripts/deploy_public_live.sh --dry-run — passed
projects/crewportglobal/scripts/deploy_public_live.sh — passed
node projects/crewportglobal/scripts/check_public_i18n.js — passed with existing non-English fallback warnings
curl -fsSI https://crewportglobal.com/cabinet/ — HTTP 200
curl -fsSL https://crewportglobal.com/assets/crewportglobal-navigation.js | grep -F "Account / Login" — passed
git diff --check — passed
```

## Final Recommendation

Use the new public deploy script for every frontend/public change.

Do not use the older broad `publish_live_site.sh` for routine UI publication because it also contains migration and nginx synchronization behavior. That broader script should remain a controlled operations tool, not the default frontend deploy path.

The next operations step should be selecting one automatic trigger:

```text
server-side systemd timer
or
GitHub Actions SSH deploy
```

Until that trigger is enabled, every code publication should end with:

```bash
cd /var/www/gtc-form
projects/crewportglobal/scripts/deploy_public_live.sh
```
