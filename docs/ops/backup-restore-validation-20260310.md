# Backup and Restore Validation (2026-03-10)

## Objective
Create fresh full-code backups and validate restore workflow safely without touching production files.

## Backup Artifacts
Timestamp: 2026-03-10_190102 (UTC)

1. gtc-core-web:
- /var/www/backups/gtc-core-web/2026-03-10_190102_full-code-backup
- archive: gtc-form_full_2026-03-10_190102.tar.gz

2. payment-web:
- /var/www/backups/payment-web/2026-03-10_190102_full-code-backup
- archive: html_full_2026-03-10_190102.tar.gz

Both backup folders include:
- MANIFEST.txt
- SHA256SUMS.txt
- RESTORE.md

## Integrity Check
Archive checksums were verified with `sha256sum -c`:
- gtc-form_full_2026-03-10_190102.tar.gz: OK
- html_full_2026-03-10_190102.tar.gz: OK

## Restore Validation Method (Safe Sandbox)
Sandbox path:
- /tmp/restore_check_20260310_190220

Steps:
1. Extract both archives into sandbox folders.
2. Compare SHA256 hashes of representative files between production and extracted copies.
3. Simulate restore: mutate a sandbox copy of user/index.html and restore it from backup copy.
4. Re-check hash after simulated restore.

## Validation Results
- MATCH user/index.html = yes
- MATCH shared/chat-service.js = yes
- MATCH html/payment.php = yes
- RESTORE_SIM user/index.html = yes

## Conclusion
- Backup creation succeeded.
- Backup integrity checks succeeded.
- Restore workflow is operational (validated in sandbox).
- No production files were overwritten during validation.
