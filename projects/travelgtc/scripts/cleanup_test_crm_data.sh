#!/usr/bin/env bash
set -euo pipefail

# Removes only records carrying explicit TravelGTC test markers. Preview is default.
ENV_FILE="${TRAVELGTC_ENV_FILE:-/etc/travelgtc/travelgtc-api.env}"
MODE="preview"

if [[ "${1:-}" == "--execute" ]]; then
  MODE="execute"
elif [[ -n "${1:-}" ]]; then
  echo "Usage: $0 [--execute]" >&2
  exit 2
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

DATABASE_URL="${TRAVELGTC_DATABASE_URL:-${DATABASE_URL:-}}"
if [[ -z "$DATABASE_URL" ]]; then
  echo "TRAVELGTC_DATABASE_URL is not configured." >&2
  exit 1
fi

read -r -d '' TEST_CONTACTS_SQL <<'SQL' || true
select c.id
from travelgtc_contacts c
left join travelgtc_identity.users u on u.user_id = c.user_id
where c.display_name ilike 'тест%'
   or coalesce(u.email, c.email, '') ~* '(^mira-|^ai-chat|^purchase-intent-|@example\.test$)'
SQL

if [[ "$MODE" == "preview" ]]; then
  psql "$DATABASE_URL" -P pager=off -c "with test_contacts as ($TEST_CONTACTS_SQL) select 'test_leads' as item,count(*) from travelgtc_leads where contact_id in (select id from test_contacts) union all select 'test_contacts',count(*) from test_contacts union all select 'test_interactions',count(*) from travelgtc_interactions where contact_id in (select id from test_contacts) union all select 'test_users',count(*) from travelgtc_identity.users where email ~* '(^mira-|^ai-chat|^purchase-intent-|@example\\.test$)';"
  echo "Preview only. Run $0 --execute to remove these explicit test records."
  exit 0
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
begin;
create temporary table travelgtc_test_contacts on commit drop as
$TEST_CONTACTS_SQL;
delete from travelgtc_audit_log where entity_type = 'customer_profile' and entity_id in (select id from travelgtc_test_contacts);
delete from travelgtc_leads where contact_id in (select id from travelgtc_test_contacts);
delete from travelgtc_contacts where id in (select id from travelgtc_test_contacts);
delete from travelgtc_identity.users where email ~* '(^mira-|^ai-chat|^purchase-intent-|@example\.test$)';
commit;
SQL

echo "TravelGTC explicit test CRM records were removed."
