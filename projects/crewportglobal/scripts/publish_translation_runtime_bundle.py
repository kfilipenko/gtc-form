#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

from translation_cache import REPO_ROOT


PROJECT_ROOT = REPO_ROOT / 'projects' / 'crewportglobal'
PUBLIC_ROOT = PROJECT_ROOT / 'public'
MANIFEST_FILE = PROJECT_ROOT / 'i18n' / 'runtime-bundle' / 'manifest.json'
BUILD_SCRIPT = PROJECT_ROOT / 'scripts' / 'build_translation_runtime_bundle.py'
BUNDLE_CHECK_SCRIPT = PROJECT_ROOT / 'scripts' / 'check_translation_runtime_bundle.py'
PUBLIC_I18N_CHECK_SCRIPT = PROJECT_ROOT / 'scripts' / 'check_public_i18n.js'
MACHINE_BUNDLE_REFERENCE = 'crewportglobal-machine-translations.js'


def run_command(command: list[str]) -> None:
    print(f"+ {' '.join(command)}", flush=True)
    subprocess.run(command, cwd=REPO_ROOT, check=True)


def read_publication_version(manifest_file: Path) -> str:
    manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
    version = manifest.get('publication_version')
    if not isinstance(version, str) or not re.fullmatch(r'[a-f0-9]{16}', version):
        raise ValueError('Runtime bundle manifest is missing a valid publication_version.')
    return version


def sync_public_html_bundle_versions(public_root: Path, publication_version: str) -> int:
    pattern = re.compile(r'(crewportglobal-machine-translations\.js)(?:\?v=[^"\']+)?')
    changed_count = 0

    for html_file in sorted(public_root.rglob('*.html')):
        html = html_file.read_text(encoding='utf-8')
        if MACHINE_BUNDLE_REFERENCE not in html:
            continue
        updated = pattern.sub(rf'\1?v={publication_version}', html)
        if updated != html:
            html_file.write_text(updated, encoding='utf-8')
            changed_count += 1

    return changed_count


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Build, publish-version-sync and validate the CrewPortGlobal machine translation runtime bundle.',
    )
    parser.add_argument(
        '--skip-public-i18n-check',
        action='store_true',
        help='Skip the broader public i18n coverage check. The runtime-bundle checker still runs.',
    )
    args = parser.parse_args()

    run_command([sys.executable, str(BUILD_SCRIPT)])
    publication_version = read_publication_version(MANIFEST_FILE)
    changed_html_count = sync_public_html_bundle_versions(PUBLIC_ROOT, publication_version)
    print(f'Synchronized {changed_html_count} public HTML file(s) to publication_version={publication_version}')
    run_command([sys.executable, str(BUNDLE_CHECK_SCRIPT)])
    if not args.skip_public_i18n_check:
        run_command(['node', str(PUBLIC_I18N_CHECK_SCRIPT)])

    print('Translation runtime publication workflow completed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
