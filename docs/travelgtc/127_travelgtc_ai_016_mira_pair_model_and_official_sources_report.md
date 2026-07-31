# TRAVELGTC-AI-016 - Mira Pair Model and Official Sources Report

- Project: TravelGTC
- Code: TRAVELGTC-AI-016
- Date: 2026-07-31
- Status: Implemented
- Azure agent: `AI-TravelGTC`, version `27`

## Delivered

1. Published the owner-provided, unmodified pair-model presentation at the stable public route:
   `https://travelgtc.com/assets/docs/TravelGTC_Membership_Model_Presentation.pptx`.
2. Added a homepage Membership block linking to the presentation.
3. Replaced Mira's starter questions with seven sales-first scenario entries: family, pair model, frequent travel, group/client travel, Elite + Turbo, business direction and registration.
4. Published Azure instruction version 28. Mira now uses a short discovery dialogue, a pair/family model, correct partner-count explanation, a 490 Loyalty Points current-example rule, one-link PDF delivery after consent and official dynamic sources.
5. Updated the API Membership knowledge layer so a direct pair-model request receives the PDF, while scenario starts remain dialogue-first.
6. Switched `travelgtc-api.service` to Azure agent version 28 and rebuilt the API.

## Core Operating Rules

- Mira first discovers the travel motive and scenario, then introduces a strong Elite + Turbo path only where it fits confirmed needs.
- Lower Membership levels remain available when the stronger scenario is unnecessary or unsuitable for the visitor's budget.
- Loyalty Points are described as travel-value in permitted official booking flows, never as cash, a refund or a guaranteed financial result.
- The pair deck is offered after a relevant scenario is identified or sent immediately on a direct request.
- Mira sends one relevant source after consent rather than a bundle of links.

## Verification

- Targeted Membership knowledge tests pass.
- TypeScript build passes.
- `travelgtc-api.service` is active after the version switch.
- Public deployment and live route checks are recorded with this release.
