#!/usr/bin/env python3

from __future__ import annotations

import argparse
import hashlib
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
DEFAULT_PUBLIC_BUNDLE_FILE = REPO_ROOT / 'projects' / 'crewportglobal' / 'public' / 'assets' / 'crewportglobal-machine-translations.js'


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def stable_hash(payload: Any) -> str:
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(encoded.encode('utf-8')).hexdigest()


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
    catalogs = {
        language: {key: catalog[key] for key in sorted(catalog)}
        for language, catalog in sorted(target_catalogs.items())
    }
    publication_boundary = {
        'source': 'publish-ready-export',
        'browser_provider_calls_allowed': False,
        'form_value_translation_allowed': False,
        'requires_human_review_for_sensitive_text': True,
    }
    source_catalog_hash = stable_hash({key: source_catalog[key] for key in sorted(source_catalog)})
    fingerprint_payload = {
        'schema_version': 1,
        'official_language': 'en',
        'source_catalog_hash': source_catalog_hash,
        'target_languages': sorted(target_catalogs),
        'catalogs': catalogs,
        'publication_boundary': publication_boundary,
    }
    publication_version = stable_hash(fingerprint_payload)[:16]
    return {
        'schema_version': 1,
        'generated_at': utc_now(),
        'publication_version': publication_version,
        'source_catalog_hash': source_catalog_hash,
        'official_language': 'en',
        'source_key_count': len(source_catalog),
        'target_languages': sorted(target_catalogs),
        'catalogs': catalogs,
        'publication_boundary': publication_boundary,
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
        'publication_version': payload['publication_version'],
        'source_catalog_hash': payload['source_catalog_hash'],
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


def preserve_generated_at_for_unchanged_publication(payload: dict[str, Any], manifest_file: Path) -> dict[str, Any]:
    if not manifest_file.exists():
        return payload

    try:
        existing_manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
    except (json.JSONDecodeError, OSError):
        return payload

    if existing_manifest.get('publication_version') != payload.get('publication_version'):
        return payload
    existing_generated_at = existing_manifest.get('generated_at')
    if not isinstance(existing_generated_at, str) or not existing_generated_at:
        return payload

    payload = dict(payload)
    payload['generated_at'] = existing_generated_at
    return payload


def write_bundle(bundle_file: Path, manifest_file: Path, payload: dict[str, Any], public_bundle_file: Path | None) -> None:
    bundle_file.parent.mkdir(parents=True, exist_ok=True)
    bundle_js = render_bundle_js(payload)
    bundle_file.write_text(bundle_js, encoding='utf-8')
    write_json(manifest_file, build_manifest(payload, bundle_file))
    if public_bundle_file:
        public_bundle_file.parent.mkdir(parents=True, exist_ok=True)
        public_bundle_file.write_text(bundle_js, encoding='utf-8')


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Build prebuilt CrewPortGlobal publish-ready machine translation runtime bundle.',
    )
    parser.add_argument('--source', default=str(DEFAULT_SOURCE))
    parser.add_argument('--publish-ready-dir', default=str(DEFAULT_PUBLISH_READY_DIR))
    parser.add_argument('--bundle-file', default=str(DEFAULT_BUNDLE_FILE))
    parser.add_argument('--manifest-file', default=str(DEFAULT_MANIFEST_FILE))
    parser.add_argument('--public-bundle-file', default=str(DEFAULT_PUBLIC_BUNDLE_FILE))
    parser.add_argument('--targets', nargs='*')
    args = parser.parse_args()

    source_catalog = load_source_catalog(Path(args.source).resolve())
    target_catalogs = collect_publish_ready_catalogs(Path(args.publish_ready_dir).resolve(), args.targets)
    payload = build_bundle_payload(source_catalog, target_catalogs)
    bundle_file = Path(args.bundle_file).resolve()
    manifest_file = Path(args.manifest_file).resolve()
    payload = preserve_generated_at_for_unchanged_publication(payload, manifest_file)
    public_bundle_file = Path(args.public_bundle_file).resolve() if args.public_bundle_file else None
    write_bundle(bundle_file, manifest_file, payload, public_bundle_file)

    for language in payload['target_languages']:
        key_count = len(payload['catalogs'][language])
        print(f'Bundled {key_count} publish-ready entries for {language}')
    print(f'Runtime bundle written: {bundle_file}')
    print(f'Runtime manifest written: {manifest_file}')
    print(f"Runtime publication version: {payload['publication_version']}")
    if public_bundle_file:
        print(f'Public runtime bundle written: {public_bundle_file}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
