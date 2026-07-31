# TRAVELGTC-AI-012 - Document Choice Before File Delivery Report

- Project: TravelGTC
- Code: TRAVELGTC-AI-012
- Date: 2026-07-29
- Status: Implemented and published

## 1. Purpose

Make Mira's document delivery closer to human consultation.

Instead of sending PDF, FAQ, table or presentation links immediately when the user asks about tariffs, prices, conditions, points or comparison, Mira must first ask which answer format is more convenient:

```text
Могу объяснить здесь в чате или дать ссылку на официальный документ / таблицу сравнения. Как вам удобнее?
```

Documents are sent only after a clear positive user reply such as:

1. `да, дай файл`;
2. `пришли PDF`;
3. `скинь таблицу`;
4. `хочу документ`;
5. `открой ссылку`;
6. `давай презентацию`;
7. `покажи официальный документ`.

## 2. Implemented Changes

Updated canonical instruction:

```text
docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md
```

Updated runtime guard:

```text
projects/travelgtc/app/src/modules/ai/membershipKnowledge.ts
```

Behavior:

1. tariff / price / condition questions trigger a chat-or-file choice;
2. PDF / FAQ / table / presentation links are stripped unless the user explicitly asks to receive a file or link;
3. short no-pressure explanations stay in chat and do not force a document offer;
4. direct consent such as `Да, пришли PDF и таблицу сравнения` sends the working RU document, official EN PDF and FAQ links.

## 3. Azure Publication

Azure Foundry agent:

```text
AI-TravelGTC
```

Published new version:

```text
14
```

Runtime was switched to:

```text
TRAVELGTC_AZURE_AI_AGENT_VERSION=14
```

## 4. Live Verification

Verified through authenticated live API dialogue at:

```text
https://travelgtc.com
```

Prompts tested:

1. `Какие тарифы Travel Advantage лучше сравнить для семьи?`
2. `Да, пришли PDF и таблицу сравнения.`
3. `Я слышал про баллы и Travel Credits, но боюсь запутаться. Объясни коротко и без рекламного давления.`

Observed behavior:

1. first tariff question did not include document links and asked the user to choose chat explanation or official document/table;
2. explicit consent sent the document links;
3. short no-pressure explanation stayed in chat with no document links.

Health check confirmed:

```json
{
  "azure_ai_agent_name": "AI-TravelGTC",
  "azure_ai_agent_version": "14"
}
```

## 5. Verification Commands

```bash
cd /var/www/gtc-form/projects/travelgtc/app
npm run check
```

Result:

```text
3 test files passed
28 tests passed
```
