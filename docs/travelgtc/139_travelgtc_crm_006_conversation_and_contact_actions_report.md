# TRAVELGTC-CRM-006 - Conversation And Contact Actions Report

- Project: TravelGTC
- Date: 2026-08-05
- Status: Implemented

## Delivered

1. Customer cards now have a dedicated `Диалог с Мирой` section. The latest session
   opens first; earlier sessions remain compact until opened. Customer and Mira
   messages use distinct bubbles and safe Markdown-like formatting for headings,
   paragraphs, bold text and line breaks.
2. The former general history is now an operational history: notes, profile changes
   and team contact actions are visible without duplicating whole AI conversations.
3. The protected `Связаться с клиентом` panel uses contact data from the TravelGTC
   account only. It can send an individually composed email through the configured
   SMTP service, initiate a telephone call, or open a prepared WhatsApp draft.
4. Every action is written to the existing project-local interaction history. Email
   is logged only after successful SMTP delivery; phone and WhatsApp are precisely
   labelled `call_opened` and `whatsapp_draft_opened`. The team can then record the
   factual result: contact made, no answer, follow-up needed or not sent.

## Protected API

```text
GET  /api/travelgtc/v1/crm/customers/:contactId/conversations
POST /api/travelgtc/v1/crm/customers/:contactId/contact-actions/email
POST /api/travelgtc/v1/crm/customers/:contactId/contact-actions/external
POST /api/travelgtc/v1/crm/contact-actions/:actionId/outcome
```

All routes require TravelGTC `team` or `admin` access. No public page can choose an
arbitrary recipient, send a message or read a conversation.

## Verification

```text
npm --prefix projects/travelgtc/app run build  PASS
npm --prefix projects/travelgtc/app test       37 passed
npx playwright ... --grep "fresh Mira answer" PASS
```

The full responsive suite recorded one pre-existing intermittent Mira viewport check
on its first run; the exact test passed immediately when run alone. The CRM change
does not alter that chat component.

## Follow-up

The next optional CRM stage can add a team-entered outcome and note after a phone or
WhatsApp action. It must remain explicit: the browser opening an app is not evidence
that a call was answered or a message delivered.
