# TRAVELGTC-AI-009 - Mira Azure Publication Package

- Project: TravelGTC
- Code: TRAVELGTC-AI-009
- Date: 2026-07-29
- Status: Published to Azure Foundry, superseded by TRAVELGTC-AI-010 / Azure version 12
- Target agent: `AI-TravelGTC`
- Published Azure version: `11`
- Current live runtime version: `12`

## 1. Purpose

Prepare and record the final instruction package for the Azure Foundry publication of Mira TravelGTC before Project Owner presentation.

This package consolidates the latest approved work:

1. needs-based sales funnel questions;
2. TravelGTC opportunity scenario routing;
3. Free Guest Pass / VIP Membership / referral registration links;
4. Travel Credits versus Loyalty Points terminology;
5. official document links;
6. tone, structure and compliance boundaries.

## 2. Azure Agent Identity

Use the existing Azure Foundry agent:

```text
AI-TravelGTC
```

Recommended public-facing name:

```text
Мира TravelGTC
```

Recommended short description:

```text
Мира помогает разобраться в Travel Advantage, MWR Life, Membership, Free Guest Pass, VIP/Elite/Turbo, роли Lifestyle Ambassador и подсказывает официальный следующий шаг через TravelGTC.
```

## 3. Instruction Source

Use the canonical instruction section:

```text
docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md
Section 10. Azure Instruction Candidate - Next Version
```

This section is the clean instruction text intended for the Azure Foundry `Instructions` field.

Do not paste the whole canonical document into Azure. Paste only the text block inside Section 10.

## 4. Required Official Links In Azure Instruction

The Azure instruction must include these links:

```text
MWR Life: https://www.mwrlife.com/
MWR Life Membership: https://www.mwrlife.com/home/membership
MWR Life Opportunity: https://www.mwrlife.com/home/opportunity
MWR Life Company: https://www.mwrlife.com/home/company
Travel Advantage: https://www.traveladvantage.com/home
VIP Membership Travel Advantage: https://vip.traveladvantage.com/KFilip909
Free Guest Pass Travel Advantage: https://free.traveladvantage.com/KFilip909
TravelGTC opportunities map: https://travelgtc.com/events/
Official Membership Benefits PDF: https://mwrlifecontent-pro.s3.amazonaws.com/PDF-and-other-files/MembershipBenefits-EN.pdf
MWR Life FAQ / Travel Advantage troubleshooting guide: https://mwracademy.com/wp-content/uploads/2025/07/FAQ-MWR-Life-V16_May-2025-ENG.pdf
Policies and Procedures: https://www.mwrlife.com/content/policiesandprocedures.pdf
Income Disclosure: https://www.mwrlife.com/content/IncomeDisclosure.pdf
TravelGTC: https://travelgtc.com/
Official referral registration: https://www.mwrlife.com/KFilip909
```

## 5. Starter Questions For Chat Settings

Use three short starter questions in Azure chat settings:

```text
Хочу подобрать Membership под мои поездки. С чего начать?
```

```text
Хочу понять, когда достаточно VIP, а когда стоит сравнить Elite и Turbo.
```

```text
У меня есть семья, группа или клиенты. Как Travel Advantage может быть полезен?
```

The full TravelGTC website `/mira/` selector contains a larger first-question set. Azure preview needs only three visible starter questions.

## 6. Non-Negotiable Terminology Rule

Mira must not merge Travel Credits and Loyalty Points under a generic word such as `bonus`.

Approved explanation:

```text
Travel Credits считаются иначе: 100 Travel Credits могут соответствовать $1 deduction.
Loyalty Points — отдельный ELITE / ELITE + TURBO travel-value механизм: при допустимом списании 1 Loyalty Point может соответствовать $1 travel-value.
Оба механизма не являются cash и применяются только по правилам конкретного booking flow.
```

If a user says `бонусы`, `кредиты`, `баллы`, `доллары на счёте`, `удвоение` or `уплаченная сумма зачисляется 1 к 1`, Mira must first clarify which mechanism is meant:

1. Travel Credits;
2. Loyalty Points;
3. Guest Passes;
4. Ambassador commissions.

## 7. Presentation Test Prompts

After publishing the new Azure agent version, test these prompts in Azure preview and on `https://travelgtc.com/mira/`:

1. `Хочу подобрать Membership для семьи. Что лучше сравнить?`
2. `В чем разница между Travel Credits и Loyalty Points?`
3. `Я хочу Free Guest Pass, но возможно потом подключить тариф. Какой путь?`
4. `У меня есть группа по йоге. Как использовать Travel Advantage для ретрита?`
5. `Хочу зарегистрироваться. Дай официальный следующий шаг.`

Expected behavior:

1. Mira answers warmly and structurally.
2. Mira asks one needs-discovery question instead of dumping a survey.
3. Mira distinguishes Free Guest Pass, VIP Membership and official referral registration.
4. Mira explains Travel Credits and Loyalty Points correctly.
5. Mira uses official links and does not promise guaranteed savings, income or country availability.

## 8. Runtime Update After Azure Publication

Azure created:

```text
AI-TravelGTC version 11
status: active
model: gpt-4o
```

The server env variable was updated:

```text
TRAVELGTC_AZURE_AI_AGENT_VERSION=11
```

The API service was restarted:

```bash
sudo systemctl restart travelgtc-api.service
```

Verification:

```bash
curl -fsS https://travelgtc.com/api/travelgtc/v1/health
```

At the time of this package, the health response showed:

```text
ai_chat_mode: azure
azure_ai_agent_name: AI-TravelGTC
azure_ai_agent_version: 11
```

Current live runtime has since moved to Azure version 12. See:

```text
docs/travelgtc/117_travelgtc_ai_010_dialogue_first_mira_azure_v12_report.md
```

## 9. Current Implementation Note

TravelGTC runtime already injects the local Membership knowledge context into relevant Mira questions through:

```text
projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts
```

Therefore the website has an additional local safeguard even before the hosted Azure instruction is republished.
