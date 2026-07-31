# TRAVELGTC-WEB-048 - Sales Landing Root Publication Report

- Project: TravelGTC
- Date: 2026-07-31
- Status: Implemented

## Result

The needs-based Travel Advantage sales landing is now the canonical public root at `/`.

## Route Model

| Route | Purpose |
|---|---|
| `/` | Primary sales landing: travel, family, group, club and Ambassador scenarios leading to Mira. |
| `/information/` | Preserved detailed reference material for MWR Life, Membership and Ambassador information. |
| `/events/` | Compatibility route that immediately returns the visitor to `/`, avoiding two competing sales pages. |

## Navigation

The public header now keeps one direct path for each purpose: root sales landing, MWR Life reference, Membership reference, Ambassador reference and Mira chat. The duplicate `Возможности` item is removed.

## Verification

- Playwright responsive suite covers the new root landing, preserved reference route and mobile overflow.
- Live publication is performed through the standard TravelGTC public deployment script.
