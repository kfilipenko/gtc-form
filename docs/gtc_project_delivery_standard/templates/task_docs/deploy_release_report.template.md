# <TASK_CODE> - Deploy And Release Report

- Project: <PROJECT_NAME>
- Environment: <environment>
- Public base URL: <PUBLIC_BASE_URL>
- Document type: Deploy/release report
- Version: 0.1
- Date: <DATE>
- Status: Completed / Draft

## 1. Purpose

<Explain the release purpose.>

## 2. Release Scope

1. `<change>`;
2. `<change>`.

## 3. Deploy Command

```bash
<deploy command>
```

## 4. Pre-Deploy Checks

```bash
<command>
<command>
```

## 5. Live Smoke Checks

```bash
curl -fsSI <PUBLIC_BASE_URL>/
curl -fsSL <PUBLIC_BASE_URL>/<changed-route>/ | grep -F "<expected marker>"
```

## 6. Rollback

| Item | Value |
|---|---|
| Backup path | `<path>` |
| Rollback command | `<command>` |
| Rollback authority | `<role>` |

## 7. Result

```text
<release result>
```

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | <DATE> | GTC IT / AI Assistant | Initial deploy/release report |
