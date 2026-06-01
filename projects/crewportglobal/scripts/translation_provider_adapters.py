#!/usr/bin/env python3

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping, Protocol


@dataclass(frozen=True)
class StubTranslationProvider:
    name: str = 'stub'
    version: str = 'stub-v1'

    def translate(self, text: str, source_language: str, target_language: str) -> str:
        return f'[{target_language} machine draft] {text}'


class GoogleTranslateTextClient(Protocol):
    def translate_text(self, request: dict[str, Any]) -> Any:
        ...


class TranslationProvider(Protocol):
    name: str
    version: str

    def translate(self, text: str, source_language: str, target_language: str) -> str:
        ...


@dataclass(frozen=True)
class GoogleTranslationProviderAdapter:
    name: str = 'google'
    version: str = 'google-cloud-translate-v3'
    credentials_env: str = 'GOOGLE_APPLICATION_CREDENTIALS'
    project_env: str = 'GOOGLE_CLOUD_PROJECT'
    project_id: str | None = None
    location: str = 'global'
    client: GoogleTranslateTextClient | None = None

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
        if self.client is None or not self.project_id:
            raise RuntimeError(
                'Google translation provider requires a protected backend/build client and project id.'
            )

        response = self.client.translate_text({
            'contents': [text],
            'source_language_code': source_language,
            'target_language_code': target_language,
            'parent': f'projects/{self.project_id}/locations/{self.location}',
            'mime_type': 'text/plain',
        })
        translations = getattr(response, 'translations', None)
        if translations is None and isinstance(response, Mapping):
            translations = response.get('translations')
        if not translations:
            raise RuntimeError('Google translation provider returned no translations.')

        first = translations[0]
        translated_text = getattr(first, 'translated_text', None)
        if translated_text is None and isinstance(first, Mapping):
            translated_text = first.get('translated_text')
        if not translated_text:
            raise RuntimeError('Google translation provider returned an empty translated text.')
        return str(translated_text)


def validate_google_credential_source(
    env: Mapping[str, str],
    repo_root: Path,
    public_root: Path,
    require_config: bool = False,
) -> dict[str, object]:
    adapter = GoogleTranslationProviderAdapter()
    credentials_value = (env.get(adapter.credentials_env) or '').strip()
    project_value = (env.get(adapter.project_env) or '').strip()
    findings: list[dict[str, str]] = []

    if not credentials_value and not project_value:
        if require_config:
            findings.append({
                'code': 'google_credentials_not_configured',
                'message': 'Google credential source is required but environment values are absent.',
            })
        return {
            'configured': False,
            'credentials_env': adapter.credentials_env,
            'project_env': adapter.project_env,
            'findings': findings,
        }

    if not credentials_value:
        findings.append({
            'code': 'google_credentials_path_missing',
            'message': f'{adapter.credentials_env} is required when Google project is configured.',
        })
    if not project_value:
        findings.append({
            'code': 'google_project_missing',
            'message': f'{adapter.project_env} is required when Google credentials are configured.',
        })

    if credentials_value:
        credentials_path = Path(credentials_value).expanduser()
        if not credentials_path.is_absolute():
            findings.append({
                'code': 'google_credentials_path_not_absolute',
                'message': f'{adapter.credentials_env} must be an absolute protected server path.',
            })
        else:
            resolved_credentials = credentials_path.resolve(strict=False)
            resolved_repo = repo_root.resolve(strict=False)
            resolved_public = public_root.resolve(strict=False)
            if resolved_credentials == resolved_repo or resolved_repo in resolved_credentials.parents:
                findings.append({
                    'code': 'google_credentials_inside_repository',
                    'message': f'{adapter.credentials_env} must not point inside the repository.',
                })
            if resolved_credentials == resolved_public or resolved_public in resolved_credentials.parents:
                findings.append({
                    'code': 'google_credentials_inside_public_tree',
                    'message': f'{adapter.credentials_env} must not point inside the public web tree.',
                })

    return {
        'configured': bool(credentials_value and project_value and not findings),
        'credentials_env': adapter.credentials_env,
        'project_env': adapter.project_env,
        'findings': findings,
    }


def create_google_translation_provider(
    env: Mapping[str, str],
    repo_root: Path,
    public_root: Path,
    client: GoogleTranslateTextClient | None = None,
    location: str = 'global',
) -> GoogleTranslationProviderAdapter:
    status = validate_google_credential_source(
        env=env,
        repo_root=repo_root,
        public_root=public_root,
        require_config=True,
    )
    findings = status['findings']
    if findings:
        codes = ', '.join(str(finding['code']) for finding in findings)
        raise RuntimeError(f'Google translation credential source is not valid: {codes}')

    project_id = str(env.get('GOOGLE_CLOUD_PROJECT') or '').strip()
    if client is None:
        try:
            from google.cloud import translate_v3  # type: ignore[import-not-found]
        except ImportError as exc:
            raise RuntimeError(
                'google-cloud-translate is not installed. Install it only in protected backend/build environment.'
            ) from exc
        client = translate_v3.TranslationServiceClient()

    return GoogleTranslationProviderAdapter(
        project_id=project_id,
        location=location,
        client=client,
    )
