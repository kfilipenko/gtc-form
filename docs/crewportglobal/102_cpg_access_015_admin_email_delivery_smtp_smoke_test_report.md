# CrewPortGlobal - CPG-ACCESS-015 Admin Email Delivery SMTP Smoke Test Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-05-15
- Document type: Implementation report and controlled SMTP smoke-test record
- Status: Implemented and verified on server

## 1. Purpose

This report records the controlled server-side SMTP smoke-test for the admin access email-code delivery adapter prepared in documents 100 and 101.

The goal was to use the protected server-only configuration file:

```text
/etc/crewportglobal/admin-access.env
```

and verify that CrewPortGlobal can send an admin access one-time code through the approved sender mailbox without committing or printing any secret.

## 2. Implemented Scope

Implemented changes:

1. added protected env-file loading support to `projects/crewportglobal/app/backend/api/lib/admin_access_email_delivery.php`;
2. added an explicit SMTP send path protected by `smtp_send_ready` mode and `CREWPORTGLOBAL_ADMIN_ACCESS_SMTP_SEND_ENABLED=true`;
3. added safe SMTP response codes:
   - `admin_email_delivery_sent`;
   - `admin_email_delivery_send_failed`;
4. added a controlled CLI smoke-test tool:
   - `projects/crewportglobal/app/backend/api/tools/admin_access_email_smoke_test.php`;
5. updated the email delivery tests to cover protected env loading and send-ready construction without sending during unit tests;
6. updated backend API README with protected config and smoke-test instructions.

## 3. Protected Config

Protected config path:

```text
/etc/crewportglobal/admin-access.env
```

File ownership and permissions observed on the server:

```text
root:www-data
-rw-r-----
```

Loaded keys observed during smoke test:

```text
CREWPORTGLOBAL_ADMIN_ACCESS_EMAIL_ENABLED
CREWPORTGLOBAL_ADMIN_ACCESS_FLOW_ENABLED
CREWPORTGLOBAL_SMTP_FROM_EMAIL
CREWPORTGLOBAL_SMTP_FROM_NAME
CREWPORTGLOBAL_SMTP_HOST
CREWPORTGLOBAL_SMTP_PASSWORD
CREWPORTGLOBAL_SMTP_PORT
CREWPORTGLOBAL_SMTP_SECURITY
CREWPORTGLOBAL_SMTP_USERNAME
```

No SMTP password value was printed, logged or committed.

## 4. Mailbox and Transport

Sender mailbox:

```text
not_reply@crewportglobal.com
```

SMTP endpoint:

```text
smtp.timeweb.ru:465
```

SMTP security:

```text
ssl
```

The smoke-test recipient was the approved CrewPortGlobal mailbox itself:

```text
not_reply@crewportglobal.com
```

Safe masked recipient shown by the tool:

```text
n***y@crewportglobal.com
```

## 5. Smoke-Test Result

Command executed:

```bash
sudo -n php projects/crewportglobal/app/backend/api/tools/admin_access_email_smoke_test.php --send --to=not_reply@crewportglobal.com
```

Safe result:

```text
ok: true
delivery_status: admin_email_delivery_sent
mode: smtp_send_ready
from_email: not_reply@crewportglobal.com
smtp_host: smtp.timeweb.ru
smtp_port: 465
smtp_security: ssl
real_send_performed: true
```

The one-time code itself was not printed in the terminal output and was not written to documentation.

## 6. Security Boundaries

Preserved boundaries:

1. SMTP password was not committed;
2. SMTP password was not printed;
3. the generated one-time code was not printed;
4. public admin email-code routes were not connected to delivery;
5. admin sessions were not issued;
6. production database was not changed;
7. migrations were not applied;
8. frontend was not changed;
9. nginx/server configuration was not changed;
10. deployment was not performed.

The CLI smoke-test is an operator-controlled tool. It is not reachable from public web routes.

## 7. Changed Files

Backend:

- `projects/crewportglobal/app/backend/api/lib/admin_access_email_delivery.php`
- `projects/crewportglobal/app/backend/api/tools/admin_access_email_smoke_test.php`
- `projects/crewportglobal/app/backend/api/tests/admin_access_email_delivery_test.php`
- `projects/crewportglobal/app/backend/api/README.md`

Documentation:

- `docs/crewportglobal/102_cpg_access_015_admin_email_delivery_smtp_smoke_test_report.md`
- `docs/crewportglobal/00_documentation_register.md`

## 8. Verification

Verification performed:

```bash
php -l projects/crewportglobal/app/backend/api/lib/admin_access_email_delivery.php
php -l projects/crewportglobal/app/backend/api/tests/admin_access_email_delivery_test.php
php -l projects/crewportglobal/app/backend/api/tools/admin_access_email_smoke_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_email_delivery_test.php
```

Additional safe local suite:

```bash
php projects/crewportglobal/app/backend/api/tests/admin_access_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_flow_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_contract_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_pg_storage_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_storage_factory_test.php
php projects/crewportglobal/app/backend/api/tests/admin_access_public_routes_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_guard_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_operator_queue_matrix_test.php
php projects/crewportglobal/app/backend/api/tests/access_control_migration_draft_test.php
php projects/crewportglobal/app/backend/api/tests/identity_context_test.php
```

Controlled SMTP smoke test:

```bash
sudo -n php projects/crewportglobal/app/backend/api/tools/admin_access_email_smoke_test.php --send --to=not_reply@crewportglobal.com
```

## 9. What Was Not Done

Not performed:

1. public admin access flow activation;
2. public route email sending;
3. admin session issuing;
4. production DB migration;
5. `psql` execution;
6. database migration apply;
7. frontend admin console implementation;
8. nginx/server configuration changes;
9. OpenClaw changes;
10. payment changes;
11. deployment.

Existing `/verify/`, temporary operator-token behavior, registration flows and vacancy flows were not changed.

## 10. Next Recommended Work

Recommended next step:

```text
Prepare backend integration planning for connecting admin email-code request/verify handlers to storage and delivery behind explicit runtime flags, with tests first and public activation still disabled by default.
```
