# GTC-STD-003 - Project Structure And Publication Model

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: repository layout and public publication for GTC projects
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline standard extracted from CrewPortGlobal

## 1. Purpose

This standard defines how project files, public pages and public documents should be structured.

The goal is to make publication deterministic and prevent duplicate documents, raw internal markdown exposure and inconsistent page edits.

## 2. Recommended Repository Layout

For a project inside the shared repository:

```text
projects/<project>/
  public/
    index.html
    assets/
    legal/
    <application routes>/
  app/
    backend/
    frontend/
  deploy/
    nginx/
    systemd/
  scripts/
  README.md

docs/<project>/
  00_documentation_register.md
  business_processes/
  implemented_code_standards/
  sql_drafts/
  <numbered task/report/standard documents>
```

The exact structure may vary, but source code, public output, deployment helpers and documentation must be visibly separated.

## 3. Public Source And Live Root

Every public project must define:

```text
PUBLIC_SOURCE=<repository public source>
LIVE_ROOT=<server live root>
PUBLIC_BASE_URL=<canonical URL>
```

The live root should be updated only by the approved deploy/sync path.

Manual file copying is allowed only as an emergency action and must be recorded afterwards.

## 4. One Public Document Rule

Each public contract, policy, standard or operating condition must have one canonical public URL.

Other pages may show:

1. a short summary;
2. status/version;
3. link to the canonical document.

Other pages must not duplicate the full public text.

## 5. Public Documents Hub

Projects with legal, policy or operational documents should publish them through one controlled public section, for example:

```text
/legal/
/legal/terms/
/legal/privacy/
/legal/<document>/
```

The hub should explain the document set and link to active documents.

Raw internal paths such as:

```text
/docs/<project>/*.md
```

must not be the public publication model unless explicitly approved.

## 6. Internal Documentation Rule

Internal documentation may contain:

1. task documents;
2. implementation reports;
3. standards;
4. business-process manuals;
5. memory handoff documents;
6. SQL drafts;
7. verification evidence.

Internal docs may be used as source for public content, but publication must happen through the approved public route.

## 7. Shared Components Rule

Shared page elements must not be manually copied page by page if the project has a common runtime/helper.

Use shared components for:

1. header/brand block;
2. navigation;
3. account area;
4. language selector;
5. theme selector;
6. document hub cards;
7. recurring workflow panels.

Changing the shared component should propagate to adopting pages.

## 8. Publication Checklist

Before declaring a page published:

1. source file exists in repository;
2. page is reachable in live root;
3. canonical URL is correct;
4. navigation or hub link is present where required;
5. expected text is visible in live HTML;
6. page does not duplicate another canonical document;
7. page does not expose internal paths or secrets;
8. i18n/translation mechanism is respected when used.

## 9. Acceptance Criteria

The publication model is accepted when:

1. source/live roots are documented;
2. public documents have canonical URLs;
3. duplicate publication is avoided;
4. shared components are used for repeated page chrome;
5. deploy command can sync public files repeatably;
6. live smoke checks prove the correct version is served.

## 10. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial reusable project structure and publication model |
