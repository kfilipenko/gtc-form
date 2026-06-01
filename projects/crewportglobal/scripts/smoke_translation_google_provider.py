#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os
from pathlib import Path

from translation_cache import (
    DEFAULT_PUBLIC_ROOT,
    DEFAULT_SOURCE,
    REPO_ROOT,
    SCHEMA_VERSION,
    load_source_catalog,
    select_translation_provider,
    update_cache,
)
from translation_provider_adapters import check_google_provider_readiness


def print_readiness(status: dict[str, object]) -> None:
    findings = status['findings']
    print('Google translation smoke readiness')
    print(f"provider={status['provider']}")
    print(f"runtime_boundary={status['runtime_boundary']}")
    print(f"dependency_installed={status['dependency_installed']}")
    print(f"credentials_configured={status['credentials_configured']}")
    print(f"ready={status['ready']}")
    print(f'findings: {len(findings)}')
    for finding in findings:
        print(f"  - {finding['code']}: {finding['message']}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Run a protected one-key Google translation smoke test without mutating repository cache.',
    )
    parser.add_argument('--source', default=str(DEFAULT_SOURCE))
    parser.add_argument('--key', default='site.tagline')
    parser.add_argument('--target', default='ru')
    parser.add_argument('--source-language', default='en')
    args = parser.parse_args()

    readiness = check_google_provider_readiness(
        env=os.environ,
        repo_root=REPO_ROOT,
        public_root=DEFAULT_PUBLIC_ROOT,
        require_google=True,
    )
    print_readiness(readiness)
    if readiness['findings']:
        print('Smoke test stopped before provider call.')
        return 1

    source_catalog = load_source_catalog(Path(args.source).resolve())
    if args.key not in source_catalog:
        print(f'Smoke source key is missing: {args.key}')
        return 1

    provider = select_translation_provider('google')
    smoke_cache: dict[str, object] = {
        'schema_version': SCHEMA_VERSION,
        'entries': [],
    }
    stats = update_cache(
        source_catalog={args.key: source_catalog[args.key]},
        cache=smoke_cache,
        targets=[args.target],
        provider=provider,
        source_language=args.source_language,
    )
    entries = smoke_cache.get('entries')
    if not isinstance(entries, list) or len(entries) != 1:
        print('Smoke test did not create exactly one in-memory cache entry.')
        return 1

    entry = entries[0]
    print('Google translation smoke result')
    print(f"translation_key={entry.get('translation_key')}")
    print(f"target_language={entry.get('target_language')}")
    print(f"provider={entry.get('provider')}")
    print(f"status={entry.get('translation_status')}")
    print(f"created={stats['created']} cache_hits={stats['cache_hits']} stale={stats['stale']}")
    print('Repository cache mutation: false')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
