# TRAVELGTC-OPS-001 - Test CRM Data Cleanup

- Project: TravelGTC
- Date: 2026-08-05
- Status: Implemented

## Test-Operation Baseline

Before test-operation work, the CRM was cleared of explicit test data:

- 35 test contacts and leads;
- 116 test interactions;
- 36 technical test accounts;
- 2 test contact actions.

Records were selected only by explicit markers: a `Тест…` display name, the
`example.test` domain, or technical AI-test email prefixes. Project owner accounts
and non-test customer records were retained.

## Future Cleanup

Use the project-local utility before or after a controlled test cycle:

```bash
cd /var/www/gtc-form/projects/travelgtc
./scripts/cleanup_test_crm_data.sh
./scripts/cleanup_test_crm_data.sh --execute
```

The first command is a preview. The second command removes only records with the
explicit markers above inside a database transaction. It intentionally does not
purge ordinary customer actions, because these cannot safely be identified as test
data without a marker.
