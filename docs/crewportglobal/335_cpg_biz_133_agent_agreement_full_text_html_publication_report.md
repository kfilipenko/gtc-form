# CPG-BIZ-133 - Agent Agreement Full Text HTML Publication Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Document type: Implementation report
- Version: 1.0
- Date: 2026-06-18
- Status: Superseded by CPG-BIZ-134 single-canonical-publication cleanup

## 1. Issue

External visual review showed two publication problems:

1. `/legal/agent-agreement/` displayed a contract overview and appendix summary, but not the full authoritative contract text.
2. `/legal/agent-agreement/text/` resolved to `index.md` in production and could open a browser save dialog instead of displaying the contract inside the portal.

## 1A. Superseding Decision

After further standards review, the `/legal/agent-agreement/text/` full-text route was identified as a second publication of the same document. CrewPortGlobal documents must have one canonical public full-text URL under `/legal/`.

The corrected rule is:

```text
Full agent agreement text: /legal/agent-agreement/
Legacy /legal/agent-agreement/text/: redirect only, no duplicated text
Operational pages: short description + link to /legal/agent-agreement/
```

## 2. Fix

The public contract publication was changed so both external links support visual review:

1. `/legal/agent-agreement/` now includes the full authoritative English contract text below the overview block.
2. `/legal/agent-agreement/text/` now has `index.html`, so the direct full-text URL opens as a normal HTML page.
3. `projects/crewportglobal/public/assets/crewportglobal-markdown-document.js` was added as a small same-origin markdown renderer for published legal documents.
4. The canonical markdown source remains available as `/legal/agent-agreement/text/index.md` for internal/static source use, but users should receive the HTML page when opening `/legal/agent-agreement/text/`.

## 3. Public URLs

```text
https://crewportglobal.com/legal/agent-agreement/
https://crewportglobal.com/legal/agent-agreement/text/
```

## 4. Verification

Commands executed locally:

```text
curl -I http://127.0.0.1:8787/legal/agent-agreement/text/
node Playwright check for /legal/agent-agreement/
node Playwright check for /legal/agent-agreement/text/
```

Result:

```text
/legal/agent-agreement/text/ -> Content-Type: text/html
/legal/agent-agreement/ -> full contract text loaded
/legal/agent-agreement/text/ -> full contract text loaded
Both pages contain "1. Subject Matter" and "Appendix 12"
```

## 5. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-06-18 | GTC IT / AI Assistant | Published the full shipowner-agent agreement as HTML on both the overview page and direct full-text page |
