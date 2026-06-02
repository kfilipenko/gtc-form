# CPG-BIZ-083 - Translation Sensitive Human Review Queue Report

- Project: CrewPortGlobal.com
- Company: GTC INFORMATION TECHNOLOGY FZ-LLC
- Stage: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Document type: Implementation report
- Source task: continuation after CPG-BIZ-082
- Version: 1.0
- Date: 2026-06-02
- Status: Implemented and verified

## 1. Purpose

This report records the human-review queue tooling for sensitive machine-localized public UI text.

CPG-BIZ-082 expanded machine localization to additional target languages while keeping legal, consent, complaint, no-fee and regulated text outside the publish-ready runtime bundle until human review.

This slice makes that controlled gap operationally visible.

## 2. Implementation Scope

Implemented changes:

1. Added a read-only translation review queue command.
2. Extended cache validation to report findings per requested target language.
3. Extended human-review marking to support the current build-side provider `google_translate_public`.
4. Added npm entrypoints for review listing and review marking.
5. Added unit tests for review-queue collection and target-limited validation.

## 3. Commands

List current sensitive review-required entries:

```bash
npm run list:cpg-i18n-review-queue -- --provider google_translate_public --targets ru --limit 20
```

JSON output for review workspace import:

```bash
python3 projects/crewportglobal/scripts/list_translation_review_queue.py \
  --provider google_translate_public \
  --targets ru uk pt es fr tr el ar fil hi id \
  --format json
```

Mark a current non-stale translated key as human reviewed:

```bash
npm run review:cpg-i18n-cache -- \
  --provider google_translate_public \
  --keys create.form.agreement.agree \
  --targets ru \
  --reviewed-by reviewer_user_id
```

Review marking records:

```text
translation_status = reviewed
human_review_required = false
reviewed_by_user_id
reviewed_at
updated_at
```

The command marks only current entries whose `source_text_hash` still matches the canonical English source catalog.

## 4. Current Queue Result

Focused check:

```bash
python3 projects/crewportglobal/scripts/list_translation_review_queue.py --provider google_translate_public --targets ru --limit 5
```

Observed result:

```text
Translation human-review queue: 89 item(s)
```

Target-limited validation:

```bash
python3 projects/crewportglobal/scripts/validate_translation_cache.py --provider google_translate_public --targets ru --limit 3
```

Observed result:

```text
stale entries: 0
review-required entries: 89
missing current entries: 0
hash mismatch entries: 0
orphan entries: 0
```

## 5. Publication Boundary

This slice does not publish sensitive translated text.

The existing publish-ready export still excludes unreviewed sensitive entries:

```text
human_review_required = true
translation_status != reviewed
```

The public runtime continues to fall back to English for excluded sensitive keys.

## 6. Files Changed

| File | Change |
| --- | --- |
| `projects/crewportglobal/scripts/list_translation_review_queue.py` | Added read-only review queue listing for current, non-stale machine translations. |
| `projects/crewportglobal/scripts/review_translation_cache.py` | Added provider selection for `stub`, `google` and `google_translate_public`. |
| `projects/crewportglobal/scripts/validate_translation_cache.py` | Added provider selection and target-limited review/stale/orphan findings. |
| `projects/crewportglobal/scripts/test_translation_cache.py` | Added review-queue and target-limited validation tests. |
| `package.json` | Added `list:cpg-i18n-review-queue` and `review:cpg-i18n-cache`. |
| `projects/crewportglobal/i18n/README.md` | Documented the review queue workflow. |
| `projects/crewportglobal/README.md` | Documented provider-aware human review commands. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Updated the canonical translation methodology. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Updated the operational methodology report. |
| `docs/crewportglobal/00_documentation_register.md` | Added this document to the register. |

## 7. Verification

```bash
python3 -m py_compile \
  projects/crewportglobal/scripts/list_translation_review_queue.py \
  projects/crewportglobal/scripts/review_translation_cache.py \
  projects/crewportglobal/scripts/validate_translation_cache.py
```

Result: passed.

```bash
npm run check:cpg-i18n-cache
```

Result: 26 passed.

```bash
python3 projects/crewportglobal/scripts/list_translation_review_queue.py --provider google_translate_public --targets ru --limit 5
```

Result: 89 review-required entries for Russian.

```bash
python3 projects/crewportglobal/scripts/validate_translation_cache.py --provider google_translate_public --targets ru --limit 3
```

Result: 89 review-required entries for Russian; no stale, missing, hash-mismatch or orphan entries.

## 8. Remaining Controlled Gaps

1. No browser UI for reviewer side-by-side approval exists yet.
2. Review marking is CLI-based and requires exact translation keys.
3. The current public runtime still intentionally excludes unreviewed sensitive localized text.

## 9. Next Stage

The next recommended stage is:

```text
CPG-BIZ-084 - Translation reviewer workspace for sensitive localized text
```

That stage should provide an internal workspace where a reviewer can compare English source text with machine draft text, approve or reject translation entries, and keep reviewer identity in the audit trail.
