# New Project Directory Layout Template

Use this layout when starting a new GTC project.

## Repository Source

```text
projects/<PROJECT_CODE>/
  README.md
  public/
    index.html
    assets/
    legal/
  app/
    backend/
    frontend/
  deploy/
    nginx/
    systemd/
  scripts/
```

## Documentation

```text
docs/<PROJECT_CODE>/
  00_documentation_register.md
  01_project_scope_and_positioning.md
  02_domain_dns_ssl_publication_checklist.md
  03_business_process_register.md
  04_publication_model.md
  05_project_memory_handoff.md
  06_implemented_code_standards_register.md
  business_processes/
  implemented_code_standards/
  sql_drafts/
```

## App Operations Docs

```text
docs/apps/<APP_NAME>/
  APP.md
  DEPLOY.md
  STORAGE.md
  RUNBOOK.md
```

## Public Root

```text
<LIVE_ROOT>/
  index.html
  assets/
  legal/
```

## Backup Root

```text
/var/www/backups/<APP_NAME>/
```
