#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path

from translation_cache import REPO_ROOT
from translation_provider_adapters import GoogleTranslationProviderAdapter


PUBLIC_ROOT = REPO_ROOT / 'projects' / 'crewportglobal' / 'public'
FORBIDDEN_PUBLIC_PATTERNS = (
    'GOOGLE_APPLICATION_CREDENTIALS',
    'GOOGLE_CLOUD_PROJECT',
    'AIza',
    '-----BEGIN PRIVATE KEY-----',
    '"private_key"',
    '"client_email"',
    'translation.googleapis.com',
    'cloudtranslate',
)


def scan_public_tree(public_root: Path = PUBLIC_ROOT) -> list[dict[str, object]]:
    findings: list[dict[str, object]] = []
    if not public_root.exists():
        return findings

    for file_path in sorted(public_root.rglob('*')):
        if not file_path.is_file():
            continue
        if file_path.suffix.lower() not in {'.html', '.js', '.json', '.css', '.md'}:
            continue
        try:
            content = file_path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
        for pattern in FORBIDDEN_PUBLIC_PATTERNS:
            if pattern in content:
                findings.append({
                    'file': str(file_path.relative_to(REPO_ROOT)),
                    'pattern': pattern,
                })

    return findings


def main() -> int:
    adapter = GoogleTranslationProviderAdapter()
    status = adapter.boundary_status(env={})
    findings = scan_public_tree()

    print('Translation provider boundary check')
    print(f"provider={status['provider']}")
    print(f"runtime_boundary={status['runtime_boundary']}")
    print(f"frontend_credentials_allowed={status['frontend_credentials_allowed']}")
    print(f'public credential findings: {len(findings)}')

    for finding in findings:
        print(f"  - {finding['file']} contains {finding['pattern']}")

    return 1 if findings else 0


if __name__ == '__main__':
    raise SystemExit(main())
