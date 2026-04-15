# Storage Weekly Audit Checklist

Updated: 2026-03-10
Cadence: weekly (recommended every Monday)
Owner: server ops team

## Objective
Keep active web roots clean and prevent regressions in file storage hygiene.

## Scope
- /var/www/gtc-form
- /var/www/html
- /var/www/backups

## Checklist

1. Run dry-run storage audit script:
- bash scripts/storage_hygiene_audit.sh

2. Verify no backup-like files in active roots:
- Patterns: *.bak, *.bak.*, *.backup, *.backup.*, *.old
- Expected: zero matches

3. Verify backup index is up to date:
- File: /var/www/backups/BACKUP_INDEX.md
- Any cleanup/migration operation must append an entry.

4. Verify latest backup packages include required metadata:
- MANIFEST.txt
- SHA256SUMS.txt
- RESTORE.md

5. Validate naming policy for new backup folders:
- /var/www/backups/<app>/<YYYY-MM-DD_HHMMSS>_<reason>/

6. Verify runtime report was generated:
- docs/runtime/storage-hygiene-audit-<timestamp>.md

7. If violations found, execute controlled cleanup:
- Prepare backup destination first.
- Move files out of active roots.
- Update BACKUP_INDEX.md.
- Add execution log in docs/ops/.

8. Use remediation script for controlled actions:
- Plan only: bash scripts/storage_hygiene_remediate.sh --mode plan
- Execute (requires explicit confirmation token):
- bash scripts/storage_hygiene_remediate.sh --mode execute --confirm I_UNDERSTAND_STORAGE_MOVE --reason weekly-cleanup

## Expected Outcome
- Active roots remain deployment-only.
- Backups are structured and restorable.
- Cleanup operations are fully auditable.
