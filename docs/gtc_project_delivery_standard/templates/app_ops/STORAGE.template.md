# STORAGE: <APP_NAME>

## Active Storage

| Item | Path |
|---|---|
| Code root | `<SOURCE_ROOT>` |
| Public source | `<PUBLIC_SOURCE>` |
| Live root | `<LIVE_ROOT>` |
| Runtime data | `<path>` |
| Logs | `<path>` |

## Runtime / Generated Artifacts

| Artifact | Path | Retention |
|---|---|---|
| Test reports | `<path>` | `<retention>` |
| Uploads / runtime files | `<path>` | `<retention>` |

## Backup Policy

Backups go to:

```text
/var/www/backups/<APP_NAME>/<YYYY-MM-DD_HHMMSS>_<reason>/
```

Required files in each backup folder:

1. `MANIFEST.txt`;
2. `SHA256SUMS.txt`;
3. `RESTORE.md`.

## Hygiene Rules

1. No `.bak`, `.backup`, `.old` files inside active roots.
2. Runtime-generated outputs should not be written to app code folders unless explicitly required.
3. Secrets stay in host-managed config/environment, not in repository or public root.
4. Temporary diagnostics should be cleaned or expire under the retention policy.

## Governance

| Field | Value |
|---|---|
| Backup create permission | `<role/team>` |
| Production restore permission | `<role/team>` |
| Retention accountability | `<role/team>` |
| Restore drill cadence | `<cadence>` |
| Evidence location | `<docs path>` |
