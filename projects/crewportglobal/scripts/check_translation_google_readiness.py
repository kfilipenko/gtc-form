#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os

from translation_cache import REPO_ROOT
from translation_provider_adapters import check_google_provider_readiness


PUBLIC_ROOT = REPO_ROOT / 'projects' / 'crewportglobal' / 'public'


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Check CrewPortGlobal protected Google translation provider readiness.',
    )
    parser.add_argument(
        '--require-google',
        action='store_true',
        help='Fail unless Google credentials and google-cloud-translate dependency are ready.',
    )
    args = parser.parse_args()

    status = check_google_provider_readiness(
        env=os.environ,
        repo_root=REPO_ROOT,
        public_root=PUBLIC_ROOT,
        require_google=args.require_google,
    )
    findings = status['findings']

    print('Google translation protected environment readiness')
    print(f"provider={status['provider']}")
    print(f"runtime_boundary={status['runtime_boundary']}")
    print(f"dependency_module={status['dependency_module']}")
    print(f"dependency_installed={status['dependency_installed']}")
    print(f"credentials_configured={status['credentials_configured']}")
    print(f"ready={status['ready']}")
    print(f'findings: {len(findings)}')

    for finding in findings:
        print(f"  - {finding['code']}: {finding['message']}")

    return 1 if findings else 0


if __name__ == '__main__':
    raise SystemExit(main())
