#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path

from translation_cache import (
    DEFAULT_CACHE,
    REPO_ROOT,
    export_publish_ready_catalogs,
    load_cache,
    write_exported_catalogs,
)
from validate_translation_cache import collect_target_languages


DEFAULT_PUBLISH_READY_DIR = REPO_ROOT / 'projects' / 'crewportglobal' / 'i18n' / 'publish-ready-export'


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Export publish-ready CrewPortGlobal translation catalogs from cache.',
    )
    parser.add_argument('--cache', default=str(DEFAULT_CACHE))
    parser.add_argument('--source-language', default='en')
    parser.add_argument('--targets', nargs='*')
    parser.add_argument('--export-dir', default=str(DEFAULT_PUBLISH_READY_DIR))
    args = parser.parse_args()

    cache = load_cache(Path(args.cache).resolve())
    targets = args.targets or collect_target_languages(cache, args.source_language)
    catalogs = export_publish_ready_catalogs(cache, targets)
    write_exported_catalogs(Path(args.export_dir).resolve(), catalogs)
    for language in targets:
        print(f'Exported {len(catalogs.get(language, {}))} publish-ready entries for {language}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
