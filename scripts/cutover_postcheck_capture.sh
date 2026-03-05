#!/usr/bin/env bash
set -euo pipefail

cd /var/www/gtc-form

export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-gtc_user}"
export PGPASSWORD="${PGPASSWORD:-gtc_pass}"
export PGDATABASE="${PGDATABASE:-gtc_db}"

base_file="docs/cutover-sql-precheck-20260305-152323.md"
report_dir="docs/runtime"
ts_utc="$(date -u +"%Y-%m-%d %H:%M:%S+00")"
ts_file="$(date -u +"%Y%m%d-%H%M%SZ")"
report_file="${report_dir}/cutover-postcheck-${ts_file}.md"

mkdir -p "${report_dir}"

conn="$(psql -qAt -c "SELECT current_database()||'|'||current_user||'|'||to_char(now(),'YYYY-MM-DD HH24:MI:SSOF');")"
inventory="$(psql -qAt -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE 'anon_%' OR table_name LIKE 'chat%') ORDER BY table_name;")"
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
  echo "# Cutover Post-check Capture"
  echo
  echo "- captured_at_utc: ${ts_utc}"
  echo "- pg_host: ${PGHOST}"
  echo "- pg_port: ${PGPORT}"
  echo "- pg_database: ${PGDATABASE}"
  echo "- n8n_status: ${n8n_status}"
  echo "- provisional_verdict: ${verdict}"
  echo "- baseline_reference: ${base_file}"
  echo
  echo "## Connection"
  echo '```'
  echo "${conn}"
  echo '```'
  echo
  echo "## Table inventory"
  echo '```'
  echo "${inventory}"
  echo '```'
  echo
  echo "## Row counts"
  echo '```'
  echo "${counts}"
  echo '```'
  echo
  echo "## Freshness markers"
  echo '```'
  echo "${freshness}"
  echo '```'
  echo
  echo "## Next"
  echo "- Paste this output into docs/cutover-sql-postcheck-template.md"
  echo "- Update docs/cutover-decision-note-20260305-working.md"
  echo "- Finalize docs/cutover-decision-note-20260305-immutable-template.md"
} > "${report_file}"

echo "[cutover] post-check report generated: ${report_file}"
echo "[cutover] provisional verdict: ${verdict}"

if [[ "${verdict}" != "PASS" ]]; then
  exit 1
fi
