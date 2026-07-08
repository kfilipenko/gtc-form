# GTC-STD-002 - Project Initiation And Domain Setup Standard

- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Scope: every new GTC web/application project with a domain, subdomain or public route
- Version: 0.1
- Date: 2026-07-08
- Status: Baseline standard extracted from CrewPortGlobal

## 1. Purpose

This standard defines how a new GTC project starts before application work expands.

The goal is to prevent unclear ownership, uncontrolled public roots, missing backups, stale live files and undocumented DNS or SSL decisions.

## 2. Minimum Start Package

Every project must have:

1. project name and short purpose;
2. accountable Project Owner;
3. technical repository/source path;
4. public/live root path if the project is published;
5. domain or subdomain decision;
6. DNS hosting and registrar access note;
7. SSL issuance and renewal plan;
8. nginx/public routing plan;
9. backup and rollback location;
10. initial documentation directory and register.

## 3. Domain And DNS Checklist

Record before go-live:

1. domain name;
2. registrar;
3. account owner;
4. expiration date and renewal policy;
5. DNS provider;
6. A/AAAA/CNAME records;
7. MX/SPF/DKIM/DMARC if domain email is used;
8. TTL during cutover;
9. who may approve DNS changes.

For mail-enabled domains, deliverability setup must not stop at MX. SPF, DKIM and DMARC should be recorded or explicitly deferred.

## 4. Public Root And Source Root

Each project must distinguish:

```text
repository/source root
!=
live public root
```

Example from CrewPortGlobal:

```text
source: /var/www/gtc-form/projects/crewportglobal/public
live:   /var/www/crewportglobal.com
```

The project must record:

1. source root;
2. live root;
3. sync/deploy command;
4. files excluded from sync;
5. stale-file deletion policy;
6. smoke checks after sync.

## 5. Nginx And SSL

Before enabling a public route:

1. record nginx config path;
2. confirm root/index/try_files behavior;
3. disable directory listing;
4. confirm raw internal docs are not published by accident;
5. run `nginx -t` before reload;
6. confirm HTTPS certificate and renewal method;
7. confirm canonical apex/www redirect rule.

## 6. Backup And Rollback

Before first production sync:

1. create or identify backup path;
2. record rollback command;
3. record who can approve rollback;
4. keep secrets outside repository and public roots;
5. do not store loose `.bak`, `.old`, `.backup` files inside active roots.

Backups should follow:

```text
/var/www/backups/<app>/<YYYY-MM-DD_HHMMSS>_<reason>/
```

Recommended files inside a backup folder:

1. `MANIFEST.txt`;
2. `SHA256SUMS.txt`;
3. `RESTORE.md`.

## 7. App Documentation Contract

Every deployed application should eventually provide:

```text
docs/apps/<app>/APP.md
docs/apps/<app>/DEPLOY.md
docs/apps/<app>/STORAGE.md
docs/apps/<app>/RUNBOOK.md
```

Each app must include at minimum:

1. service tier;
2. RTO/RPO;
3. RACI ownership;
4. deployment approval role;
5. rollback authority;
6. backup/restore access policy;
7. review cadence.

## 8. Acceptance Criteria

Project initiation is complete when:

1. source and live roots are documented;
2. domain/DNS/SSL decisions are recorded;
3. nginx/publication boundary is known;
4. backup/rollback path is known;
5. documentation register exists;
6. no public pages rely on undocumented manual copy steps.

## 9. Source Experience

This standard extracts the repeatable part of:

1. CrewPortGlobal domain/DNS/SSL/publication checklist;
2. CrewPortGlobal public live sync reports;
3. GTC operations governance standard;
4. GTC storage architecture standard.

## 10. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial reusable project initiation and domain setup standard |
