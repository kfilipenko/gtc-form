# Storage Architecture Standard

Updated: 2026-04-04
Scope: filesystem organization, naming, backup hygiene, and documentation contracts.

## Goals
- Remove ambiguity around where application code, generated files, and backups live.
- Prevent runtime incidents caused by mixed legacy files in active roots.
- Make restore and audit operations deterministic.

## Canonical Layout

Target layout for this host:

```text
/var/www/
  apps/
    gtc-core-web/
      current/
      releases/
      shared/
    rjaka-web/
      current/
      releases/
      shared/
    payment-web/
      current/
      releases/
  data/
    appname/
      runtime/
      exports/
  backups/
    appname/
      YYYY/
      YYYY-MM/
  logs/
    appname/
  docs/
    inventory/
```

Current state is transitional:
- /var/www/gtc-form acts as a combined app root.
- /var/www/html acts as payment root.
- /var/www/backups stores cross-app snapshots.

## Rules for Active App Roots

1. Active roots must not keep loose backup files (for example *.bak, *.backup, *.old).
2. Legacy snapshots must be moved to /var/www/backups/<app>/<date>/.
3. Active roots should contain only deployable artifacts, not one-off operation dumps.
4. Runtime-generated outputs must not be written to app code folders unless explicitly required.
5. Secret-bearing runtime configuration must stay in host-managed config outside app roots. For payment-web, `payment_tg.php` depends on PHP-FPM pool env wiring for `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, and `STRIPE_SECRET_KEY`.

## Rules for Backups

1. Backup folder naming:
   - /var/www/backups/<app>/<YYYY-MM-DD_HHMMSS>_<reason>/
2. Mandatory files inside each backup folder:
   - MANIFEST.txt (what is included)
   - SHA256SUMS.txt (integrity)
   - RESTORE.md (exact restore commands)
3. Keep a top-level immutable index:
   - /var/www/backups/BACKUP_INDEX.md
4. Restore tests should be recorded at least monthly for critical apps.

## Documentation Contract (Must Have)

Every deployed app must provide:
1. APP.md (purpose, owners, environments, entrypoints)
2. DEPLOY.md (deploy/rollback procedure)
3. STORAGE.md (data paths, temp paths, retention)
4. RUNBOOK.md (common incidents + diagnosis)

Recommended locations:
- docs/apps/<app>/APP.md
- docs/apps/<app>/DEPLOY.md
- docs/apps/<app>/STORAGE.md
- docs/apps/<app>/RUNBOOK.md

## File Naming Policy

1. Backups: YYYY-MM-DD_HHMMSS suffix (UTC preferred).
2. Temporary diagnostics: tmp_<task>_<timestamp> and auto-clean within 7 days.
3. Reports and migration logs: operation-<topic>-<YYYYMMDD>.md.
4. Do not use spaces in operational filenames.

## Retention Baseline

| Artifact | Retention |
|---|---|
| Full app backups | 90 days |
| Incremental/quick snapshots | 30 days |
| Runtime diagnostics | 14 days |
| Test reports | 14 days |

## Immediate Actions for Current Repo

1. Keep /var/www/gtc-form as canonical root for now (no risky move during business hours).
2. Continue moving legacy *.bak* from active folders into /var/www/backups.
3. Add app-level docs under docs/apps/ (gtc-core-web, rjaka-web, payment-web).
4. Maintain domain/app mapping in docs/ops/server-applications-registry.md.
5. Before any root restructure (/var/www/apps/*), run dry-run plan and rollback checklist.
6. Run weekly checklist: docs/ops/storage-weekly-audit-checklist.md.
7. Run dry-run audit script: bash scripts/storage_hygiene_audit.sh.
8. Build remediation plan: bash scripts/storage_hygiene_remediate.sh --mode plan.
9. Execute remediation only with explicit token: bash scripts/storage_hygiene_remediate.sh --mode execute --confirm I_UNDERSTAND_STORAGE_MOVE.
10. Keep app docs aligned with governance standard: docs/ops/governance-standard.md.

## Safety Gate Before Structural Moves

Before moving or renaming app roots:
1. nginx -t must pass against staged configs.
2. Full snapshot of both source and target roots must exist.
3. Smoke checks must validate at least: /, /user/, /chat/, /auth/status, /payment_tg.php, /payment.php.
4. If payment_tg.php behavior changed, verify the required PHP-FPM env wiring before concluding the smoke check.
5. Rollback command must be prepared and tested in dry run.
