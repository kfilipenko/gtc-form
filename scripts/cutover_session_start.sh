#!/usr/bin/env bash
set -euo pipefail

cd /var/www/gtc-form

export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-gtc_user}"
export PGPASSWORD="${PGPASSWORD:-gtc_pass}"
export PGDATABASE="${PGDATABASE:-gtc_db}"

ts_utc="$(date -u +"%Y-%m-%d %H:%M:%S+00")"
ts_file="$(date -u +"%Y%m%d-%H%M%SZ")"
report_dir="docs/runtime"
report_file="${report_dir}/cutover-session-start-${ts_file}.md"

mkdir -p "${report_dir}"

conn="$(psql -qAt -c "SELECT current_database()||'|'||current_user||'|'||to_char(now(),'YYYY-MM-DD HH24:MI:SSOF');")"
counts="$(psql -qAt -c "SELECT 'anon_chats|'||count(*) FROM anon_chats UNION ALL SELECT 'anon_chat_messages|'||count(*) FROM anon_chat_messages UNION ALL SELECT 'anon_chat_feedback_votes|'||count(*) FROM anon_chat_feedback_votes UNION ALL SELECT 'chats|'||count(*) FROM chats UNION ALL SELECT 'chat_messages|'||count(*) FROM chat_messages UNION ALL SELECT 'chat_groups|'||count(*) FROM chat_groups UNION ALL SELECT 'chat_group_links|'||count(*) FROM chat_group_links UNION ALL SELECT 'chat_log|'||count(*) FROM chat_log UNION ALL SELECT 'chat_hub_agents|'||count(*) FROM chat_hub_agents UNION ALL SELECT 'chat_hub_tools|'||count(*) FROM chat_hub_tools UNION ALL SELECT 'chat_hub_agent_tools|'||count(*) FROM chat_hub_agent_tools UNION ALL SELECT 'chat_hub_sessions|'||count(*) FROM chat_hub_sessions UNION ALL SELECT 'chat_hub_messages|'||count(*) FROM chat_hub_messages UNION ALL SELECT 'chat_hub_session_tools|'||count(*) FROM chat_hub_session_tools;")"
freshness="$(psql -qAt -c "SELECT 'anon_chat_messages|max_created_at|'||COALESCE(to_char(max(created_at),'YYYY-MM-DD HH24:MI:SSOF'),'null') FROM anon_chat_messages UNION ALL SELECT 'chat_messages|max_created_at|'||COALESCE(to_char(max(created_at),'YYYY-MM-DD HH24:MI:SSOF'),'null') FROM chat_messages UNION ALL SELECT 'chat_group_links|max_created_at|'||COALESCE(to_char(max(created_at),'YYYY-MM-DD HH24:MI:SSOF'),'null') FROM chat_group_links UNION ALL SELECT 'chat_log|max_timestamp|'||COALESCE(to_char(max(\"timestamp\"),'YYYY-MM-DD HH24:MI:SSOF'),'null') FROM chat_log;")"
n8n_status="$(systemctl is-active n8n 2>/dev/null || echo unknown)"

verdict="PASS"
if [[ -z "${conn}" ]]; then
  verdict="FAIL"
fi
if [[ "${n8n_status}" != "active" ]]; then
  verdict="FAIL"
fi

{
  echo "# Cutover Session Start Report"
  echo
  echo "- generated_at_utc: ${ts_utc}"
  echo "- pg_host: ${PGHOST}"
  echo "- pg_port: ${PGPORT}"
  echo "- pg_database: ${PGDATABASE}"
  echo "- n8n_status: ${n8n_status}"
  echo "- preflight_verdict: ${verdict}"
  echo
  echo "## Connection"
  echo '```'
  echo "${conn}"
  echo '```'
  echo
  echo "## Counts"
  echo '```'
  echo "${counts}"
  echo '```'
  echo
  echo "## Freshness"
  echo '```'
  echo "${freshness}"
  echo '```'
  echo
  echo "## Next"
  echo "- If verdict is PASS -> proceed with section 3 in docs/cutover-checklist.md"
  echo "- If verdict is FAIL -> stop and investigate before cutover"
} > "${report_file}"

echo "[cutover] report generated: ${report_file}"
echo "[cutover] verdict: ${verdict}"

if [[ "${verdict}" != "PASS" ]]; then
  exit 1
fi
