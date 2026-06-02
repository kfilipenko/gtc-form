# CPG-BIZ-081 - Translation Release Failure Drill And Rollback Note

- Проект: CrewPortGlobal.com
- Компания: GTC INFORMATION TECHNOLOGY FZ-LLC
- Этап: Stage 1 - Digital Maritime Crew Data and Matching Platform
- Тип документа: Operational control note
- Основание: continuation after CPG-BIZ-080
- Версия: 1.0
- Дата: 2026-06-02
- Статус: Implemented as documentation and verified locally

## 1. Цель

Цель этапа - зафиксировать действия команды при отказе translation publication release-check.

После CPG-BIZ-080 стандартный путь публикации переводов выглядит так:

```bash
npm run check:cpg-i18n-release
```

и в CI:

```text
.github/workflows/crewportglobal-i18n-publication.yml
```

Этот документ отвечает на вопрос: что делать, если локальная проверка или GitHub Actions workflow падает.

## 2. Общий Принцип

При отказе translation release-check команда не должна вручную править опубликованный runtime bundle или query-marker в HTML.

Стандартное правило:

```text
source/cache change -> publish workflow -> read-only guard -> diff check -> browser regression -> commit/push
```

Если проверка не проходит, исправляется причина отказа, после чего выполняется тот же release-check повторно.

## 3. Failure Drill Matrix

| Failure | Типичный признак | Проверка | Разрешенное действие |
|---|---|---|---|
| Stale public HTML marker | `publication_version` in HTML differs from manifest | `npm run check:cpg-i18n-runtime-bundle` or release-check | Run `npm run publish:cpg-i18n-runtime-bundle`, review generated diff, commit generated artifacts. |
| Bundle not committed | CI generated-artifact diff check fails | GitHub Actions step `Ensure generated publication artifacts are committed` | Run local publish workflow, commit runtime bundle, manifest, public bundle and synchronized HTML. |
| Sensitive translation not publish-ready | Guard reports publish-ready/cache mismatch | `npm run check:cpg-i18n-publication-guard` | Keep sensitive text excluded, or mark exact current cache entries reviewed after human review. |
| Stale cache entry | Source hash mismatch or stale entry | `npm run check:cpg-i18n-cache-report` | Refresh cache from canonical English source; do not publish stale translations. |
| Browser regression failure | Playwright homepage-language test fails | `npm run check:cpg-i18n-release` | Fix runtime/script ordering/fallback behavior; do not bypass browser regression. |
| Invalid runtime bundle | Runtime ignores bundle or checker fails schema | `npm run check:cpg-i18n-runtime-bundle` | Rebuild bundle from publish-ready export; do not hand-edit generated JavaScript. |
| Provider boundary failure | Public tree contains credential/Google endpoint marker | `npm run check:cpg-translation-provider-boundary` | Remove public credential/provider leakage before any release. |

## 4. Rollback Rule

Rollback must restore a previously committed and validated runtime publication state.

Preferred rollback path:

```bash
git log --oneline -- projects/crewportglobal/i18n/runtime-bundle projects/crewportglobal/public/assets/crewportglobal-machine-translations.js projects/crewportglobal/public
git show <known_good_commit>:projects/crewportglobal/i18n/runtime-bundle/manifest.json
git restore --source <known_good_commit> -- \
  projects/crewportglobal/i18n/runtime-bundle/crewportglobal-machine-translations.js \
  projects/crewportglobal/i18n/runtime-bundle/manifest.json \
  projects/crewportglobal/public/assets/crewportglobal-machine-translations.js \
  projects/crewportglobal/public
npm run check:cpg-i18n-publication-guard
npm run check:cpg-i18n-release
```

If the rollback restores public HTML, the restored HTML must reference the same `publication_version` as the restored manifest.

Rollback must be committed as a normal repository change. It must not be done by editing production files directly without a repository record.

## 5. Human Review And Sensitive Text

If a failure involves legal, consent, no-fee, complaint, privacy or terms content, the default response is to keep the translation unpublished until human review is complete.

Allowed review command:

```bash
python3 projects/crewportglobal/scripts/review_translation_cache.py --keys <key> --targets <lang> --reviewed-by <user_id>
```

After review marking:

```bash
npm run publish:cpg-i18n-runtime-bundle
npm run check:cpg-i18n-publication-guard
npm run check:cpg-i18n-release
```

Review marking is valid only for current non-stale entries whose source hash matches the canonical English source.

## 6. Prohibited Shortcuts

The following actions are prohibited for routine release recovery:

1. editing `crewportglobal-machine-translations.js` manually;
2. changing HTML `publication_version` manually without running the publication workflow;
3. publishing review-required sensitive translations to make CI pass;
4. disabling Playwright regression because release is urgent;
5. exposing Google credentials or provider endpoints in public files;
6. translating user-entered form values to satisfy UI localization.

Emergency manual marker correction is allowed only when needed to restore a broken public page quickly, and must be followed by:

```bash
npm run publish:cpg-i18n-runtime-bundle
npm run check:cpg-i18n-publication-guard
npm run check:cpg-i18n-release
```

## 7. Operator Checklist

Before merge or deployment of translation-publication changes:

1. Identify whether the change touches canonical English source, translation cache, runtime bundle, public HTML or public runtime.
2. Run `npm run check:cpg-i18n-release`.
3. If generated artifacts changed, review and commit them.
4. Confirm no user-entered form values are translated.
5. Confirm sensitive translations are either human-reviewed or excluded.
6. Push and let CI repeat the release sequence.
7. If CI fails, use the failure matrix above; do not bypass the failing control.

## 8. Files Changed

| File | Change |
|---|---|
| `docs/crewportglobal/276_cpg_biz_081_translation_release_failure_drill_rollback_note.md` | Added this operational rollback note. |
| `docs/crewportglobal/60_translation_pipeline_rule.md` | Added release failure and rollback rule. |
| `docs/crewportglobal/61_translation_pipeline_implementation_report.md` | Recorded CPG-BIZ-081 in the implemented controls. |
| `docs/crewportglobal/00_documentation_register.md` | Added document 276 to the register. |
| `projects/crewportglobal/README.md` | Added release failure and rollback checklist reference. |
| `projects/crewportglobal/i18n/README.md` | Added i18n-specific failure drill and rollback notes. |

## 9. Verification

Commands run locally:

```bash
npm run check:cpg-i18n-publication-guard
npm run check:cpg-i18n-release
git diff --check
```

Result: all pass.

## 10. Next Stage

Рекомендуемый следующий этап:

```text
CPG-BIZ-082 - Translation release observable status page or admin note
```

Цель: дать команде простой способ видеть текущий `publication_version`, языки runtime bundle, количество опубликованных entries и статус последней локальной/CI проверки без чтения JSON manifest вручную.
