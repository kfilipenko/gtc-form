# TRAVELGTC-DEPLOY-001 - Public Nginx Publication

- Project: TravelGTC
- Owner: Project Owner
- Source instruction: Project Owner requested immediate publication for `travelgtc.com`
- Document type: Task
- Version: 0.1
- Date: 2026-07-08
- Status: Implemented, DNS switch pending in Timeweb

## 1. Purpose

Publish the first Travel Network Lab prototype from repository source to a server live root and prepare nginx routing for:

```text
travelgtc.com
www.travelgtc.com
```

## 2. Current Context

The first static prototype is implemented in:

```text
projects/travelgtc/public/
```

The domain uses Timeweb nameservers and currently resolves to Timeweb hosting IP addresses, not to this GTC server:

```text
travelgtc.com -> 92.53.96.246
www.travelgtc.com -> 92.53.96.246
```

The current GTC server public IPv4 is:

```text
20.91.187.79
```

## 3. Scope

This task includes:

1. create a repeatable deploy script for TravelGTC public files;
2. create an nginx vhost template for `travelgtc.com`;
3. create live root `/var/www/travelgtc.com`;
4. sync public files to live root;
5. exclude raw image inbox from live publication;
6. install and enable nginx config on this server;
7. run local and public-IP smoke checks;
8. record required DNS changes for Timeweb.

## 4. Out Of Scope

This task does not include:

1. logging into the Timeweb panel without credentials;
2. changing Timeweb DNS records directly;
3. issuing a Let's Encrypt certificate before DNS points to this server;
4. backend/CRM form submission;
5. legal/privacy page implementation.

## 5. Source Standards

Relevant standards:

1. `docs/gtc_project_delivery_standard/03_project_structure_and_publication_model.md`;
2. `docs/gtc_project_delivery_standard/05_task_definition_and_fixation_standard.md`;
3. `docs/gtc_project_delivery_standard/09_testing_deploy_and_release_standard.md`.

## 6. Requirements

1. Live root must be separate from repository source.
2. Raw `assets/images/inbox/` files must not be published.
3. Nginx config must pass `nginx -t`.
4. Smoke checks must prove the expected pages are served from the live root.
5. DNS gap must be explicitly reported because Timeweb panel access is required.

## 7. Acceptance Criteria

The task is complete when:

1. deploy script exists and can sync the static site;
2. nginx vhost is installed and enabled;
3. nginx reload succeeds;
4. local Host-header smoke returns HTTP 200 for all prototype routes;
5. public-IP Host-header smoke returns HTTP 200 for the home page;
6. Timeweb DNS instructions are recorded;
7. repository changes are committed.

## 8. Verification Plan

```bash
bash -n projects/travelgtc/scripts/deploy_public_live.sh
projects/travelgtc/scripts/deploy_public_live.sh
sudo nginx -t
curl -H 'Host: travelgtc.com' http://127.0.0.1/
curl -H 'Host: travelgtc.com' http://20.91.187.79/
dig +short travelgtc.com A
git diff --check
```

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-08 | GTC IT / AI Assistant | Initial deploy task |
