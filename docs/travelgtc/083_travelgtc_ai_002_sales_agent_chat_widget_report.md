# TRAVELGTC-AI-002 - Sales Agent And Public Chat Widget Report

- Project: TravelGTC
- Code: TRAVELGTC-AI-002
- Source instruction: `docs/travelgtc/080_travelgtc_ai_001_mira_consultant_instruction.md`
- Date: 2026-07-11
- Status: Implemented and published

## 1. Summary

The public TravelGTC AI consultant was moved from a simple routing assistant toward a sales-oriented Travel Advantage membership consultant.

The agent still keeps compliance boundaries: TravelGTC is a partner information page of an independent Lifestyle Ambassador, not the official MWR Life or Travel Advantage site, and the agent must not invent prices, tariff details, referral links, income claims or guaranteed savings.

## 2. Azure Agent Configuration

Azure Foundry agent:

```text
AI-TravelGTC
```

Project endpoint:

```text
https://gtcagentsubwf-project-resource.services.ai.azure.com/api/projects/gtcagentsubwf-project
```

The production runtime now uses:

```text
TRAVELGTC_AZURE_AI_AGENT_VERSION=8
```

Version `8` was created from the previous published agent and includes the stronger Mira TravelGTC instruction.

## 3. Agent Behavior

Mira now follows this sales flow:

1. answer the user's question;
2. connect the answer to a real travel motive;
3. ask one useful qualifying question;
4. offer the official Membership Benefits PDF when tariff choice is relevant;
5. route to the TravelGTC form or human partner when the user is ready for the next step.

Mira may tell short stories about participant meetings, travel friends, useful contacts, couples or business acquaintances. These stories must be framed as examples of atmosphere and possible scenarios, not promised results.

## 4. Public Chat Widget

Updated:

```text
projects/travelgtc/public/index.html
projects/travelgtc/public/assets/css/site.css
projects/travelgtc/public/assets/js/site.js
```

The public chat widget now supports:

1. branded TravelGTC avatar in the chat header;
2. three initial question buttons loaded into the page interface;
3. browser voice-to-text input button for supported browsers;
4. sales-oriented introductory message from Mira;
5. improved fallback answers when Azure is unavailable.

Current initial questions:

1. `Какой тариф Travel Advantage подойдёт мне для путешествий и семьи?`
2. `Чем членство Travel Advantage отличается от обычного бронирования?`
3. `Как через TravelGTC узнать условия и перейти к покупке тарифа?`

## 5. Voice Limitation

The site currently implements voice input through the browser Speech Recognition API:

```text
SpeechRecognition / webkitSpeechRecognition
```

This means the visitor can dictate a question into the chat field if their browser supports speech recognition and microphone access is granted.

This is not yet a full Azure real-time voice conversation. A future stage may add a dedicated voice-live client or an official Microsoft embed if Azure provides a suitable public widget for the project.

## 6. Backend Safety Guard

Updated:

```text
projects/travelgtc/app/src/modules/ai/azureFoundryAgent.ts
```

The API now applies an additional guard to Azure answers:

1. story answers about meetings and acquaintances receive a non-guarantee clarification when needed;
2. tariff answers that mention discounts, bonuses, Travel Credits or membership-level details receive a reminder to check the official Membership Benefits PDF or a TravelGTC partner.

This protects the site if the agent response becomes too specific despite the system instruction.

## 7. Verification

Backend:

```text
cd projects/travelgtc/app
npm run check
Result: 17 passed
```

Responsive and integration tests:

```text
npm run test:travelgtc
Result: 21 passed
```

Production health:

```text
https://travelgtc.com/api/travelgtc/v1/health
azure_ai_agent_version: 8
ai_chat_mode: azure
```

Production chat markup includes the avatar, starter questions and voice-input button.

## 8. Publication

Static publication:

```text
projects/travelgtc/scripts/deploy_public_live.sh
```

Live domain:

```text
https://travelgtc.com/
```
