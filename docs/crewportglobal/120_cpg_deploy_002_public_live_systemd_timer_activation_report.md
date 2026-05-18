# CrewPortGlobal — CPG-DEPLOY-002 Public Live Systemd Timer Activation Report

- Project: CrewPortGlobal.com
- Date: 2026-05-18
- Status: Activated on GTC1
- Scope: automatic public/frontend live synchronization

## Purpose

This document records activation of the working automatic publication model for CrewPortGlobal public files.

The goal is to prevent the earlier failure mode where code was updated in:

```text
/var/www/gtc-form/projects/crewportglobal/public
```

but the live site continued to serve old files from:

```text
/var/www/crewportglobal.com
```

## Activated Model

The server now uses a systemd timer to run the dedicated public deploy script periodically:

```text
projects/crewportglobal/scripts/deploy_public_live.sh
```

The timer publishes the local public source to the live web root.

## Systemd Units

Repository templates:

```text
projects/crewportglobal/deploy/systemd/crewportglobal-public-deploy.service
projects/crewportglobal/deploy/systemd/crewportglobal-public-deploy.timer
```

Installed runtime units:

```text
/etc/systemd/system/crewportglobal-public-deploy.service
/etc/systemd/system/crewportglobal-public-deploy.timer
```

## Schedule

```text
OnBootSec=1min
OnUnitActiveSec=2min
AccuracySec=15s
Persistent=true
```

This means public/frontend changes are picked up automatically on a short interval without requiring a manual rsync step.

## Runtime User

```text
User=kfilipenko
Group=kfilipenko
WorkingDirectory=/var/www/gtc-form
```

## Deploy Environment

```text
ROOT_DIR=/var/www/gtc-form
LIVE_ROOT=/var/www/crewportglobal.com
PUBLIC_BASE_URL=https://crewportglobal.com
CPG_DEPLOY_GIT_PULL=0
CPG_DEPLOY_RUN_I18N_CHECK=1
CPG_DEPLOY_RUN_SMOKE_CHECKS=1
CPG_DEPLOY_DELETE_STALE=1
```

`CPG_DEPLOY_GIT_PULL=0` is intentional for the current server-local development model. The timer publishes the local repository working tree. It does not pull from GitHub automatically and therefore does not block on uncommitted in-progress work.

## Boundaries

The activated timer does not:

```text
apply database migrations
execute psql
change nginx configuration
reload nginx
change backend API routing
touch protected environment files
touch SMTP secrets
touch document storage
touch Stripe
touch OpenClaw
```

It runs only the public/frontend deploy script.

## Operations Commands

Check timer:

```bash
systemctl status crewportglobal-public-deploy.timer
systemctl list-timers crewportglobal-public-deploy.timer
```

Run deploy immediately:

```bash
sudo systemctl start crewportglobal-public-deploy.service
```

View logs:

```bash
journalctl -u crewportglobal-public-deploy.service -n 100 --no-pager
```

Stop automation:

```bash
sudo systemctl disable --now crewportglobal-public-deploy.timer
```

Re-enable automation:

```bash
sudo systemctl enable --now crewportglobal-public-deploy.timer
```

## Verification Performed

Safe checks completed for this activation:

```text
systemd-analyze verify projects/crewportglobal/deploy/systemd/crewportglobal-public-deploy.service projects/crewportglobal/deploy/systemd/crewportglobal-public-deploy.timer — passed
sudo install unit files to /etc/systemd/system — completed
sudo systemctl daemon-reload — completed
sudo systemctl enable --now crewportglobal-public-deploy.timer — completed
sudo systemctl start crewportglobal-public-deploy.service — completed
systemctl is-enabled crewportglobal-public-deploy.timer — enabled
systemctl is-active crewportglobal-public-deploy.timer — active
systemctl list-timers crewportglobal-public-deploy.timer — next run scheduled
journalctl -u crewportglobal-public-deploy.service — service completed with status=0/SUCCESS
automatic timer run at 2026-05-18 10:55:46 UTC — completed with status=0/SUCCESS
https://crewportglobal.com/cabinet/ — HTTP 200
live navigation contains Account / Login — passed
git diff --check — passed
```

## Final Recommendation

Use this systemd timer as the current working publication model.

If later the team wants GitHub push-to-production behavior, create a separate GitHub Actions SSH deploy workflow. That future workflow should call the same public deploy script, rather than introducing a second publication path.
