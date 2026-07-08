# DEPLOY: <APP_NAME>

## Standard Deploy

1. Confirm task/release scope.
2. Prepare backup snapshot under `/var/www/backups/<APP_NAME>/<timestamp>_<reason>/`.
3. Run pre-deploy checks.
4. Run deploy command.
5. Run live smoke checks.
6. Record result in implementation/deploy report.

## Deploy Command

```bash
<deploy command>
```

## Pre-Deploy Checks

```bash
<check command>
<check command>
```

## Live Smoke Checks

```bash
curl -fsSI <PUBLIC_BASE_URL>/
curl -fsSL <PUBLIC_BASE_URL>/<route>/ | grep -F "<expected marker>"
```

## Rollback

1. Restore files from backup snapshot.
2. Validate configuration.
3. Reload/restart only required services.
4. Repeat smoke checks.
5. Record rollback result.

Rollback command:

```bash
<rollback command>
```

## Notes

1. Do not store `.bak`, `.backup`, `.old` files in active root.
2. Do not deploy secrets into public roots.
3. Route-level changes must update the project publication model.

## Governance

| Field | Value |
|---|---|
| Deployment approval role | `<role>` |
| Rollback authority | `<role>` |
| Mandatory pre-deploy gate | `<checks>` |
| Post-deploy evidence location | `<docs path>` |
