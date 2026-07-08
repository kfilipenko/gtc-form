# RUNBOOK: <APP_NAME>

## Common Checks

1. Check nginx config:

```bash
nginx -t
```

2. Check public URL:

```bash
curl -fsSI <PUBLIC_BASE_URL>/
```

3. Check app health:

```bash
<health check command>
```

## Typical Incident Patterns

| Symptom | Likely cause | First check |
|---|---|---|
| `<symptom>` | `<cause>` | `<check>` |

## Escalation Data To Capture

1. exact failing URL;
2. HTTP status;
3. browser console errors if frontend;
4. last 100 lines of relevant logs;
5. recent deployment/commit;
6. affected user/account/object if applicable.

## Restore / Rollback

1. Identify backup snapshot.
2. Confirm rollback authority.
3. Run rollback command.
4. Run smoke checks.
5. Record incident/rollback report.

## Governance

| Field | Value |
|---|---|
| Escalation owner | `<role/team>` |
| Incident severity target | `<target>` |
| Restore drill policy | `<policy>` |
| Drill evidence | `<docs path>` |
