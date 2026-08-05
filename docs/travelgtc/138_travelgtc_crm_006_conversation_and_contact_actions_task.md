# TRAVELGTC-CRM-006 - Conversation View And Contact Actions

- Project: TravelGTC
- Owner: GTC INFORMATION TECHNOLOGY FZ-LLC
- Date: 2026-08-05
- Status: Implemented
- Source: Project owner review of the CRM customer card

## 1. Business Goal

The team must be able to read a customer's Mira dialogue quickly and continue a
contact without moving registration details into external spreadsheets or losing the
reason for the conversation.

The customer card must support this operational flow:

```text
customer profile
-> readable Mira dialogue
-> team selects the preferred contact channel
-> contact action is recorded in TravelGTC CRM
-> follow-up result and next step remain visible on the customer card
```

This is an internal CRM improvement. It does not expose personal contacts on public
pages and it does not change the public Mira funnel.

## 2. Current Issue

`/crm/customers/` currently combines all activity into one chronological list. AI
messages are stored correctly, but long conversations are hard to scan because they
are presented as plain text activity cards among notes, task events and status
changes. The CRM also has no dedicated, auditable contact action for an email,
telephone call or WhatsApp follow-up.

## 3. Scope

### 3.1 Readable Mira Conversation View

Add a dedicated `Диалог с Мирой` section inside the protected customer card.

1. Group `ai_chat` interactions into readable dialogue sessions. A session begins
   after a meaningful inactivity gap or an explicit new conversation context; the
   exact threshold must be documented in code and remain deterministic.
2. Render the messages in their natural chronological order inside a session:
   customer messages on one side, Mira replies on the other.
3. Preserve paragraphs, lists, headings, links and line breaks from Mira's stored
   Markdown-like content using a safe allow-list renderer. Never render untrusted
   HTML from a message body.
4. Show the newest dialogue session expanded by default. Older sessions are compact
   summaries that can be expanded on demand.
5. Keep the general timeline short: display contact actions, notes, tasks and stage
   changes there, with a link into the relevant dialogue session instead of repeating
   every full chat message.
6. Keep a clear timestamp, channel, message direction and source for every entry.
7. The conversation must remain readable on desktop and mobile with no clipped
   controls, horizontal overflow or forced scrolling through an entire long reply to
   find its beginning.

### 3.2 Contact Actions From The Customer Card

Add a protected `Связаться с клиентом` panel near the registration contact details.

Available actions depend on verified profile data:

1. **Email**: team member writes a subject and message in CRM, sends through the
   existing server-side TravelGTC SMTP transport, and the complete outgoing message,
   sender, recipient, time and delivery result are stored in CRM.
2. **Phone call**: opens a `tel:` action using the registered phone number and first
   records an internal action as `call_opened`. The CRM must never claim that a call
   happened or was answered automatically; the team member records the outcome after
   the call.
3. **WhatsApp**: opens a prefilled `wa.me` draft only when a valid phone number is
   present. The CRM stores it as `whatsapp_draft_opened`, not as a sent message. The
   team member can then confirm the actual outcome in CRM.
4. The customer's preferred registration channel is shown first and visually marked,
   while other available channels remain accessible.
5. Record the external-action state as `call_opened` or `whatsapp_draft_opened`.
   The team then records a factual follow-up result: `sent/placed`, `no_answer`,
   `follow_up_needed` or `not_sent`, plus an optional private note. The CRM never
   infers that an opened app means the call was answered or a message sent.
6. Email delivery failure must be visible to the team and stored as failure. No
   silent retry loop or duplicate sending.

### 3.3 CRM Data And API

Use the existing `travelgtc_interactions` model where it is suitable; add a focused,
additive migration only if message delivery status or action/outcome data cannot be
represented cleanly. Do not duplicate user accounts or contact details.

Proposed protected API contracts:

```text
GET  /api/travelgtc/v1/crm/customers/:contactId/conversations
POST /api/travelgtc/v1/crm/customers/:contactId/contact-actions/email
POST /api/travelgtc/v1/crm/customers/:contactId/contact-actions/external
POST /api/travelgtc/v1/crm/contact-actions/:actionId/outcome
```

All endpoints require TravelGTC `team` or `admin`. The backend obtains email and
telephone only from the protected TravelGTC profile/contact record; the browser must
not accept an arbitrary recipient address or phone number in the request body.

### 3.4 Email Rules

1. Use the existing project SMTP configuration only after an explicit team action.
2. Put a clear TravelGTC sender identity and reply path in the email configuration;
   do not expose the owner's private mailbox on public pages.
3. Store the exact outgoing CRM email text and technical send result for team work.
4. Keep email delivery separate from the project-owner notification emails already
   sent on an explicit subscription/registration intention.

## 4. Privacy And Compliance Rules

1. Customer conversations, contacts, outgoing email text and contact outcomes remain
   team/admin-only.
2. No contact action may be sent from a public page or by an ordinary authenticated
   user.
3. The CRM must not state that WhatsApp or a telephone call was completed unless a
   team member records that outcome.
4. Outgoing contact must use the customer's registered data and existing consent
   rules. The UI shows the selected channel before the action is confirmed.
5. Do not import contacts, documents or communication history from CrewPortGlobal,
   MWR Life or another project.

## 5. Out Of Scope

1. WhatsApp Business API, inbound WhatsApp synchronization, call recording or call
   analytics.
2. Full email inbox synchronization or automatic parsing of replies.
3. Public bulk marketing, campaigns, mass messages or automatic dialling.
4. Changing Mira's public chat instructions or authentication gate.

## 6. Acceptance Criteria

1. A long Mira dialogue is readable as formatted, expandable sessions rather than an
   unstructured activity feed.
2. The newest session opens at its beginning; the team can find earlier messages
   without losing the surrounding customer context.
3. A team/admin user can send an individually composed email through CRM and see a
   stored send result.
4. A phone or WhatsApp action records a truthful draft/opened event and allows the
   operator to record a factual outcome.
5. Contact actions always use the protected customer profile details and are not
   available to ordinary users.
6. Every manual contact action is visible in the general customer timeline with time,
   channel, operator and outcome.
7. API authorization, email failure handling, safe formatting and mobile layout are
   covered by automated tests.

## 7. Verification Plan

1. Add backend tests for team/admin authorization, recipient isolation, successful
   email send, SMTP failure and action outcome audit.
2. Add Playwright tests for formatted long dialogue, collapsed/expanded sessions,
   email compose/send flow and mobile card layout.
3. Verify a test email to a controlled project address before enabling real customer
   contact.
4. Run build, API tests, TravelGTC browser tests, live deploy and protected endpoint
   smoke tests.

## 8. Deliverables

1. Readable conversation-session UI in the customer card.
2. Safe message-format renderer.
3. CRM contact action panel, backend endpoints and audit/history records.
4. Additive migration only if needed.
5. Updated documentation, implementation report and focused commit.

## 9. Approval Requested

Approve `TRAVELGTC-CRM-006` to implement the readable Mira conversation workspace
and auditable CRM contact actions.
