#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os

from translation_cache import REPO_ROOT
from translation_provider_adapters import validate_google_credential_source


PUBLIC_ROOT = REPO_ROOT / 'projects' / 'crewportglobal' / 'public'


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Check CrewPortGlobal protected Google translation credential source configuration.',
    )
    parser.add_argument(
        '--require-config',
        action='store_true',
        help='Fail when Google credential environment values are not configured.',
    )
    args = parser.parse_args()

    status = validate_google_credential_source(
        env=os.environ,
        repo_root=REPO_ROOT,
        public_root=PUBLIC_ROOT,
        require_config=args.require_config,
    )
    findings = status['findings']

    print('Google translation credential source check')
    print(f"credentials_env={status['credentials_env']}")
    print(f"project_env={status['project_env']}")
    print(f"configured={status['configured']}")
    print(f'findings: {len(findings)}')

    for finding in findings:
        print(f"  - {finding['code']}: {finding['message']}")

    return 1 if findings else 0


if __name__ == '__main__':
    raise SystemExit(main())
