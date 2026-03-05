#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/nginx_split_apply_root.sh"
  exit 1
fi

APP_CONF="/etc/nginx/sites-enabled/app.gtstor.com"
BAD_SPLIT_CONF="/etc/nginx/conf.d/99-split-route-switch.conf"
RJAKA_INCLUDE="include /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf;"
GTSTOR_INCLUDE="include /var/www/gtc-form/projects/shared/nginx/gtstor-compat.conf;"
TS="$(date -u +%Y%m%d-%H%M%SZ)"

if [[ ! -f "$APP_CONF" ]]; then
  echo "Missing nginx app config: $APP_CONF"
  exit 2
fi

cp "$APP_CONF" "${APP_CONF}.bak.${TS}"

python3 - <<'PY'
from pathlib import Path

app_conf = Path('/etc/nginx/sites-enabled/app.gtstor.com')
rjaka = '    include /var/www/gtc-form/projects/shared/nginx/rjaka-compat.conf;'
gtstor = '    include /var/www/gtc-form/projects/shared/nginx/gtstor-compat.conf;'
anchor = '    include /var/www/gtc-form/docs/nginx/chat-internal.conf;'

lines = app_conf.read_text(encoding='utf-8').splitlines()

if not any('projects/shared/nginx/rjaka-compat.conf' in line for line in lines):
    idx = next((i for i, line in enumerate(lines) if line.strip() == anchor.strip()), None)
    if idx is None:
        idx = next((i for i, line in enumerate(lines) if line.strip() == 'server {'), None)
        if idx is None:
            raise SystemExit('Cannot find insertion point in app.gtstor.com config')
        idx += 1
    lines.insert(idx, rjaka)
    lines.insert(idx + 1, gtstor)

app_conf.write_text('\n'.join(lines) + '\n', encoding='utf-8')
PY

if [[ -f "$BAD_SPLIT_CONF" ]]; then
  cp "$BAD_SPLIT_CONF" "${BAD_SPLIT_CONF}.bak.${TS}"
  mv "$BAD_SPLIT_CONF" "${BAD_SPLIT_CONF}.disabled.${TS}"
fi

nginx -t
systemctl reload nginx

echo "Applied split route includes inside server block and reloaded nginx."
echo "Backup: ${APP_CONF}.bak.${TS}"
if [[ -f "${BAD_SPLIT_CONF}.disabled.${TS}" ]]; then
  echo "Disabled: ${BAD_SPLIT_CONF}.disabled.${TS}"
fi