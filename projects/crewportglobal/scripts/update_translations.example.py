#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SOURCE = REPO_ROOT / 'projects' / 'crewportglobal' / 'i18n' / 'en.json'
DEFAULT_OUTPUT_DIR = DEFAULT_SOURCE.parent


@dataclass(frozen=True)
class DraftProvider:
    name: str

    def translate(self, text: str, source_language: str, target_language: str) -> str:
        if self.name == 'stub':
            return f'[{target_language} draft] {text}'
        if self.name == 'google':
            return f'[google draft {target_language}] {text}'
        if self.name == 'libretranslate':
            return f'[libretranslate draft {target_language}] {text}'
        if self.name == 'argos':
            return f'[argos draft {target_language}] {text}'
        raise ValueError(f'Unsupported provider: {self.name}')


def load_catalog(file_path: Path) -> dict[str, str]:
    data = json.loads(file_path.read_text(encoding='utf-8'))
    if not isinstance(data, dict):
        raise ValueError(f'Catalog must be a JSON object: {file_path}')
    return {str(key): str(value) for key, value in data.items()}


def dump_catalog(file_path: Path, catalog: dict[str, str]) -> None:
    ordered = {key: catalog[key] for key in sorted(catalog.keys())}
    file_path.write_text(
        json.dumps(ordered, ensure_ascii=False, indent=2) + '\n',
        encoding='utf-8',
    )


def build_draft_catalog(
    source_catalog: dict[str, str],
    existing_catalog: dict[str, str],
    provider: DraftProvider,
    source_language: str,
    target_language: str,
    overwrite: bool,
) -> dict[str, str]:
    result = dict(existing_catalog)

    for key, value in source_catalog.items():
        if not overwrite and result.get(key):
            continue
        result[key] = provider.translate(value, source_language, target_language)

    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Example build-time draft translation updater for CrewPortGlobal i18n catalogs.',
    )
    parser.add_argument('--source', default=str(DEFAULT_SOURCE))
    parser.add_argument('--source-language', default='en')
    parser.add_argument('--targets', nargs='+', required=True)
    parser.add_argument('--output-dir', default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument('--provider', choices=['stub', 'google', 'libretranslate', 'argos'], default='stub')
    parser.add_argument('--overwrite', action='store_true')
    args = parser.parse_args()

    source_path = Path(args.source).resolve()
    output_dir = Path(args.output_dir).resolve()
    source_catalog = load_catalog(source_path)
    provider = DraftProvider(args.provider)

    for language in args.targets:
        target_path = output_dir / f'{language}.json'
        existing_catalog = load_catalog(target_path) if target_path.exists() else {}
        draft_catalog = build_draft_catalog(
            source_catalog=source_catalog,
            existing_catalog=existing_catalog,
            provider=provider,
            source_language=args.source_language,
            target_language=language,
            overwrite=args.overwrite,
        )
        dump_catalog(target_path, draft_catalog)
        print(f'Wrote {target_path}')

    print('Example script completed. Replace placeholder provider logic before production use.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())