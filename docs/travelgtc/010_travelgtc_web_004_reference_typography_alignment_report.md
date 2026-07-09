# TRAVELGTC-WEB-004 - Reference Typography Alignment Report

- Project: TravelGTC
- Source task: `docs/travelgtc/009_travelgtc_web_004_reference_typography_alignment_task.md`
- Document type: Implementation report
- Version: 0.1
- Date: 2026-07-09
- Status: Implemented

## 1. Purpose

This report fixes the typography and hero proportion correction requested after comparing the current site with the original Travel Network Lab mockups.

## 2. Implementation Summary

1. Reduced desktop H1 maximum from `5.7rem` to `3.55rem`.
2. Reduced H2 maximum from `4rem` to `2.45rem`.
3. Reduced H3, quote, lead and page-hero text scale.
4. Reduced section and page-hero spacing.
5. Changed the home hero to use the generated travel image as a full-width background.
6. Removed the redundant right-side hero image card from the home page.

## 3. Changed Files

| File | Change |
|---|---|
| `projects/travelgtc/public/assets/css/site.css` | Adjusted typography scale, hero background, spacing and page hero sizes. |
| `projects/travelgtc/public/index.html` | Removed redundant hero visual-card markup. |
| `docs/travelgtc/00_documentation_register.md` | Added WEB-004 task/report. |
| `docs/travelgtc/05_project_memory_handoff.md` | Recorded typography alignment state. |

## 4. Runtime / Public Routes

| Route / endpoint | Result |
|---|---|
| `/` | Hero uses full-width generated background and smaller heading proportions. |
| `/travel-lifestyle/`, `/club/`, `/create-trip/`, `/business-model/`, `/events/`, `/contacts/` | Inherit adjusted heading/section proportions. |

## 5. Reference Comparison Notes

The original mockups show the hero headline as large but controlled. The previous live CSS allowed the H1 to reach `5.7rem`, which made the typography visually heavier than the reference. The updated scale keeps the headline prominent but closer to the mockup balance:

```text
H1 max: 3.55rem
H2 max: 2.45rem
Hero min-height: min(620px, viewport minus header)
Page hero min-height: 330px
```

## 6. Verification

Commands run:

```bash
node --check projects/travelgtc/public/assets/js/site.js
git diff --check
rg -n "5\\.7rem|4rem|visual-panel|journey-card|floating-card|hero-travel-network-lab|font-size: clamp|page-hero" projects/travelgtc/public/assets/css/site.css projects/travelgtc/public/index.html
projects/travelgtc/scripts/deploy_public_live.sh
sudo nginx -t
curl --resolve travelgtc.com:443:20.91.187.79 https://travelgtc.com/<route>
curl --resolve travelgtc.com:443:20.91.187.79 https://travelgtc.com/assets/css/site.css
```

Result:

```text
PASS: JS syntax check passed.
PASS: git diff whitespace check passed.
PASS: source CSS no longer contains old `5.7rem` / `4rem` heading maximums.
PASS: source CSS no longer contains obsolete `.visual-panel`, `.journey-card` or `.floating-card` hero-card rules.
PASS: source CSS uses generated hero image as home hero background.
PASS: deploy script completed successfully.
PASS: nginx configuration test passed and nginx is active.
PASS: HTTPS forced-IP smoke returned HTTP 200 for /, /travel-lifestyle/, /club/, /create-trip/, /business-model/, /events/ and /contacts/.
PASS: live CSS contains the updated H1/H2 clamp values and no obsolete hero-card selectors.
```

## 7. Known Gaps / Next Work

1. Browser screenshot verification is still limited by the lack of an installed Chromium/Playwright browser in the environment.
2. Project Owner should visually review the live site after this typography correction.

## 8. Commit

```text
Included in repository commit reported in the final response.
```

## 9. Revision History

| Version | Date | Author | Changes |
|---|---|---|
| 0.1 | 2026-07-09 | GTC IT / AI Assistant | Initial implementation report |
