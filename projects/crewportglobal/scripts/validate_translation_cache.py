#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path

from translation_cache import (
    DEFAULT_CACHE,
    DEFAULT_SOURCE,
    StubTranslationProvider,
    load_cache,
    load_source_catalog,
    source_hash,
)


def active_entries(cache: dict, provider: StubTranslationProvider) -> list[dict]:
    return [
        entry for entry in cache.get('entries', [])
        if entry.get('provider') == provider.name
        and entry.get('translation_status') != 'stale'
    ]


def collect_target_languages(cache: dict, source_language: str) -> list[str]:
    languages = {
        str(entry.get('target_language') or '')
        for entry in cache.get('entries', [])
        if entry.get('target_language') and entry.get('target_language') != source_language
    }
    return sorted(languages)


def validate_translation_cache(
    source_catalog: dict[str, str],
    cache: dict,
    targets: list[str],
    provider: StubTranslationProvider,
    source_language: str = 'en',
) -> dict[str, list[dict]]:
    stale_entries = [
        entry for entry in cache.get('entries', [])
        if entry.get('provider') == provider.name
        and entry.get('translation_status') == 'stale'
    ]
    review_required_entries = [
        entry for entry in active_entries(cache, provider)
        if entry.get('human_review_required') is True
        and entry.get('translation_status') != 'reviewed'
    ]
    missing_current_entries = []
    hash_mismatch_entries = []

    for key, source_text in sorted(source_catalog.items()):
        current_hash = source_hash(source_text)
        for target_language in targets:
            current = [
                entry for entry in active_entries(cache, provider)
                if entry.get('translation_key') == key
                and entry.get('source_language') == source_language
                and entry.get('target_language') == target_language
            ]
            if not current:
                missing_current_entries.append({
                    'translation_key': key,
                    'target_language': target_language,
                    'expected_source_text_hash': current_hash,
                })
                continue
            for entry in current:
                if entry.get('source_text_hash') != current_hash:
                    hash_mismatch_entries.append(entry)

    orphan_entries = [
        entry for entry in active_entries(cache, provider)
        if entry.get('translation_key') not in source_catalog
    ]

    return {
        'stale_entries': stale_entries,
        'review_required_entries': review_required_entries,
        'missing_current_entries': missing_current_entries,
        'hash_mismatch_entries': hash_mismatch_entries,
        'orphan_entries': orphan_entries,
    }


def print_entries(title: str, entries: list[dict], limit: int) -> None:
    print(f'{title}: {len(entries)}')
    for entry in entries[:limit]:
        key = entry.get('translation_key')
        target = entry.get('target_language')
        status = entry.get('translation_status')
        print(f'  - {key} [{target}] status={status}')
    if len(entries) > limit:
        print(f'  ... {len(entries) - limit} more')


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Validate CrewPortGlobal translation cache freshness and publication readiness.',
    )
    parser.add_argument('--source', default=str(DEFAULT_SOURCE))
    parser.add_argument('--cache', default=str(DEFAULT_CACHE))
    parser.add_argument('--source-language', default='en')
    parser.add_argument('--targets', nargs='*')
    parser.add_argument('--provider', choices=['stub'], default='stub')
    parser.add_argument('--strict-publish', action='store_true')
    parser.add_argument('--limit', type=int, default=12)
    args = parser.parse_args()

    provider = StubTranslationProvider()
    source_catalog = load_source_catalog(Path(args.source).resolve())
    cache = load_cache(Path(args.cache).resolve())
    targets = args.targets or collect_target_languages(cache, args.source_language)
    findings = validate_translation_cache(
        source_catalog=source_catalog,
        cache=cache,
        targets=targets,
        provider=provider,
        source_language=args.source_language,
    )

    print('Translation cache validation')
    print(f'provider={provider.name}')
    print(f"targets={','.join(targets) if targets else '-'}")
    for title, key in [
        ('stale entries', 'stale_entries'),
        ('review-required entries', 'review_required_entries'),
        ('missing current entries', 'missing_current_entries'),
        ('hash mismatch entries', 'hash_mismatch_entries'),
        ('orphan entries', 'orphan_entries'),
    ]:
        print_entries(title, findings[key], args.limit)

    blocking_keys = (
        'stale_entries',
        'missing_current_entries',
        'hash_mismatch_entries',
    )
    has_blocking_findings = any(findings[key] for key in blocking_keys)
    has_review_required = bool(findings['review_required_entries'])

    if has_blocking_findings:
        return 1
    if args.strict_publish and has_review_required:
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
