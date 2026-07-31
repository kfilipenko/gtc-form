# TRAVELGTC-AI-013 - Mira Sales Playbook Version 16 Report

- Project: TravelGTC
- Code: TRAVELGTC-AI-013
- Date: 2026-07-29
- Status: Implemented and published
- Scope: Mira Azure instruction, local membership knowledge context, answer guards, runtime publication and tests
- Published Azure agent: `AI-TravelGTC`
- Published Azure version: `16`

## 1. Purpose

Adapt the approved colleague conversation script into Mira's sales behavior.

Mira should no longer behave like a static information page or a router to a person. Her operating target is to create a warm sales conversation:

```text
путешествия -> членство -> сообщество -> личная рекомендация -> Ambassador-направление -> business-возможность
```

The desired result is a dialogue where the user recognizes their own travel, family, group or business motive and moves toward a correct official next step.

## 2. Implemented Instruction Changes

The canonical instruction was updated in:

```text
docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md
```

Added rules:

1. use the colleague sales script as internal logic, not public text;
2. start with one warm needs-discovery question instead of a full presentation;
3. identify needs for family, friends, groups, clients, events, experts, community leaders and Ambassador candidates;
4. continue interrupted conversations with a friendly return, not a restart;
5. avoid sending documents until the user explicitly confirms that a file/table/PDF is convenient;
6. after the user has already read a document, move to the next question or official link instead of resending the same files;
7. handle hesitation without pressure, discount promises or early heavy tariff dumping.

## 3. Runtime Knowledge Changes

Updated:

```text
projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts
projects/travelgtc/app/src/modules/ai/azureFoundryAgent.ts
```

Runtime behavior now adds local context before relevant Azure calls:

1. sales playbook and quality target;
2. return-after-pause guidance;
3. one-question continuation for hesitant users;
4. document-choice-before-file delivery;
5. post-document next-step handling;
6. Cyrillic answer guards for careful wording around discounts, bonuses, value and Elite in hesitation mode.

## 4. Publication

Azure Foundry version `16` was published for `AI-TravelGTC`.

Production runtime was switched to:

```text
TRAVELGTC_AZURE_AI_AGENT_VERSION=16
```

The API service was rebuilt and restarted:

```text
travelgtc-api.service
```

Live health reports:

```text
ai_chat_mode: azure
azure_ai_agent_name: AI-TravelGTC
azure_ai_agent_version: 16
```

## 5. Verification

Automated check:

```text
cd projects/travelgtc/app
npm run check
```

Result:

```text
3 test files passed
30 tests passed
```

Live checks on `https://travelgtc.com/api/travelgtc/v1/ai/chat` confirmed:

1. first scenario and hesitant questions now receive short dialogue-style answers;
2. document links are not appended to first scenario entries;
3. after `Я почитал документ. Теперь хочу ссылку...`, Mira gives official next-step links without reattaching PDF/FAQ links;
4. hesitant users receive a needs-discovery question instead of immediate registration pressure.

## 6. Next Tuning Focus

Continue testing Mira as a sales dialogue partner:

1. family trip scenario;
2. group leader / yoga / qigong / wellness scenario;
3. Ambassador business scenario;
4. interrupted dialogue after document reading;
5. explicit request for payment or registration link.

The target quality marker is simple: Mira should make the user feel understood, interested and ready for the next small step.
