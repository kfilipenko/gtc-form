#!/usr/bin/env bash
set -euo pipefail

cd /var/www/gtc-form

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <GO|NO-GO> [output_file]" >&2
  exit 2
fi

decision="$1"
case "$decision" in
  GO|NO-GO) ;;
  *)
    echo "Decision must be GO or NO-GO" >&2
    exit 2
    ;;
esac

source_file="docs/cutover-decision-note-20260305-prefinal.md"
if [[ ! -f "$source_file" ]]; then
  echo "Source file not found: $source_file" >&2
  exit 1
fi

if [[ $# -ge 2 ]]; then
  target_file="$2"
else
  ts_file="$(date -u +"%Y%m%d-%H%M%SZ")"
  target_file="docs/runtime/cutover-decision-note-final-${ts_file}.md"
fi

mkdir -p "$(dirname "$target_file")"
cp "$source_file" "$target_file"

decision_time="${DECISION_TIMESTAMP_UTC:-$(date -u +"%Y-%m-%d %H:%M:%S+00")}" 
release_window="${RELEASE_WINDOW:-pending}"
release_owner="${RELEASE_OWNER:-pending}"
incident_channel="${INCIDENT_CHANNEL:-pending}"

python3 - <<'PY' "$target_file" "$decision" "$decision_time" "$release_window" "$release_owner" "$incident_channel"
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
decision = sys.argv[2]
decision_time = sys.argv[3]
release_window = sys.argv[4]
release_owner = sys.argv[5]
incident_channel = sys.argv[6]

text = path.read_text(encoding='utf-8')

text = re.sub(r"- decision_timestamp_utc:.*", f"- decision_timestamp_utc: {decision_time}", text)
text = re.sub(r"- release_window:.*", f"- release_window: {release_window}", text)
text = re.sub(r"- release_owner:.*", f"- release_owner: {release_owner}", text)
text = re.sub(r"- incident_channel:.*", f"- incident_channel: {incident_channel}", text)
text = re.sub(r"- Decision:.*", f"- Decision: {decision}", text)
text = re.sub(r"- Effective time:.*", f"- Effective time: {decision_time}", text)

if decision == "GO":
    text = re.sub(r"- rollback required:.*", "- rollback required: no", text)

path.write_text(text, encoding='utf-8')
PY

echo "[cutover] final note generated: $target_file"
echo "[cutover] decision: $decision"
