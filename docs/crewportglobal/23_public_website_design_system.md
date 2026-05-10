# CrewPortGlobal — Public Website Design System

- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.2
- Status: Active baseline
- Classification: Internal
- Effective date: 2026-05-10
- Review date: 2026-06-10

## 1. Purpose

This document fixes the current visual and navigational baseline for the public CrewPortGlobal website.

The goal is to keep the site visually coherent with the published Trust Center documents while preserving a clear action hierarchy for shipowners and seafarers.

## 2. Visual direction

CrewPortGlobal uses a dark maritime interface with glass-panel surfaces and two accent colors:

- deep navy background for the main canvas;
- teal for trust, verification and active-state emphasis;
- amber for action emphasis and section eyebrows.

The visual tone should feel operational, compliance-first and modern rather than promotional or generic startup-themed.

## 3. Typography

The public site uses IBM Plex Sans as the main typeface.

Typography rules:

- large compressed-feel headlines for hero sections;
- restrained supporting copy with high readability;
- uppercase micro-labels for section eyebrows, metadata and document types;
- no decorative headline fonts outside the established system.

## 4. Surface system

Main UI surfaces should remain consistent across homepage and public document pages:

- rounded panels with 24px radius;
- semi-transparent dark paper backgrounds;
- soft border lines using the shared line color;
- blur-backed surfaces where already used;
- one consistent shadow family for elevated cards.

Homepage-specific layouts may differ, but they should still look like part of the same system as the Trust Center pages.

The homepage now uses the same dark maritime palette and the same shared stylesheet baseline as the generated public document pages.

## 5. Homepage composition

The homepage should follow this order:

1. site header and compact route navigation;
2. hero section with short platform positioning;
3. focused high-signal CTAs;
4. trust note on no-fee access for seafarers;
5. verification block;
6. public document library.

The homepage should not overload the hero with every legal document link. The hero is for audience entry and the main onboarding path. Document discovery belongs to the document grid and verification sections.

## 6. CTA hierarchy

Current homepage CTA hierarchy:

- For Shipowners;
- For Seafarers;
- Start Seafarer Onboarding;
- Verification Policy;
- How It Works;
- Project Scope.

Rules:

- audience entry and onboarding actions should be visible above the fold;
- legal document discovery should remain one step below the hero;
- onboarding should be explicitly reachable both from homepage and from the For Seafarers page.

## 7. Verification presentation

Verification is presented as one coherent trust surface rather than separate disconnected policies.

The homepage verification block should continue to show:

- Seafarer Identity & Professional Readiness;
- Business Client KYB;
- Vessel Verification.

All three cards may point to the unified Verification Policy until more granular public routes are intentionally introduced.

## 8. Seafarer journey presentation

The public seafarer journey should currently read as:

1. review seafarer-facing trust documents;
2. start onboarding from the acceptance page;
3. confirm no-fee and Trust Center acknowledgements;
4. continue to later identity and workspace stages when that workstream is formally opened.

This must remain visible in both content and navigation.

## 9. Consistency rules

When editing the public site:

- keep CrewPortGlobal-specific design assets inside projects/crewportglobal;
- avoid adding generic gtc-form visual dependencies;
- prefer existing button, card and navigation patterns over one-off widgets;
- keep homepage and document pages visually related through the same palette, radius, spacing and typography logic.

## 10. Change control

Any major visual redesign should update:

- this design document;
- the homepage content document;
- the live homepage source in projects/crewportglobal/public/index.html;
- any affected document-page frontmatter where CTA hierarchy changes.

## Revision history

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.2 | 2026-05-10 | GitHub Copilot | Homepage aligned to the shared dark Trust Center theme and shared stylesheet baseline |
| 0.1 | 2026-05-10 | GitHub Copilot | Initial design-system baseline created |