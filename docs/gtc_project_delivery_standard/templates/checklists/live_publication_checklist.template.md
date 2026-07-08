# Live Publication Checklist

- Project: <PROJECT_NAME>
- Public base URL: <PUBLIC_BASE_URL>
- Date: <DATE>

## 1. Pre-Publication

1. Source files are committed or intentionally staged for release.
2. Public source path is known: `<PUBLIC_SOURCE>`.
3. Live root path is known: `<LIVE_ROOT>`.
4. Deploy command is known.
5. Backup/rollback path is known for risky releases.
6. Public documents follow one-canonical-URL rule.

## 2. Validation

Run relevant checks:

```bash
git diff --check
<syntax/test commands>
```

## 3. Deploy

```bash
<deploy command>
```

## 4. Live HTTP Checks

```bash
curl -fsSI <PUBLIC_BASE_URL>/
curl -fsSI <PUBLIC_BASE_URL>/<changed-route>/
curl -fsSL <PUBLIC_BASE_URL>/<changed-route>/ | grep -F "<expected marker>"
```

## 5. Navigation / Hub Checks

```bash
curl -fsSL <PUBLIC_BASE_URL>/<hub-route>/ | grep -F "<changed-route>"
```

## 6. Visual Checks

1. Desktop screenshot reviewed.
2. Mobile screenshot reviewed.
3. Main navigation state correct.
4. Text readable.
5. No overlapping UI.

## 7. Result

| Item | Result |
|---|---|
| Deploy | `<result>` |
| URL | `<result>` |
| Marker | `<result>` |
| Hub/nav link | `<result>` |
| Visual check | `<result>` |
