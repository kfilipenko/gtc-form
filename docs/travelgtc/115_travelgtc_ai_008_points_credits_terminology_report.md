# TRAVELGTC-AI-008 - Points And Credits Terminology Report

- Project: TravelGTC
- Code: TRAVELGTC-AI-008
- Date: 2026-07-29
- Status: Implemented locally, Azure publication recommended
- Scope: Mira instruction, runtime membership knowledge context, official source links

## 1. Purpose

Clarify Mira TravelGTC's explanation of Travel Advantage value units so that she does not confuse:

1. Travel Credits;
2. Loyalty Points;
3. Guest Passes;
4. Ambassador commissions.

The Project Owner identified a possible ambiguity in the prior wording because Russian user conversations often use a generic word such as `бонусы` for both Travel Credits and Loyalty Points.

## 2. Official Source Check

The update is based on the following official/support resources:

1. Membership Benefits PDF v25.05.01:
   https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf
2. MWR Life FAQ / Travel Advantage troubleshooting guide:
   https://mwracademy.com/wp-content/uploads/2025/07/FAQ-MWR-Life-V16_May-2025-ENG.pdf

The source distinction recorded for Mira:

1. Travel Credits:
   - earned from eligible bookings;
   - stored in the account and used at checkout if applicable;
   - official Membership Benefits PDF states `Value $.01`;
   - FAQ explains this as `100 Travel Credits = $1 deduction`.
2. Loyalty Points:
   - separate ELITE / ELITE + TURBO travel-value mechanism;
   - FAQ explains that `1 Loyalty Point = $1 deducted` when the reservation is eligible for Loyalty Points;
   - not cash, not bank income and not redeemable for cash;
   - actual application depends on the official booking flow and concrete order rules.

## 3. Implemented Changes

Updated:

1. `docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md`
2. `projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts`

Mira is now instructed to clarify the term whenever a user says:

1. `бонусы`;
2. `кредиты`;
3. `баллы`;
4. `доллары на счёте`;
5. `удвоение`;
6. `уплаченная сумма зачисляется 1 к 1`.

Approved explanation:

> Travel Credits count differently: 100 Travel Credits may correspond to $1 deduction. Loyalty Points are a separate ELITE / ELITE + TURBO travel-value mechanism: where eligible, 1 Loyalty Point may correspond to $1 travel-value. Neither mechanism is cash.

## 4. Runtime Impact

The site already enriches relevant Mira questions with the local membership knowledge context before sending them to the Azure Foundry agent.

Therefore, this terminology clarification affects TravelGTC site answers immediately after application restart, even before the hosted Azure agent instruction is manually republished.

## 5. Azure Publication Note

The canonical instruction is updated locally. The hosted Azure Foundry `AI-TravelGTC` agent should be republished as the next controlled version so that the same terminology rules also live directly inside the Azure agent configuration.

Until then, TravelGTC runtime context and answer guards provide the corrected terminology during website chat calls.
