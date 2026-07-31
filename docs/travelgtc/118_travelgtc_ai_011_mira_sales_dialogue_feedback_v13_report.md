# TRAVELGTC-AI-011 - Mira Sales Dialogue And Feedback Version 13 Report

- Project: TravelGTC
- Code: TRAVELGTC-AI-011
- Date: 2026-07-29
- Status: Implemented and published

## 1. Purpose

Improve Mira as a sales-oriented conversation agent, not a static information page in chat.

The goal is to make Mira:

1. identify needs before giving links;
2. keep hesitation as a trust-building stage, not purchase intent;
3. tell short travel-oriented stories and ask warm discovery questions;
4. avoid dumping PDF / FAQ links into every answer;
5. support user feedback in the chat UI.

## 2. Implemented Changes

Backend:

1. Published Azure agent version `13` from the canonical instruction.
2. Switched runtime env to `TRAVELGTC_AZURE_AI_AGENT_VERSION=13`.
3. Improved purchase-intent detection:
   - `пока не готов покупать`;
   - `сомневаюсь`;
   - `хочу сначала понять`;
   - `не спешу`;
   - `без давления`;
   now remain discovery / nurture, not `ready_to_subscribe`.
4. Added imperative link requests as purchase intent:
   - `дай ссылку`;
   - `покажи ссылку`;
   - `скинь ссылку`;
   - `пришли ссылку`.
5. Reduced automatic document attachment:
   - PDF / FAQ links are attached only when the user asks for official comparison, tariffs, prices, conditions, documents or confirmation.
6. Added a guard so ordinary scenario questions like `какой сценарий лучше?` are not treated as price/document requests.
7. Added `/api/travelgtc/v1/account/ai/chat/feedback` for authenticated chat reactions.

Frontend:

1. Added unobtrusive `👍 / 👎` answer feedback controls to Mira bot responses.
2. Feedback is saved in CRM as `ai_feedback` when the authenticated user has an AI chat lead.
3. Published updated `site.js` and `site.css` to live root.

Canonical instruction:

1. Updated `080_travelgtc_ai_001_mira_consultant_instruction.md`.
2. Added explicit rules for:
   - warm travel storytelling;
   - user-smile tone;
   - one-question discovery;
   - hesitation handling;
   - document-link restraint;
   - short dialogue-first replies.

## 3. Live Verification

Verified through authenticated live API dialogue at `https://travelgtc.com`.

Scenario tested:

1. first next-step question;
2. family travel with `я пока не готов покупать`;
3. group / retreat scenario;
4. Travel Credits and Loyalty Points explanation;
5. hesitation about expensive membership;
6. final request for registration link;
7. positive feedback submission.

Results:

1. `я пока не готов покупать` returned `purchase_intent=false`.
2. final `дай ссылку` returned `purchase_intent=true`.
3. referral URL returned: `https://www.mwrlife.com/KFilip909`.
4. feedback endpoint returned `feedback_persisted=true`.
5. active health reports Azure version `13`.

## 4. Verification Commands

```bash
cd /var/www/gtc-form/projects/travelgtc/app
npm run check
```

Result:

```text
3 test files passed
26 tests passed
```

Live health:

```bash
curl -fsS https://travelgtc.com/api/travelgtc/v1/health
```

Result included:

```json
{
  "ok": true,
  "azure_ai_agent_name": "AI-TravelGTC",
  "azure_ai_agent_version": "13"
}
```

## 5. Next Improvement Candidate

The next tuning pass should focus on the content quality of Mira's sales answers:

1. fewer repeated greetings in the same long conversation;
2. stronger short travel stories by scenario;
3. clearer distinction between Free Guest Pass, VIP Membership and full referral registration;
4. optional CRM view filter for positive / negative AI feedback.
