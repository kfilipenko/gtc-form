#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/var/www/gtc-form}"
LIVE_ROOT="${LIVE_ROOT:-/var/www/crewportglobal.com}"
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-available/crewportglobal.com.conf}"

cd "$ROOT_DIR"

rsync -av --exclude='.well-known/' \
  projects/crewportglobal/public/ \
  "$LIVE_ROOT"/

for migration in \
  projects/crewportglobal/app/backend/db/migrations/001_create_registration_foundation.sql \
  projects/crewportglobal/app/backend/db/migrations/002_extend_seafarer_profiles_practical_fields.sql \
  projects/crewportglobal/app/backend/db/migrations/003_create_vacancy_requests.sql \
  projects/crewportglobal/app/backend/db/migrations/004_create_vacancy_applications.sql \
  projects/crewportglobal/app/backend/db/migrations/005_extend_vacancy_applications_employer_shortlist.sql
do
  PGHOST="${PGHOST:-127.0.0.1}" \
  PGUSER="${PGUSER:-gtc_user}" \
  PGPASSWORD="${PGPASSWORD:-gtc_pass}" \
  PGDATABASE="${PGDATABASE:-gtc_db}" \
  psql -v ON_ERROR_STOP=1 -f "$migration"
done

if [[ "${CPG_SYNC_NGINX:-1}" == "1" ]]; then
  OPERATOR_ACCESS_SNIPPET="${CPG_OPERATOR_ACCESS_SNIPPET:-/etc/nginx/snippets/crewportglobal-operator-access.conf}"
  if [[ ! -f "$OPERATOR_ACCESS_SNIPPET" ]]; then
    operator_token="${CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN:-${CPG_OPERATOR_ACCESS_TOKEN:-}}"
    if [[ -z "$operator_token" ]]; then
      operator_token="$(openssl rand -hex 32)"
    fi
    tmp_snippet="$(mktemp)"
    printf 'fastcgi_param CREWPORTGLOBAL_OPERATOR_ACCESS_TOKEN "%s";\n' "$operator_token" > "$tmp_snippet"
    sudo install -m 0640 -o root -g www-data "$tmp_snippet" "$OPERATOR_ACCESS_SNIPPET"
    rm -f "$tmp_snippet"
    echo "Created CrewPortGlobal operator access snippet: $OPERATOR_ACCESS_SNIPPET"
  fi

  sudo cp projects/crewportglobal/deploy/nginx/crewportglobal.com.conf "$NGINX_SITE"
  sudo nginx -t
  sudo systemctl reload nginx
fi

curl -k -fsS https://crewportglobal.com/api/v1/health
echo
