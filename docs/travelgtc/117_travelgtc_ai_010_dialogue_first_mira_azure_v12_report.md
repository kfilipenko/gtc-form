# TRAVELGTC-AI-010 - Dialogue-First Mira Azure Version 12 Report

- Project: TravelGTC
- Code: TRAVELGTC-AI-010
- Date: 2026-07-29
- Status: Implemented and published; superseded by TRAVELGTC-AI-011 / Azure version 13
- Scope: Mira scenario-start behavior, local runtime knowledge guard, Azure Foundry agent version 12

## 1. Reason

The `/events/` page now routes visitors into prepared Mira scenarios. The first response must feel like a conversation, not a long page copied into chat.

The previous behavior was too verbose for the `next-step` scenario: Mira listed Free Guest Pass, VIP, Elite, Turbo, Ambassador, PDFs and links before the user answered a first qualifying question.

## 2. Implemented Behavior

For first scenario starts such as:

```text
Я хочу понять, какой следующий шаг мне подходит...
```

Mira must:

1. greet warmly;
2. mirror the user's motive;
3. keep the answer short;
4. ask exactly one qualifying question;
5. avoid tariff lists, PDF links, official links and disclaimers until the user answers or directly asks for them.

## 3. Runtime Changes

Updated:

```text
projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts
projects/travelgtc/app/src/modules/ai/azureFoundryAgent.ts
```

Key changes:

1. added `isDialogueFirstQuestion`;
2. injected a dialogue-first instruction into the local Azure prompt context;
3. prevented automatic PDF/link attachment for first scenario starts;
4. prevented the story/disclaimer suffix from being appended to first scenario starts.

## 4. Azure Publication

The canonical instruction was updated:

```text
docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md
```

Azure Foundry agent:

```text
AI-TravelGTC
```

Published new version:

```text
12
```

Runtime was switched to:

```text
TRAVELGTC_AZURE_AI_AGENT_VERSION=12
```

## 5. Live Verification

Health check confirms:

```text
ai_chat_mode: azure
azure_ai_agent_name: AI-TravelGTC
azure_ai_agent_version: 12
```

Live test prompt:

```text
Я хочу понять, какой следующий шаг мне подходит: Free Guest Pass, Membership, VIP Membership, регистрация по партнёрской ссылке или сопровождение TravelGTC. Помоги выбрать по моей ситуации.
```

Observed behavior:

1. short conversational reply;
2. no tariff dump;
3. no PDF/link dump;
4. one qualifying question about the user's primary motive.

## 6. Verification Commands

```bash
npm run check
```

Result:

```text
3 test files passed
22 tests passed
```

The production API service was restarted after build:

```bash
sudo systemctl restart travelgtc-api.service
```
