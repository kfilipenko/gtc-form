# CrewPortGlobal — CPG-I1-013 Favicon Publication Record

- Project: CrewPortGlobal
- Document owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Version: 0.1
- Status: Implementation record
- Classification: Internal
- Effective date: 2026-05-13
- Review date: 2026-06-13
- Related issue: GitHub issue #7 — CPG-I1-013

## 1. Purpose

This document records the completed favicon publication step for the CrewPortGlobal public website surface.

Its purpose is to give the team one operational reference for favicon source location, generated outputs, HTML wiring, live publication path and validation steps.

## 2. Source asset and generated outputs

The published favicon set was generated from the current source image:

1. `projects/crewportglobal/public/assets/Favicon.png`

The generated public outputs are:

1. `projects/crewportglobal/public/favicon-16x16.png`
2. `projects/crewportglobal/public/favicon-32x32.png`
3. `projects/crewportglobal/public/apple-touch-icon.png`
4. `projects/crewportglobal/public/favicon.ico`

## 3. Source-tree wiring

Favicon references are now wired in the project public source tree through:

1. `projects/crewportglobal/public/index.html`
2. `projects/crewportglobal/public/language.html`
3. `projects/crewportglobal/public/onboarding/seafarer-registration/index.html`
4. `projects/crewportglobal/scripts/generate_public_pages.py`

This means standalone pages and generated document pages share the same favicon publication model.

## 4. Live publication path

The current live domain is served from a separate deployment tree on GTC1:

1. `/var/www/crewportglobal.com`

This is operationally important because publishing the favicon in the project source tree alone is not sufficient for the live domain if the deployment tree is maintained separately.

The live publication step therefore required sync of:

1. generated favicon files to `/var/www/crewportglobal.com/`
2. HTML files containing favicon head references to `/var/www/crewportglobal.com/`

## 5. Published live files

The published live-domain favicon files are:

1. `/var/www/crewportglobal.com/favicon-16x16.png`
2. `/var/www/crewportglobal.com/favicon-32x32.png`
3. `/var/www/crewportglobal.com/apple-touch-icon.png`
4. `/var/www/crewportglobal.com/favicon.ico`

## 6. Validation results

The publication step was validated with the following checks:

1. favicon assets exist in the project public root;
2. favicon assets exist in the live domain root;
3. all current public HTML routes reference `/favicon.ico`;
4. `https://crewportglobal.com/favicon.ico` returns HTTP 200;
5. the live homepage head contains favicon links for `favicon-32x32.png`, `apple-touch-icon.png` and `favicon.ico`.

Observed result:

1. favicon publication is live on the domain;
2. the live root and project source root are currently synchronized for favicon assets and favicon head references.

## 7. Team maintenance rule

When the CrewPortGlobal favicon changes, update in the same slice:

1. `projects/crewportglobal/public/assets/Favicon.png` if the source brand image changes;
2. the generated favicon outputs in `projects/crewportglobal/public/`;
3. standalone public HTML pages if the favicon link set changes;
4. `projects/crewportglobal/scripts/generate_public_pages.py` if generated-page favicon wiring changes;
5. the live publication tree at `/var/www/crewportglobal.com/` if it remains a separate deploy root;
6. this record if the publication workflow changes materially.

## 8. Current limitation

Browser favicon display may remain temporarily stale after publication because browsers often cache favicon requests aggressively.

This is a browser-cache behavior and not, by itself, evidence of a failed publication step when live HTTP checks already return the new favicon successfully.

## 9. Out-of-scope confirmation

This favicon publication step did not require:

1. backend changes;
2. database changes;
3. authentication changes;
4. payment changes;
5. OpenClaw configuration changes;
6. nginx configuration changes.

## 10. Revision history

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 0.1 | 2026-05-13 | GTC IT / AI Assistant | Initial favicon publication record covering source asset, generated outputs, live deploy tree sync and validation results |