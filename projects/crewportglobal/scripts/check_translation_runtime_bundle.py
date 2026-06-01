#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from build_translation_runtime_bundle import DEFAULT_BUNDLE_FILE, DEFAULT_MANIFEST_FILE, DEFAULT_PUBLIC_BUNDLE_FILE


BUNDLE_PREFIX = 'window.CREWPORTGLOBAL_MACHINE_TRANSLATION_BUNDLE = '


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
    args = parser.parse_args()

    bundle_file = Path(args.bundle_file).resolve()
    manifest_file = Path(args.manifest_file).resolve()
    public_bundle_file = Path(args.public_bundle_file).resolve() if args.public_bundle_file else None
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

    if manifest.get('target_languages') != target_languages:
        findings.append('manifest_target_languages_mismatch')
    if manifest.get('runtime_boundary') != boundary:
        findings.append('manifest_runtime_boundary_mismatch')
    if public_bundle_file:
        if not public_bundle_file.exists():
            findings.append('public_bundle_missing')
        elif public_bundle_file.read_text(encoding='utf-8') != bundle_file.read_text(encoding='utf-8'):
            findings.append('public_bundle_differs_from_runtime_bundle')

    print('Translation runtime bundle validation')
    print(f'bundle_file={bundle_file}')
    print(f'manifest_file={manifest_file}')
    if public_bundle_file:
        print(f'public_bundle_file={public_bundle_file}')
    print(f"target_languages={','.join(target_languages or [])}")
    print(f'findings: {len(findings)}')
    for finding in findings:
        print(f'  - {finding}')

    return 1 if findings else 0


if __name__ == '__main__':
    raise SystemExit(main())
