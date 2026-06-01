#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
import unittest

from translation_cache import (
    StubTranslationProvider,
    export_catalogs,
    export_publish_ready_catalogs,
    mark_entries_reviewed,
    select_translation_provider,
    source_hash,
    update_cache,
)
from validate_translation_cache import validate_translation_cache

from translation_provider_adapters import (
    GoogleTranslationProviderAdapter,
    check_google_provider_readiness,
    create_google_translation_provider,
    validate_google_credential_source,
)


class FakeGoogleTranslateClient:
    def __init__(self) -> None:
        self.requests = []

    def translate_text(self, request: dict) -> object:
        self.requests.append(request)
        return SimpleNamespace(
            translations=[
                SimpleNamespace(translated_text=f"{request['target_language_code']}::{request['contents'][0]}")
            ],
        )


class TranslationCacheTests(unittest.TestCase):
    def test_cache_miss_creates_draft_entries(self) -> None:
        cache = {'schema_version': 1, 'entries': []}
        stats = update_cache(
            source_catalog={'nav.home': 'Home'},
            cache=cache,
            targets=['ru', 'pt'],
            provider=StubTranslationProvider(),
        )

        self.assertEqual(stats['created'], 2)
        self.assertEqual(stats['cache_hits'], 0)
        self.assertEqual(stats['stale'], 0)
        self.assertEqual(len(cache['entries']), 2)
        self.assertEqual({entry['translation_status'] for entry in cache['entries']}, {'draft_machine'})

    def test_cache_hit_does_not_duplicate_entries(self) -> None:
        cache = {'schema_version': 1, 'entries': []}
        provider = StubTranslationProvider()
        update_cache({'nav.home': 'Home'}, cache, ['ru'], provider)
        stats = update_cache({'nav.home': 'Home'}, cache, ['ru'], provider)

        self.assertEqual(stats['created'], 0)
        self.assertEqual(stats['cache_hits'], 1)
        self.assertEqual(stats['stale'], 0)
        self.assertEqual(len(cache['entries']), 1)

    def test_changed_source_marks_old_entry_stale_and_creates_new_entry(self) -> None:
        cache = {'schema_version': 1, 'entries': []}
        provider = StubTranslationProvider()
        update_cache({'nav.home': 'Home'}, cache, ['ru'], provider)
        old_hash = source_hash('Home')

        stats = update_cache({'nav.home': 'Start'}, cache, ['ru'], provider)

        self.assertEqual(stats['created'], 1)
        self.assertEqual(stats['cache_hits'], 0)
        self.assertEqual(stats['stale'], 1)
        self.assertEqual(len(cache['entries']), 2)
        old_entry = next(entry for entry in cache['entries'] if entry['source_text_hash'] == old_hash)
        self.assertEqual(old_entry['translation_status'], 'stale')

    def test_sensitive_keys_require_human_review(self) -> None:
        cache = {'schema_version': 1, 'entries': []}
        update_cache(
            {'legal.privacy.title': 'Privacy Policy'},
            cache,
            ['ru'],
            StubTranslationProvider(),
        )

        entry = cache['entries'][0]
        self.assertTrue(entry['human_review_required'])
        self.assertEqual(entry['translation_status'], 'review_required')

    def test_export_excludes_stale_entries(self) -> None:
        cache = {'schema_version': 1, 'entries': []}
        provider = StubTranslationProvider()
        update_cache({'nav.home': 'Home'}, cache, ['ru'], provider)
        update_cache({'nav.home': 'Start'}, cache, ['ru'], provider)

        exported = export_catalogs(cache, ['ru'])

        self.assertEqual(exported['ru'], {'nav.home': '[ru machine draft] Start'})

    def test_validator_reports_review_required_but_no_stale_for_current_cache(self) -> None:
        cache = {'schema_version': 1, 'entries': []}
        provider = StubTranslationProvider()
        source_catalog = {
            'legal.privacy.title': 'Privacy Policy',
            'nav.home': 'Home',
        }
        update_cache(source_catalog, cache, ['ru'], provider)

        findings = validate_translation_cache(source_catalog, cache, ['ru'], provider)

        self.assertEqual(findings['stale_entries'], [])
        self.assertEqual(findings['missing_current_entries'], [])
        self.assertEqual(findings['hash_mismatch_entries'], [])
        self.assertEqual(len(findings['review_required_entries']), 1)

    def test_validator_reports_missing_current_entries(self) -> None:
        cache = {'schema_version': 1, 'entries': []}
        provider = StubTranslationProvider()
        update_cache({'nav.home': 'Home'}, cache, ['ru'], provider)

        findings = validate_translation_cache(
            {'nav.home': 'Home', 'nav.vacancies': 'Vacancies'},
            cache,
            ['ru'],
            provider,
        )

        self.assertEqual(len(findings['missing_current_entries']), 1)
        self.assertEqual(findings['missing_current_entries'][0]['translation_key'], 'nav.vacancies')

    def test_validator_reports_stale_entries(self) -> None:
        cache = {'schema_version': 1, 'entries': []}
        provider = StubTranslationProvider()
        update_cache({'nav.home': 'Home'}, cache, ['ru'], provider)
        update_cache({'nav.home': 'Start'}, cache, ['ru'], provider)

        findings = validate_translation_cache({'nav.home': 'Start'}, cache, ['ru'], provider)

        self.assertEqual(len(findings['stale_entries']), 1)
        self.assertEqual(findings['missing_current_entries'], [])

    def test_mark_entries_reviewed_sets_reviewer_metadata(self) -> None:
        cache = {'schema_version': 1, 'entries': []}
        provider = StubTranslationProvider()
        source_catalog = {'legal.privacy.title': 'Privacy Policy'}
        update_cache(source_catalog, cache, ['ru'], provider)

        reviewed = mark_entries_reviewed(
            cache,
            source_catalog,
            ['legal.privacy.title'],
            ['ru'],
            provider,
            'reviewer-1',
        )

        entry = cache['entries'][0]
        self.assertEqual(reviewed, 1)
        self.assertEqual(entry['translation_status'], 'reviewed')
        self.assertEqual(entry['reviewed_by_user_id'], 'reviewer-1')
        self.assertIsNotNone(entry['reviewed_at'])
        self.assertFalse(entry['human_review_required'])

    def test_publish_ready_export_excludes_unreviewed_sensitive_entries(self) -> None:
        cache = {'schema_version': 1, 'entries': []}
        provider = StubTranslationProvider()
        source_catalog = {
            'legal.privacy.title': 'Privacy Policy',
            'nav.home': 'Home',
        }
        update_cache(source_catalog, cache, ['ru'], provider)

        exported = export_publish_ready_catalogs(cache, ['ru'])

        self.assertEqual(exported['ru'], {'nav.home': '[ru machine draft] Home'})

    def test_publish_ready_export_includes_reviewed_sensitive_entries(self) -> None:
        cache = {'schema_version': 1, 'entries': []}
        provider = StubTranslationProvider()
        source_catalog = {
            'legal.privacy.title': 'Privacy Policy',
            'nav.home': 'Home',
        }
        update_cache(source_catalog, cache, ['ru'], provider)
        mark_entries_reviewed(cache, source_catalog, ['legal.privacy.title'], ['ru'], provider, 'reviewer-1')

        exported = export_publish_ready_catalogs(cache, ['ru'])

        self.assertEqual(exported['ru'], {
            'legal.privacy.title': '[ru machine draft] Privacy Policy',
            'nav.home': '[ru machine draft] Home',
        })

    def test_google_provider_adapter_is_backend_boundary_placeholder(self) -> None:
        adapter = GoogleTranslationProviderAdapter()

        status = adapter.boundary_status(env={})

        self.assertEqual(status['provider'], 'google')
        self.assertFalse(status['configured'])
        self.assertFalse(status['frontend_credentials_allowed'])
        self.assertEqual(status['runtime_boundary'], 'backend_or_build_only')

        with self.assertRaises(RuntimeError):
            adapter.translate('Home', 'en', 'ru')

    def test_google_credential_source_allows_unconfigured_non_google_mode(self) -> None:
        status = validate_google_credential_source(
            env={},
            repo_root=Path('/repo'),
            public_root=Path('/repo/public'),
        )

        self.assertFalse(status['configured'])
        self.assertEqual(status['findings'], [])

    def test_google_credential_source_requires_project_when_credentials_are_set(self) -> None:
        status = validate_google_credential_source(
            env={'GOOGLE_APPLICATION_CREDENTIALS': '/run/secrets/cpg-google-translate.json'},
            repo_root=Path('/repo'),
            public_root=Path('/repo/public'),
        )

        self.assertFalse(status['configured'])
        self.assertEqual(status['findings'][0]['code'], 'google_project_missing')

    def test_google_credential_source_blocks_repository_paths(self) -> None:
        status = validate_google_credential_source(
            env={
                'GOOGLE_APPLICATION_CREDENTIALS': '/repo/projects/crewportglobal/private/google.json',
                'GOOGLE_CLOUD_PROJECT': 'crewportglobal-localization',
            },
            repo_root=Path('/repo'),
            public_root=Path('/repo/projects/crewportglobal/public'),
        )

        codes = {finding['code'] for finding in status['findings']}
        self.assertIn('google_credentials_inside_repository', codes)

    def test_create_google_provider_with_injected_client_translates_through_backend_boundary(self) -> None:
        client = FakeGoogleTranslateClient()
        provider = create_google_translation_provider(
            env={
                'GOOGLE_APPLICATION_CREDENTIALS': '/run/secrets/cpg-google-translate.json',
                'GOOGLE_CLOUD_PROJECT': 'crewportglobal-localization',
            },
            repo_root=Path('/repo'),
            public_root=Path('/repo/projects/crewportglobal/public'),
            client=client,
        )

        translated = provider.translate('Home', 'en', 'ru')

        self.assertEqual(translated, 'ru::Home')
        self.assertEqual(client.requests[0]['parent'], 'projects/crewportglobal-localization/locations/global')
        self.assertEqual(client.requests[0]['contents'], ['Home'])
        self.assertEqual(client.requests[0]['mime_type'], 'text/plain')

    def test_create_google_provider_blocks_invalid_credentials_before_client_use(self) -> None:
        client = FakeGoogleTranslateClient()

        with self.assertRaises(RuntimeError):
            create_google_translation_provider(
                env={
                    'GOOGLE_APPLICATION_CREDENTIALS': 'relative/google.json',
                    'GOOGLE_CLOUD_PROJECT': 'crewportglobal-localization',
                },
                repo_root=Path('/repo'),
                public_root=Path('/repo/projects/crewportglobal/public'),
                client=client,
            )

        self.assertEqual(client.requests, [])

    def test_select_translation_provider_defaults_to_stub(self) -> None:
        provider = select_translation_provider('stub')

        self.assertEqual(provider.name, 'stub')
        self.assertEqual(provider.translate('Home', 'en', 'ru'), '[ru machine draft] Home')

    def test_select_translation_provider_blocks_google_without_protected_config(self) -> None:
        client = FakeGoogleTranslateClient()

        with self.assertRaises(RuntimeError):
            select_translation_provider(
                'google',
                env={},
                repo_root=Path('/repo'),
                public_root=Path('/repo/projects/crewportglobal/public'),
                google_client=client,
            )

        self.assertEqual(client.requests, [])

    def test_select_translation_provider_allows_google_with_injected_backend_client(self) -> None:
        client = FakeGoogleTranslateClient()
        provider = select_translation_provider(
            'google',
            env={
                'GOOGLE_APPLICATION_CREDENTIALS': '/run/secrets/cpg-google-translate.json',
                'GOOGLE_CLOUD_PROJECT': 'crewportglobal-localization',
            },
            repo_root=Path('/repo'),
            public_root=Path('/repo/projects/crewportglobal/public'),
            google_client=client,
        )

        self.assertEqual(provider.name, 'google')
        self.assertEqual(provider.translate('Crew', 'en', 'pt'), 'pt::Crew')

    def test_google_provider_readiness_is_non_blocking_for_local_stub_mode(self) -> None:
        status = check_google_provider_readiness(
            env={},
            repo_root=Path('/repo'),
            public_root=Path('/repo/projects/crewportglobal/public'),
            dependency_module='module_that_should_not_exist_for_cpg_tests',
        )

        self.assertFalse(status['ready'])
        self.assertFalse(status['dependency_installed'])
        self.assertFalse(status['credentials_configured'])
        self.assertEqual(status['findings'], [])

    def test_google_provider_readiness_requires_dependency_and_credentials_when_enabled(self) -> None:
        status = check_google_provider_readiness(
            env={},
            repo_root=Path('/repo'),
            public_root=Path('/repo/projects/crewportglobal/public'),
            require_google=True,
            dependency_module='module_that_should_not_exist_for_cpg_tests',
        )

        codes = {finding['code'] for finding in status['findings']}
        self.assertIn('google_credentials_not_configured', codes)
        self.assertIn('google_cloud_translate_dependency_missing', codes)

    def test_google_provider_readiness_passes_with_safe_config_and_installed_dependency(self) -> None:
        status = check_google_provider_readiness(
            env={
                'GOOGLE_APPLICATION_CREDENTIALS': '/run/secrets/cpg-google-translate.json',
                'GOOGLE_CLOUD_PROJECT': 'crewportglobal-localization',
            },
            repo_root=Path('/repo'),
            public_root=Path('/repo/projects/crewportglobal/public'),
            require_google=True,
            dependency_module='json',
        )

        self.assertTrue(status['ready'])
        self.assertTrue(status['dependency_installed'])
        self.assertTrue(status['credentials_configured'])
        self.assertEqual(status['findings'], [])


if __name__ == '__main__':
    unittest.main()
