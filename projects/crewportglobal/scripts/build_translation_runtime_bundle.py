#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from translation_cache import REPO_ROOT, load_source_catalog, write_json


DEFAULT_SOURCE = REPO_ROOT / 'projects' / 'crewportglobal' / 'i18n' / 'en.json'
DEFAULT_PUBLISH_READY_DIR = REPO_ROOT / 'projects' / 'crewportglobal' / 'i18n' / 'publish-ready-export'
DEFAULT_BUNDLE_DIR = REPO_ROOT / 'projects' / 'crewportglobal' / 'i18n' / 'runtime-bundle'
DEFAULT_BUNDLE_FILE = DEFAULT_BUNDLE_DIR / 'crewportglobal-machine-translations.js'
DEFAULT_MANIFEST_FILE = DEFAULT_BUNDLE_DIR / 'manifest.json'


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def read_catalog(file_path: Path) -> dict[str, str]:
    if not file_path.exists():
        raise FileNotFoundError(f'Catalog file does not exist: {file_path}')
    payload = json.loads(file_path.read_text(encoding='utf-8'))
    if not isinstance(payload, dict):
        raise ValueError(f'Catalog JSON object expected: {file_path}')
    return {str(key): str(value) for key, value in payload.items()}


def collect_publish_ready_catalogs(export_dir: Path, targets: list[str] | None) -> dict[str, dict[str, str]]:
    catalog_files = [export_dir / f'{target}.json' for target in targets] if targets else sorted(export_dir.glob('*.json'))
    catalogs: dict[str, dict[str, str]] = {}
    for catalog_file in catalog_files:
        language = catalog_file.stem
        catalogs[language] = read_catalog(catalog_file)
    return catalogs


def build_bundle_payload(
    source_catalog: dict[str, str],
    target_catalogs: dict[str, dict[str, str]],
) -> dict[str, Any]:
    return {
        'schema_version': 1,
        'generated_at': utc_now(),
        'official_language': 'en',
        'source_key_count': len(source_catalog),
        'target_languages': sorted(target_catalogs),
        'catalogs': {
            language: {key: catalog[key] for key in sorted(catalog)}
            for language, catalog in sorted(target_catalogs.items())
        },
        'publication_boundary': {
            'source': 'publish-ready-export',
            'browser_provider_calls_allowed': False,
            'form_value_translation_allowed': False,
            'requires_human_review_for_sensitive_text': True,
        },
    }


def render_bundle_js(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)
    return (
        'window.CREWPORTGLOBAL_MACHINE_TRANSLATION_BUNDLE = '
        f'{encoded};\n'
    )


def build_manifest(payload: dict[str, Any], bundle_file: Path) -> dict[str, Any]:
    catalogs = payload['catalogs']
    return {
        'schema_version': payload['schema_version'],
        'generated_at': payload['generated_at'],
        'bundle_file': str(bundle_file.name),
        'official_language': payload['official_language'],
        'source_key_count': payload['source_key_count'],
        'target_languages': payload['target_languages'],
        'target_key_counts': {
            language: len(catalog)
            for language, catalog in catalogs.items()
        },
        'runtime_boundary': payload['publication_boundary'],
    }


def write_bundle(bundle_file: Path, manifest_file: Path, payload: dict[str, Any]) -> None:
    bundle_file.parent.mkdir(parents=True, exist_ok=True)
    bundle_file.write_text(render_bundle_js(payload), encoding='utf-8')
    write_json(manifest_file, build_manifest(payload, bundle_file))


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Build prebuilt CrewPortGlobal publish-ready machine translation runtime bundle.',
    )
    parser.add_argument('--source', default=str(DEFAULT_SOURCE))
    parser.add_argument('--publish-ready-dir', default=str(DEFAULT_PUBLISH_READY_DIR))
    parser.add_argument('--bundle-file', default=str(DEFAULT_BUNDLE_FILE))
    parser.add_argument('--manifest-file', default=str(DEFAULT_MANIFEST_FILE))
    parser.add_argument('--targets', nargs='*')
    args = parser.parse_args()

    source_catalog = load_source_catalog(Path(args.source).resolve())
    target_catalogs = collect_publish_ready_catalogs(Path(args.publish_ready_dir).resolve(), args.targets)
    payload = build_bundle_payload(source_catalog, target_catalogs)
    bundle_file = Path(args.bundle_file).resolve()
    manifest_file = Path(args.manifest_file).resolve()
    write_bundle(bundle_file, manifest_file, payload)

    for language in payload['target_languages']:
        key_count = len(payload['catalogs'][language])
        print(f'Bundled {key_count} publish-ready entries for {language}')
    print(f'Runtime bundle written: {bundle_file}')
    print(f'Runtime manifest written: {manifest_file}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
