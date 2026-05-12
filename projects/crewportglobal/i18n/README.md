# CrewPortGlobal build-time i18n skeleton

This directory contains the seed build-time translation catalogs for CrewPortGlobal public text.

## Files

- en.json: pilot canonical English source catalog for automatic draft generation.
- ru.json: seeded Russian draft catalog.
- pt.json: seeded Portuguese draft catalog.
- uk.json: seeded Ukrainian draft catalog.

## Format

- Each file is a flat JSON object.
- Keys must match the publish-time i18n keys used by the shared public runtime.
- Values are plain strings.
- English remains the canonical source language.

## Example workflow

1. Update projects/crewportglobal/i18n/en.json when approved source strings are added to the pilot catalog.
2. Refresh draft target catalogs with python projects/crewportglobal/scripts/update_translations.example.py --targets ru pt uk
3. Validate coverage with node projects/crewportglobal/scripts/check_public_i18n.js
4. Keep sensitive publication text under human review before release.

## Boundary

This directory is a minimal skeleton.

The live public site still consumes the shared runtime dictionary in projects/crewportglobal/public/assets/crewportglobal-public-i18n.js and the homepage page-local dictionary in projects/crewportglobal/public/index.html.

No real provider credential should be committed to the repository.