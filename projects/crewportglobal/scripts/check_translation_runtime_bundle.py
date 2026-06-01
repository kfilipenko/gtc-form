#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from build_translation_runtime_bundle import DEFAULT_BUNDLE_FILE, DEFAULT_MANIFEST_FILE, DEFAULT_PUBLIC_BUNDLE_FILE, stable_hash


BUNDLE_PREFIX = 'window.CREWPORTGLOBAL_MACHINE_TRANSLATION_BUNDLE = '
DEFAULT_PUBLIC_ROOT = DEFAULT_PUBLIC_BUNDLE_FILE.parents[1]


def read_bundle_payload(bundle_file: Path) -> dict[str, Any]:
    content = bundle_file.read_text(encoding='utf-8')
    if not content.startswith(BUNDLE_PREFIX):
        raise ValueError('Runtime bundle does not use the approved global bundle assignment.')
    payload_text = content[len(BUNDLE_PREFIX):].strip()
    if payload_text.endswith(';'):
        payload_text = payload_text[:-1]
    payload = json.loads(payload_text)
    if not isinstance(payload, dict):
        raise ValueError('Runtime bundle payload must be a JSON object.')
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Validate prebuilt CrewPortGlobal machine translation runtime bundle.',
    )
    parser.add_argument('--bundle-file', default=str(DEFAULT_BUNDLE_FILE))
    parser.add_argument('--manifest-file', default=str(DEFAULT_MANIFEST_FILE))
    parser.add_argument('--public-bundle-file', default=str(DEFAULT_PUBLIC_BUNDLE_FILE))
    parser.add_argument('--public-root', default=str(DEFAULT_PUBLIC_ROOT))
    args = parser.parse_args()

    bundle_file = Path(args.bundle_file).resolve()
    manifest_file = Path(args.manifest_file).resolve()
    public_bundle_file = Path(args.public_bundle_file).resolve() if args.public_bundle_file else None
    public_root = Path(args.public_root).resolve()
    payload = read_bundle_payload(bundle_file)
    manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
    findings: list[str] = []

    if payload.get('official_language') != 'en':
        findings.append('official_language_must_be_en')
    boundary = payload.get('publication_boundary')
    if not isinstance(boundary, dict):
        findings.append('publication_boundary_missing')
    else:
        if boundary.get('browser_provider_calls_allowed') is not False:
            findings.append('browser_provider_calls_must_be_false')
        if boundary.get('form_value_translation_allowed') is not False:
            findings.append('form_value_translation_must_be_false')
        if boundary.get('requires_human_review_for_sensitive_text') is not True:
            findings.append('sensitive_text_review_gate_missing')

    catalogs = payload.get('catalogs')
    target_languages = payload.get('target_languages')
    if not isinstance(catalogs, dict) or not isinstance(target_languages, list):
        findings.append('catalog_shape_invalid')
    else:
        if sorted(catalogs) != sorted(target_languages):
            findings.append('target_language_catalog_mismatch')
        for language, catalog in catalogs.items():
            if not isinstance(catalog, dict):
                findings.append(f'catalog_not_object:{language}')
            elif not catalog:
                findings.append(f'catalog_empty:{language}')

    publication_version = payload.get('publication_version')
    source_catalog_hash = payload.get('source_catalog_hash')
    if not isinstance(publication_version, str) or not re.fullmatch(r'[a-f0-9]{16}', publication_version):
        findings.append('publication_version_invalid')
    if not isinstance(source_catalog_hash, str) or not re.fullmatch(r'[a-f0-9]{64}', source_catalog_hash):
        findings.append('source_catalog_hash_invalid')
    if isinstance(catalogs, dict) and isinstance(target_languages, list) and isinstance(boundary, dict):
        fingerprint_payload = {
            'schema_version': payload.get('schema_version'),
            'official_language': payload.get('official_language'),
            'source_catalog_hash': source_catalog_hash,
            'target_languages': sorted(target_languages),
            'catalogs': catalogs,
            'publication_boundary': boundary,
        }
        expected_version = stable_hash(fingerprint_payload)[:16]
        if publication_version != expected_version:
            findings.append('publication_version_does_not_match_bundle_content')

    if manifest.get('target_languages') != target_languages:
        findings.append('manifest_target_languages_mismatch')
    if manifest.get('runtime_boundary') != boundary:
        findings.append('manifest_runtime_boundary_mismatch')
    if manifest.get('publication_version') != publication_version:
        findings.append('manifest_publication_version_mismatch')
    if manifest.get('source_catalog_hash') != source_catalog_hash:
        findings.append('manifest_source_catalog_hash_mismatch')
    if public_bundle_file:
        if not public_bundle_file.exists():
            findings.append('public_bundle_missing')
        elif public_bundle_file.read_text(encoding='utf-8') != bundle_file.read_text(encoding='utf-8'):
            findings.append('public_bundle_differs_from_runtime_bundle')
    if public_root.exists() and isinstance(publication_version, str):
        bundle_reference_pattern = re.compile(r'crewportglobal-machine-translations\.js(?:\?v=([^"\']+))?')
        for html_file in sorted(public_root.rglob('*.html')):
            html = html_file.read_text(encoding='utf-8')
            if 'crewportglobal-machine-translations.js' not in html:
                continue
            matches = bundle_reference_pattern.findall(html)
            if not matches:
                findings.append(f'public_bundle_reference_unparseable:{html_file.relative_to(public_root)}')
                continue
            for version in matches:
                if version != publication_version:
                    findings.append(f'public_bundle_reference_version_mismatch:{html_file.relative_to(public_root)}')

    print('Translation runtime bundle validation')
    print(f'bundle_file={bundle_file}')
    print(f'manifest_file={manifest_file}')
    if public_bundle_file:
        print(f'public_bundle_file={public_bundle_file}')
    print(f'public_root={public_root}')
    print(f'publication_version={publication_version}')
    print(f"target_languages={','.join(target_languages or [])}")
    print(f'findings: {len(findings)}')
    for finding in findings:
        print(f'  - {finding}')

    return 1 if findings else 0


if __name__ == '__main__':
    raise SystemExit(main())
