# TRAVELGTC-WEB-055 - Audience Journeys Release Report

- Date: 2026-09-16
- Status: PUBLISHED / verification passed; Owner visual review pending
- Task: `150_travelgtc_web_055_audience_journeys_task.md`
- Owner: accepted four-audience concept and instructed website implementation.

## Delivered Scope

- `/travel-lifestyle/`: practical travel value and independent planning, like-for-like full-cost comparison checklist, explicit limits of Mira, country-of-departure context, separate Mira entry for independent planning.
- `/club/`: Life Experiences/community page, solo/couple/experience motives, event eligibility/cost/organization checklist, no forced Ambassador route or invented events.
- `/business-model/`: partner work, relevant skills, realistic expenses/risks, Owner-provided project-network proposition, current materials/Mira/public founder profiles versus support requiring separate agreement.
- Homepage links and consistent public navigation expose the existing destination routes. No new product URLs, price engine, booking form or registration gate.
- UTM allowlist extends to the travel and club routes; Mira still uses existing scenario/source/CTA metadata. Independent-travel prefill is fixed text selected by exact existing scenario/source/CTA, not arbitrary query text.
- Existing approved illustrative images reused. They are not offered as evidence of a specific event, testimonial or founder participation. No made-up savings, schedules, product demonstrations or income examples.

## Verification

Browser suite includes five new responsive viewport checks, four mocked consented audience handoffs and mobile-menu/anchor check alongside the previous 12 regression cases. Validates image loading, first-screen action, next-content hint, overflow, active navigation, FAQs, preserved campaign labels, guest consent and existing login/register/history behavior.

Final local run: 22/22 Playwright scenarios PASS in 38.0 seconds, including all previous 12 regressions. New page viewports: 1920x1080, 1440x900, 768x1024, 390x844, 320x568. Screenshots inspected; mobile contrast and obsolete positional navigation subtitles corrected before release. JavaScript syntax check PASS. No real Azure calls, test contacts, account creation or messages were made. Backend, SQL, model instructions and services remain unchanged.

Production verification on 2026-09-16 UTC:

- Existing deployment completed; all eight route smoke checks HTTP 200.
- All 16 changed public files byte-match repository working source; no unexpected deletion. `git diff --check` PASS.
- Live browser PASS at 1440x900, 390x844 and 320x568: all three pages, hero image loading, visible action/next-content hint, no horizontal overflow, active menu, no obsolete subtitles, Mira scenario/question/campaign propagation and unchecked consent. No browser errors or mutating API requests. Screenshots inspected.
- Initial live harness compared the entire active-menu URL to a path and rejected correctly propagated UTM parameters. Fixed the harness to compare parsed pathname; no production code change was necessary. Final live run PASS.
- `/api/travelgtc/v1/health`: `ok=true`, mode `azure`, agent `AI-TravelGTC`, version `31`, guest chat enabled. No API restart.
- Evidence: `/tmp/travelgtc-web055-live-result.json`, `/tmp/travelgtc-web055-live-{travel-lifestyle,club,business-model}-{1440,390,320}.png`, local suite artifacts in `/tmp/travelgtc-web055-20260916/test-artifacts/browser/`.

## Publication And Rollback

Use existing `projects/travelgtc/scripts/deploy_public_live.sh` only after baseline/source concurrency checks and dry-run review. No Git commit/push or protected-main merge is implied. Preserve unrelated dirty worktree changes.

Protected rollback copy created: `/var/backups/travelgtc-web055-20260916`, affected source and live static files only; no credential copy. Restore scoped HTML/CSS/JS; remove new journeys.css only together with its references. No API restart or database rollback required. Rollback prepared, not exercised on production.

## Content Still Requiring Evidence

Participant photos/stories, confirmed current events, real price comparisons and exact personal support terms are deferred until supplied and checked. The pages invite a relevant conversation; conversion uplift and external partner registration are not claimed as measured outcomes.
