#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from build_translation_runtime_bundle import (
    DEFAULT_BUNDLE_FILE,
    DEFAULT_MANIFEST_FILE,
    DEFAULT_PUBLIC_BUNDLE_FILE,
)
from check_translation_runtime_bundle import DEFAULT_PUBLIC_ROOT, collect_runtime_bundle_findings
from translation_cache import DEFAULT_CACHE, export_publish_ready_catalogs, load_cache


def normalized_catalog(payload: Any) -> dict[str, str]:
    if not isinstance(payload, dict):
        return {}
    return {str(key): str(value) for key, value in payload.items()}


def collect_publish_ready_findings(
    payload: dict[str, Any],
    cache_file: Path,
) -> list[str]:
    findings: list[str] = []
    target_languages = payload.get('target_languages')
    bundle_catalogs = payload.get('catalogs')

    if not isinstance(target_languages, list) or not all(isinstance(language, str) for language in target_languages):
        return ['publication_guard_target_languages_invalid']
    if not isinstance(bundle_catalogs, dict):
        return ['publication_guard_catalogs_invalid']

    cache = load_cache(cache_file)
    publish_ready_catalogs = export_publish_ready_catalogs(cache, target_languages)

    for language in sorted(target_languages):
        bundle_catalog = normalized_catalog(bundle_catalogs.get(language))
        publish_ready_catalog = normalized_catalog(publish_ready_catalogs.get(language))

        for key in sorted(set(bundle_catalog) - set(publish_ready_catalog)):
            findings.append(f'bundle_entry_not_publish_ready:{language}:{key}')
        for key in sorted(set(publish_ready_catalog) - set(bundle_catalog)):
            findings.append(f'bundle_missing_publish_ready_entry:{language}:{key}')
        for key in sorted(set(bundle_catalog) & set(publish_ready_catalog)):
            if bundle_catalog[key] != publish_ready_catalog[key]:
                findings.append(f'bundle_entry_value_mismatch:{language}:{key}')

    return findings


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Read-only guard for CrewPortGlobal translation publication workflow.',
    )
    parser.add_argument('--bundle-file', default=str(DEFAULT_BUNDLE_FILE))
    parser.add_argument('--manifest-file', default=str(DEFAULT_MANIFEST_FILE))
    parser.add_argument('--public-bundle-file', default=str(DEFAULT_PUBLIC_BUNDLE_FILE))
    parser.add_argument('--public-root', default=str(DEFAULT_PUBLIC_ROOT))
    parser.add_argument('--cache', default=str(DEFAULT_CACHE))
    args = parser.parse_args()

    bundle_file = Path(args.bundle_file).resolve()
    manifest_file = Path(args.manifest_file).resolve()
    public_bundle_file = Path(args.public_bundle_file).resolve() if args.public_bundle_file else None
    public_root = Path(args.public_root).resolve()
    cache_file = Path(args.cache).resolve()

    payload, _manifest, runtime_findings = collect_runtime_bundle_findings(
        bundle_file,
        manifest_file,
        public_bundle_file,
        public_root,
    )
    publish_ready_findings = collect_publish_ready_findings(payload, cache_file)
    findings = runtime_findings + publish_ready_findings

    print('Translation publication read-only guard')
    print(f'bundle_file={bundle_file}')
    print(f'manifest_file={manifest_file}')
    if public_bundle_file:
        print(f'public_bundle_file={public_bundle_file}')
    print(f'public_root={public_root}')
    print(f'cache_file={cache_file}')
    print(f"publication_version={payload.get('publication_version')}")
    print(f"target_languages={','.join(payload.get('target_languages') or [])}")
    print(f'runtime_findings: {len(runtime_findings)}')
    print(f'publish_ready_findings: {len(publish_ready_findings)}')
    print(f'findings: {len(findings)}')
    for finding in findings:
        print(f'  - {finding}')

    return 1 if findings else 0


if __name__ == '__main__':
    raise SystemExit(main())
