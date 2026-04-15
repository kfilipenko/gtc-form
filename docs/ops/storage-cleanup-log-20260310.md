# Storage Cleanup Log (2026-03-10)

## Objective
Remove legacy backup artifacts from active web roots and move them into structured backup storage.

## Execution Summary
- Timestamp: 2026-03-10_184503 (UTC)
- Scope:
  - /var/www/gtc-form
  - /var/www/html
- Result: backup-like files removed from active roots and archived under /var/www/backups.

## Backup Targets
- /var/www/backups/gtc-core-web/2026-03-10_184503_legacy-cleanup
- /var/www/backups/payment-web/2026-03-10_184503_legacy-cleanup

## Files Moved
Total: 14 files

From gtc-core-web scope (8):
- gtc-form/apple-touch-icon.png.bak
- gtc-form/chat_api.php.bak.2025-12-05-0620
- gtc-form/chat_api.php.bak.2025-12-05-0758
- gtc-form/index.html.bak.2025-08-28-1250
- gtc-form/index.html.bak.20250927064013
- gtc-form/news/index.html.bak
- gtc-form/news/index.html.bak.2025-09-01-0602
- gtc-form/news/index.html.bak.2025-09-21-221448

From payment-web scope (6):
- html/payment.php.backup
- html/payment.php.backup.20250910_182211
- html/payment.php.backup.multilang
- html/payment.php.bak.2025-10-07_102427
- html/payment.php.bak.2025-12-09_154526
- html/payment.php.bak.2025-12-09_162538

## Integrity and Restore Metadata
Each backup folder contains:
- MANIFEST.txt
- moved_files.txt
- SHA256SUMS.txt
- RESTORE.md

Backup index updated:
- /var/www/backups/BACKUP_INDEX.md

## Verification
Post-cleanup scan for backup-like files in active roots returned no matches for:
- *.bak
- *.bak.*
- *.backup
- *.backup.*
- *.old
