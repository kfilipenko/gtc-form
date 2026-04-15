# Storage Hygiene Remediation Report

- captured_at_utc: 2026-03-10 18:55:02+00
- mode: plan
- status: PASS
- scope: /var/www/gtc-form, /var/www/html
- reason: legacy-cleanup
- matches: 0

## Patterns
- *.bak
- *.bak.*
- *.backup
- *.backup.*
- *.old

## Findings
- No backup-like files found in active roots.
