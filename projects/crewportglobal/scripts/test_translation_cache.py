#!/usr/bin/env python3

from __future__ import annotations

import unittest

from translation_cache import (
    StubTranslationProvider,
    export_catalogs,
    source_hash,
    update_cache,
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


if __name__ == '__main__':
    unittest.main()
