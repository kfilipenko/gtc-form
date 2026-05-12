#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
repo_root="$(cd "$project_root/../.." && pwd)"

python_candidates=()

if [[ -n "${VIRTUAL_ENV:-}" && -x "$VIRTUAL_ENV/bin/python" ]]; then
  python_candidates+=("$VIRTUAL_ENV/bin/python")
fi

if [[ -x "$repo_root/../.venv/bin/python" ]]; then
  python_candidates+=("$repo_root/../.venv/bin/python")
fi

if [[ -x "$repo_root/.venv/bin/python" ]]; then
  python_candidates+=("$repo_root/.venv/bin/python")
fi

if command -v python3 >/dev/null 2>&1; then
  python_candidates+=("$(command -v python3)")
fi

selected_python=""

for candidate in "${python_candidates[@]}"; do
  if "$candidate" - <<'PY' >/dev/null 2>&1
import markdown
import yaml
PY
  then
    selected_python="$candidate"
    break
  fi
done

if [[ -z "$selected_python" ]]; then
  cat >&2 <<'EOF'
CrewPortGlobal public generator could not find a Python runtime with Markdown and PyYAML installed.

Recommended fix in this workspace:
  source /var/www/.venv/bin/activate
  python -m pip install -r projects/crewportglobal/requirements.txt

Then rerun:
  ./projects/crewportglobal/scripts/run_public_generator.sh
EOF
  exit 1
fi

cd "$repo_root"
exec "$selected_python" "$project_root/scripts/generate_public_pages.py" "$@"