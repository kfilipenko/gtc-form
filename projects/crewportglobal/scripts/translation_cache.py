#!/usr/bin/env python3

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from translation_provider_adapters import (
    GoogleTranslateTextClient,
    StubTranslationProvider,
    TranslationProvider,
    create_google_translation_provider,
)


REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SOURCE = REPO_ROOT / 'projects' / 'crewportglobal' / 'i18n' / 'en.json'
DEFAULT_CACHE = REPO_ROOT / 'projects' / 'crewportglobal' / 'i18n' / 'translation-cache.json'
DEFAULT_EXPORT_DIR = REPO_ROOT / 'projects' / 'crewportglobal' / 'i18n' / 'cache-export'
DEFAULT_PUBLIC_ROOT = REPO_ROOT / 'projects' / 'crewportglobal' / 'public'
SCHEMA_VERSION = 1


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def normalize_source_text(value: str) -> str:
    return ' '.join(str(value).split())


def source_hash(value: str) -> str:
    return hashlib.sha256(normalize_source_text(value).encode('utf-8')).hexdigest()


def load_json_object(file_path: Path, default: dict[str, Any] | None = None) -> dict[str, Any]:
    if not file_path.exists():
        return default or {}
    payload = json.loads(file_path.read_text(encoding='utf-8'))
    if not isinstance(payload, dict) or isinstance(payload, list):
        raise ValueError(f'JSON object expected: {file_path}')
    return payload


def load_source_catalog(file_path: Path) -> dict[str, str]:
    payload = load_json_object(file_path)
    return {str(key): str(value) for key, value in payload.items()}


def load_cache(file_path: Path) -> dict[str, Any]:
    payload = load_json_object(file_path, {'schema_version': SCHEMA_VERSION, 'entries': []})
    entries = payload.get('entries')
    if not isinstance(entries, list):
        raise ValueError(f'Cache entries must be a list: {file_path}')
    return {
        'schema_version': int(payload.get('schema_version') or SCHEMA_VERSION),
        'entries': entries,
    }


def write_json(file_path: Path, payload: dict[str, Any]) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + '\n',
        encoding='utf-8',
    )


def is_sensitive_translation_key(key: str) -> bool:
    lowered = key.lower()
    sensitive_markers = (
        'agreement',
        'candidate',
        'complaint',
        'consent',
        'cookie',
        'fee',
        'legal',
        'no-recruitment',
        'nofee',
        'privacy',
        'terms',
    )
    return any(marker in lowered for marker in sensitive_markers)


def is_current_entry(
    entry: dict[str, Any],
    key: str,
    source_language: str,
    target_language: str,
    text_hash: str,
    provider: TranslationProvider,
) -> bool:
    return (
        entry.get('translation_key') == key
        and entry.get('source_language') == source_language
        and entry.get('target_language') == target_language
        and entry.get('source_text_hash') == text_hash
        and entry.get('provider') == provider.name
        and entry.get('translation_status') != 'stale'
    )


def stale_related_entries(
    entries: list[dict[str, Any]],
    key: str,
    source_language: str,
    target_language: str,
    text_hash: str,
    provider: TranslationProvider,
    timestamp: str,
) -> int:
    changed = 0
    for entry in entries:
        if (
            entry.get('translation_key') == key
            and entry.get('source_language') == source_language
            and entry.get('target_language') == target_language
            and entry.get('provider') == provider.name
            and entry.get('source_text_hash') != text_hash
            and entry.get('translation_status') != 'stale'
        ):
            entry['translation_status'] = 'stale'
            entry['updated_at'] = timestamp
            changed += 1
    return changed


def update_cache(
    source_catalog: dict[str, str],
    cache: dict[str, Any],
    targets: list[str],
    provider: TranslationProvider,
    source_language: str = 'en',
) -> dict[str, int]:
    entries = cache.setdefault('entries', [])
    timestamp = utc_now()
    stats = {
        'cache_hits': 0,
        'created': 0,
        'stale': 0,
    }

    for key, source_text in sorted(source_catalog.items()):
        text_hash = source_hash(source_text)

        for target_language in targets:
            if target_language == source_language:
                continue

            stats['stale'] += stale_related_entries(
                entries,
                key,
                source_language,
                target_language,
                text_hash,
                provider,
                timestamp,
            )

            current = next((
                entry for entry in entries
                if is_current_entry(entry, key, source_language, target_language, text_hash, provider)
            ), None)
            if current:
                stats['cache_hits'] += 1
                continue

            human_review_required = is_sensitive_translation_key(key)
            entries.append({
                'translation_key': key,
                'source_language': source_language,
                'target_language': target_language,
                'source_text': source_text,
                'source_text_hash': text_hash,
                'translated_text': provider.translate(source_text, source_language, target_language),
                'provider': provider.name,
                'provider_version': provider.version,
                'translation_status': 'review_required' if human_review_required else 'draft_machine',
                'human_review_required': human_review_required,
                'reviewed_by_user_id': None,
                'reviewed_at': None,
                'created_at': timestamp,
                'updated_at': timestamp,
            })
            stats['created'] += 1

    cache['schema_version'] = SCHEMA_VERSION
    return stats


def export_catalogs(cache: dict[str, Any], targets: list[str]) -> dict[str, dict[str, str]]:
    catalogs: dict[str, dict[str, str]] = {target: {} for target in targets}
    allowed_statuses = {'draft_machine', 'review_required', 'reviewed'}

    for entry in cache.get('entries', []):
        target_language = str(entry.get('target_language') or '')
        if target_language not in catalogs:
            continue
        if entry.get('translation_status') not in allowed_statuses:
            continue
        key = str(entry.get('translation_key') or '')
        if not key:
            continue
        catalogs[target_language][key] = str(entry.get('translated_text') or '')

    return catalogs


def export_publish_ready_catalogs(cache: dict[str, Any], targets: list[str]) -> dict[str, dict[str, str]]:
    catalogs: dict[str, dict[str, str]] = {target: {} for target in targets}

    for entry in cache.get('entries', []):
        target_language = str(entry.get('target_language') or '')
        if target_language not in catalogs:
            continue
        if entry.get('translation_status') == 'stale':
            continue
        if entry.get('human_review_required') is True and entry.get('translation_status') != 'reviewed':
            continue
        if entry.get('translation_status') not in {'draft_machine', 'reviewed'}:
            continue
        key = str(entry.get('translation_key') or '')
        if not key:
            continue
        catalogs[target_language][key] = str(entry.get('translated_text') or '')

    return catalogs


def mark_entries_reviewed(
    cache: dict[str, Any],
    source_catalog: dict[str, str],
    translation_keys: list[str],
    targets: list[str],
    provider: TranslationProvider,
    reviewed_by_user_id: str,
    source_language: str = 'en',
) -> int:
    timestamp = utc_now()
    reviewed = 0
    key_set = set(translation_keys)
    target_set = set(targets)

    for entry in cache.get('entries', []):
        key = str(entry.get('translation_key') or '')
        target_language = str(entry.get('target_language') or '')
        if key not in key_set or target_language not in target_set:
            continue
        if entry.get('provider') != provider.name:
            continue
        if entry.get('source_language') != source_language:
            continue
        if entry.get('translation_status') == 'stale':
            continue
        source_text = source_catalog.get(key)
        if source_text is None:
            continue
        if entry.get('source_text_hash') != source_hash(source_text):
            continue

        entry['translation_status'] = 'reviewed'
        entry['human_review_required'] = False
        entry['reviewed_by_user_id'] = reviewed_by_user_id
        entry['reviewed_at'] = timestamp
        entry['updated_at'] = timestamp
        reviewed += 1

    return reviewed


def write_exported_catalogs(export_dir: Path, catalogs: dict[str, dict[str, str]]) -> None:
    export_dir.mkdir(parents=True, exist_ok=True)
    for language, catalog in catalogs.items():
        write_json(export_dir / f'{language}.json', {key: catalog[key] for key in sorted(catalog)})


def select_translation_provider(
    provider_name: str,
    env: dict[str, str] | None = None,
    repo_root: Path = REPO_ROOT,
    public_root: Path = DEFAULT_PUBLIC_ROOT,
    google_client: GoogleTranslateTextClient | None = None,
) -> TranslationProvider:
    if provider_name == 'stub':
        return StubTranslationProvider()
    if provider_name == 'google':
        return create_google_translation_provider(
            env=env or dict(os.environ),
            repo_root=repo_root,
            public_root=public_root,
            client=google_client,
        )
    raise ValueError(f'Unsupported translation provider: {provider_name}')


def main() -> int:
    parser = argparse.ArgumentParser(
        description='CrewPortGlobal translation cache skeleton with a deterministic stub provider.',
    )
    parser.add_argument('--source', default=str(DEFAULT_SOURCE))
    parser.add_argument('--cache', default=str(DEFAULT_CACHE))
    parser.add_argument('--source-language', default='en')
    parser.add_argument('--targets', nargs='+', required=True)
    parser.add_argument('--provider', choices=['stub', 'google'], default='stub')
    parser.add_argument('--export-dir', default=str(DEFAULT_EXPORT_DIR))
    parser.add_argument('--no-export', action='store_true')
    args = parser.parse_args()

    try:
        provider = select_translation_provider(args.provider)
    except RuntimeError as exc:
        print(f'Translation provider configuration error: {exc}', file=sys.stderr)
        return 1
    source_catalog = load_source_catalog(Path(args.source).resolve())
    cache_path = Path(args.cache).resolve()
    cache = load_cache(cache_path)
    stats = update_cache(
        source_catalog=source_catalog,
        cache=cache,
        targets=args.targets,
        provider=provider,
        source_language=args.source_language,
    )
    write_json(cache_path, cache)

    if not args.no_export:
        write_exported_catalogs(
            Path(args.export_dir).resolve(),
            export_catalogs(cache, args.targets),
        )

    print(
        'Translation cache updated: '
        f"created={stats['created']} "
        f"cache_hits={stats['cache_hits']} "
        f"stale={stats['stale']} "
        f"provider={provider.name}"
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
