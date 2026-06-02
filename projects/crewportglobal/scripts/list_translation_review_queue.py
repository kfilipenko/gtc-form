#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from translation_cache import (
    DEFAULT_CACHE,
    DEFAULT_SOURCE,
    load_cache,
    load_source_catalog,
    source_hash,
)
from validate_translation_cache import collect_target_languages


PROVIDER_CHOICES = ['all', 'stub', 'google', 'google_translate_public']
STATUS_CHOICES = ['review_required', 'draft_machine', 'reviewed', 'all']


def is_current_for_source(
    entry: dict[str, Any],
    source_catalog: dict[str, str],
    source_language: str,
) -> bool:
    key = str(entry.get('translation_key') or '')
    source_text = source_catalog.get(key)
    if source_text is None:
        return False
    return (
        entry.get('source_language') == source_language
        and entry.get('source_text_hash') == source_hash(source_text)
        and entry.get('translation_status') != 'stale'
    )


def collect_review_queue(
    source_catalog: dict[str, str],
    cache: dict[str, Any],
    targets: list[str],
    provider: str = 'all',
    status: str = 'review_required',
    source_language: str = 'en',
    keys: list[str] | None = None,
) -> list[dict[str, Any]]:
    key_set = set(keys or [])
    target_set = set(targets)
    rows: list[dict[str, Any]] = []

    for entry in cache.get('entries', []):
        key = str(entry.get('translation_key') or '')
        target_language = str(entry.get('target_language') or '')
        entry_provider = str(entry.get('provider') or '')
        entry_status = str(entry.get('translation_status') or '')

        if key_set and key not in key_set:
            continue
        if target_language not in target_set:
            continue
        if provider != 'all' and entry_provider != provider:
            continue
        if status != 'all' and entry_status != status:
            continue
        if status == 'review_required' and entry.get('human_review_required') is not True:
            continue
        if not is_current_for_source(entry, source_catalog, source_language):
            continue

        rows.append({
            'translation_key': key,
            'target_language': target_language,
            'provider': entry_provider,
            'translation_status': entry_status,
            'human_review_required': bool(entry.get('human_review_required')),
            'source_text': str(source_catalog.get(key) or ''),
            'translated_text': str(entry.get('translated_text') or ''),
            'source_text_hash': str(entry.get('source_text_hash') or ''),
            'reviewed_by_user_id': entry.get('reviewed_by_user_id'),
            'reviewed_at': entry.get('reviewed_at'),
            'updated_at': entry.get('updated_at'),
        })

    return sorted(rows, key=lambda row: (
        str(row['translation_key']),
        str(row['target_language']),
        str(row['provider']),
    ))


def print_text_queue(rows: list[dict[str, Any]], limit: int) -> None:
    print(f'Translation human-review queue: {len(rows)} item(s)')
    for row in rows[:limit]:
        print(
            f"- {row['translation_key']} [{row['target_language']}] "
            f"provider={row['provider']} status={row['translation_status']}"
        )
        print(f"  source: {row['source_text']}")
        print(f"  draft:  {row['translated_text']}")
    if len(rows) > limit:
        print(f'... {len(rows) - limit} more')


def main() -> int:
    parser = argparse.ArgumentParser(
        description='List current CrewPortGlobal machine translations that need human review.',
    )
    parser.add_argument('--source', default=str(DEFAULT_SOURCE))
    parser.add_argument('--cache', default=str(DEFAULT_CACHE))
    parser.add_argument('--source-language', default='en')
    parser.add_argument('--targets', nargs='*')
    parser.add_argument('--provider', choices=PROVIDER_CHOICES, default='all')
    parser.add_argument('--status', choices=STATUS_CHOICES, default='review_required')
    parser.add_argument('--keys', nargs='*')
    parser.add_argument('--format', choices=['text', 'json'], default='text')
    parser.add_argument('--limit', type=int, default=20)
    args = parser.parse_args()

    source_catalog = load_source_catalog(Path(args.source).resolve())
    cache = load_cache(Path(args.cache).resolve())
    targets = args.targets or collect_target_languages(cache, args.source_language)
    rows = collect_review_queue(
        source_catalog=source_catalog,
        cache=cache,
        targets=targets,
        provider=args.provider,
        status=args.status,
        source_language=args.source_language,
        keys=args.keys,
    )

    if args.format == 'json':
        print(json.dumps(rows, ensure_ascii=False, indent=2, sort_keys=True))
    else:
        print_text_queue(rows, args.limit)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
