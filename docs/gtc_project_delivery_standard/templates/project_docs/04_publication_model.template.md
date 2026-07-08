# <PROJECT_NAME> - Publication Model

- Project: <PROJECT_NAME>
- Public base URL: <PUBLIC_BASE_URL>
- Version: 0.1
- Date: <DATE>
- Status: Draft

## 1. Purpose

Define how `<PROJECT_NAME>` publishes public pages, documents, standards, policies and live application routes.

## 2. Public Source And Live Root

```text
source: <PUBLIC_SOURCE>
live:   <LIVE_ROOT>
base:   <PUBLIC_BASE_URL>
```

## 3. Public Page Types

| Page type | Route pattern | Publication rule |
|---|---|---|
| Home/application entry | `/` | Action-first public entry. |
| Participant landing | `/<participant>/` | Explains role and links to real actions. |
| Application workspace | `/<workspace>/` | Opens executable work or controlled blocker. |
| Documents/legal hub | `/legal/` or equivalent | Canonical public document section. |
| Public document | `/legal/<document>/` | One full public text per canonical URL. |

## 4. One Public Document Rule

Each public contract, policy, standard or operating condition has one canonical public URL.

Other pages may show:

1. short summary;
2. status/version;
3. link to canonical document.

Other pages must not duplicate full public text.

## 5. Documents Hub

The documents hub should include:

1. project terms;
2. privacy policy;
3. role agreements;
4. no-fee / protection policies if applicable;
5. complaint/contact procedure;
6. operating standards relevant to participants.

## 6. Deploy Path

Approved deploy command:

```bash
<deploy command>
```

## 7. Live Smoke Checks

Minimum checks:

```bash
curl -fsSI <PUBLIC_BASE_URL>/
curl -fsSL <PUBLIC_BASE_URL>/<changed-route>/ | grep -F "<expected marker>"
```

## 8. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | <DATE> | GTC IT / AI Assistant | Initial publication model |
