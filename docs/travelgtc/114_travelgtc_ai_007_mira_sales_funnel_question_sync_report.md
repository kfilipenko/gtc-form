# TRAVELGTC-AI-007 - Mira Sales Funnel Question Sync Report

- Project: TravelGTC
- Code: TRAVELGTC-AI-007
- Date: 2026-07-29
- Status: Implemented locally, prepared for next Azure instruction publication
- Scope: Mira instruction, `/mira/` first-question selector, public/browser fallback, server fallback and tests

## 1. Purpose

Synchronize Mira's public chat questions with the current TravelGTC sales funnel.

The chat should not behave like a neutral FAQ selector. It must open a needs-discovery dialogue that helps the user move from motive to Membership comparison, official Travel Advantage / MWR Life links and, when relevant, Ambassador discussion.

## 2. Implemented Changes

The `/mira/` first-question selector now starts sales-oriented conversations around:

1. Membership selection;
2. frequent travel;
3. family and close people;
4. Free Guest Pass;
5. VIP versus Elite / Turbo add-on;
6. groups, students and clients;
7. events and club environment;
8. Ambassador and business direction;
9. gift travel;
10. retreats and active trips;
11. MWR Life / Travel Advantage / TravelGTC relationship;
12. official registration or Membership purchase.

Scenario links from `/events/` were synchronized to the same stronger purchase-oriented questions.

## 3. Mira Instruction Update

`080_travelgtc_ai_001_mira_consultant_instruction.md` now includes a dedicated `Sales Funnel First Questions` section.

The instruction records:

1. the exact public first-question set;
2. the sales goal behind each question;
3. a repeatable needs-to-offer ladder;
4. the current verified TravelGTC links;
5. the rule that Mira should provide official links and offer partner support when needed, rather than routing every ready user to the removed short request form.

Azure Foundry still needs a controlled publication step if the hosted agent instruction must be updated from this local canonical document.

## 4. Fallback Behavior

Both frontend and backend fallback answers were updated so that, if Azure is unavailable, Mira still:

1. asks needs-discovery questions;
2. compares maximum-fit scenarios before lower levels;
3. distinguishes Free Guest Pass, VIP Membership and official partner registration;
4. uses family, group, client, event and Ambassador motives as sales paths;
5. avoids the outdated phrase `оставить заявку ниже`.

## 5. Verification Scope

Updated tests cover:

1. the dedicated Mira question selector;
2. registration gate with the new purchase-oriented questions;
3. `/events/` scenario prefill into `/mira/`;
4. responsive public page behavior.

## 6. Next Step

Publish the updated canonical instruction into the Azure Foundry `AI-TravelGTC` agent as the next version after Project Owner confirmation of the exact instruction text.
