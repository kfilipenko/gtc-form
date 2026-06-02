#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path

from translation_cache import (
    DEFAULT_CACHE,
    DEFAULT_SOURCE,
    load_cache,
    load_source_catalog,
    mark_entries_reviewed,
    select_translation_provider,
    write_json,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Mark current CrewPortGlobal translation cache entries as human-reviewed.',
    )
    parser.add_argument('--source', default=str(DEFAULT_SOURCE))
    parser.add_argument('--cache', default=str(DEFAULT_CACHE))
    parser.add_argument('--source-language', default='en')
    parser.add_argument('--keys', nargs='+', required=True)
    parser.add_argument('--targets', nargs='+', required=True)
    parser.add_argument('--reviewed-by', required=True)
    parser.add_argument(
        '--provider',
        choices=['stub', 'google', 'google_translate_public'],
        default='stub',
    )
    args = parser.parse_args()

    provider = select_translation_provider(args.provider)
    source_catalog = load_source_catalog(Path(args.source).resolve())
    cache_path = Path(args.cache).resolve()
    cache = load_cache(cache_path)
    reviewed = mark_entries_reviewed(
        cache=cache,
        source_catalog=source_catalog,
        translation_keys=args.keys,
        targets=args.targets,
        provider=provider,
        reviewed_by_user_id=args.reviewed_by,
        source_language=args.source_language,
    )
    write_json(cache_path, cache)
    print(f'Marked reviewed entries: {reviewed}')
    return 0 if reviewed > 0 else 1


if __name__ == '__main__':
    raise SystemExit(main())
