# <TASK_CODE> - Public Page Publication Report

- Project: <PROJECT_NAME>
- Public URL: <PUBLIC_BASE_URL>/<route>/
- Source task: `<task document path>`
- Document type: Public publication report
- Version: 0.1
- Date: <DATE>
- Status: Published / Draft

## 1. Purpose

<Explain why the public page/document was published.>

## 2. Canonical Public URL

```text
<PUBLIC_BASE_URL>/<route>/
```

## 3. Publication Rule

This page is:

1. canonical full text; or
2. a summary linking to a canonical full text.

If it is a public document, confirm that no duplicate full-text page exists.

## 4. Changed Files

| File | Change |
|---|---|
| `<public file>` | `<change>` |
| `<navigation/hub file>` | `<change>` |

## 5. Verification

```bash
curl -fsSI <PUBLIC_BASE_URL>/<route>/
curl -fsSL <PUBLIC_BASE_URL>/<route>/ | grep -F "<expected marker>"
curl -fsSL <PUBLIC_BASE_URL>/<hub>/ | grep -F "<route>"
```

## 6. Visual Review

| Viewport | Result |
|---|---|
| Desktop | `<result>` |
| Mobile | `<result>` |

## 7. Acceptance Result

The page is accepted when:

1. URL returns 200;
2. expected marker is present;
3. navigation/hub link exists;
4. i18n or page text policy is satisfied;
5. no duplicate public document was created.

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | <DATE> | GTC IT / AI Assistant | Initial public page publication report |
