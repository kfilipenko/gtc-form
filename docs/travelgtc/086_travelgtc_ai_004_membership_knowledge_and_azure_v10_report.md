# TRAVELGTC-AI-004 - Membership Knowledge And Azure Version 10 Report

- Project: TravelGTC
- Code: TRAVELGTC-AI-004
- Date: 2026-07-12
- Status: Implemented and published
- Depends on: TRAVELGTC-AI-001, TRAVELGTC-AI-003

## 1. Purpose

Publish the approved sales-oriented Mira TravelGTC instruction and connect the AI chat to a project-local membership knowledge base so that the agent can explain Travel Advantage Membership, Elite, Turbo add-on, Loyalty Points and group/business scenarios more clearly.

## 2. Published Agent Instruction

The approved instruction from `080_travelgtc_ai_001_mira_consultant_instruction.md` was published to Azure Foundry as:

| Parameter | Value |
|---|---|
| Agent | `AI-TravelGTC` |
| Published version | `10` |
| Runtime version | `TRAVELGTC_AZURE_AI_AGENT_VERSION=10` |
| Endpoint | `https://gtcagentsubwf-project-resource.services.ai.azure.com/api/projects/gtcagentsubwf-project` |

Version 10 keeps the Project Owner-approved sales logic and adds a stricter rule for Loyalty Points:

1. Loyalty Points must be explained as travel-value inside the program, not cash.
2. `1 Loyalty Point` may correspond to `$1 travel-value` only where the official booking flow allows redemption.
3. Mira must not invent redemption categories and must not say that Loyalty Points universally apply to flights, cruises, hotels or every travel category.
4. Correct wording is `допустимый заказ`, `official booking flow` and `Life Experiences where applicable`.

## 3. Knowledge Base Added To The API

The API now enriches membership-related AI questions with a controlled project-local knowledge context from:

```text
projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts
```

The module is activated only for relevant questions about:

1. Membership levels and tariffs;
2. VIP, VIP180, Elite and Turbo add-on;
3. Loyalty Points, Travel Credits and travel-value;
4. family, friends, groups and clients;
5. retreats, yoga, qigong, wellness and expert communities;
6. Ambassador and business-development scenarios.

The backend answer guard also normalizes over-specific Loyalty Points category examples. If the agent tries to present hotels, flights or cruises as universal point-redemption examples, the wording is replaced with a neutral approved phrase:

```text
допустимых заказов, где официальный booking flow разрешает списание
```

## 4. Public Documents

The working comparison document is published on the TravelGTC site:

```text
https://travelgtc.com/assets/docs/MembershipBenefits-RU.pdf
```

The public markdown source is also kept in the project:

```text
projects/travelgtc/public/assets/docs/travel-advantage-membership-benefits-ru.md
```

Official source for final verification:

```text
https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf
```

## 5. Business Scenarios Added

Mira may now actively identify needs where a higher membership level and Ambassador path may be relevant:

1. family travel and trips for close relatives;
2. gifts such as honeymoon or special-event travel;
3. friends and small communities traveling together;
4. yoga, qigong, wellness, acupuncture and retreat leaders with their own groups;
5. trainers, experts and event organizers who already gather audiences;
6. client travel offers and private travel formats;
7. future Ambassador referral and network-building scenarios.

The framing must remain positive and commercial, but precise:

```text
использование travel-value и клубных возможностей для создания более выгодного или уникального travel-предложения
```

The agent must not call this cash withdrawal or promise guaranteed income.

## 6. Runtime And Source Defaults

Updated source defaults:

1. `projects/travelgtc/app/.env.example`
2. `projects/travelgtc/app/src/server/config.ts`

Both now point to Azure agent version `10`.

## 7. Cleanup

Duplicate draft documents under the project-local draft folder were not kept as canonical records. The canonical documentation is stored in:

```text
docs/travelgtc/
```

The duplicate source PDF in the image inbox was removed because the identical public copy is stored under:

```text
projects/travelgtc/public/assets/docs/MembershipBenefits-RU.pdf
```

## 8. Verification

Required verification scope:

1. TypeScript/backend test suite;
2. TravelGTC API health endpoint;
3. public PDF availability;
4. live AI chat answer for membership/tariff/points;
5. live AI chat answer for group/business scenario.

The final commit for this task must include only the canonical documentation, API source changes and public document assets.
