# Storage Hygiene Audit Report

- captured_at_utc: 2026-03-10 18:51:19+00
- status: PASS
- scope: /var/www/gtc-form, /var/www/html
- mode: dry-run (no file move)
- matches: 0

## Patterns
- *.bak
- *.bak.*
- *.backup
- *.backup.*
- *.old

## Findings
- No backup-like files found in active roots.

## Suggested Actions
- No cleanup action required.
