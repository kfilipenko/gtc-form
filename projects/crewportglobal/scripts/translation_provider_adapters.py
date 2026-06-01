#!/usr/bin/env python3

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Mapping


@dataclass(frozen=True)
class StubTranslationProvider:
    name: str = 'stub'
    version: str = 'stub-v1'

    def translate(self, text: str, source_language: str, target_language: str) -> str:
        return f'[{target_language} machine draft] {text}'


@dataclass(frozen=True)
class GoogleTranslationProviderAdapter:
    name: str = 'google'
    version: str = 'google-cloud-translate-v3'
    credentials_env: str = 'GOOGLE_APPLICATION_CREDENTIALS'
    project_env: str = 'GOOGLE_CLOUD_PROJECT'

    def boundary_status(self, env: Mapping[str, str] | None = None) -> dict[str, object]:
        environment = env or os.environ
        return {
            'provider': self.name,
            'configured': bool(environment.get(self.credentials_env) and environment.get(self.project_env)),
            'credentials_env': self.credentials_env,
            'project_env': self.project_env,
            'runtime_boundary': 'backend_or_build_only',
            'frontend_credentials_allowed': False,
        }

    def translate(self, text: str, source_language: str, target_language: str) -> str:
        raise RuntimeError(
            'Google translation provider is a boundary placeholder only. '
            'Connect Google API client in a separate approved backend/build slice.'
        )
