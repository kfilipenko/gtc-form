# Chat ↔ n8n Webhook JSON Contract

> Drafted 2025-11-26. Source of truth: `chat/index.html` (frontend) and `chat_api.php` (API proxy/logger).

## 1. Overview
- **Webhook URL:** `https://agent.gtstor.com/webhook/chat`.
- **Transport:** HTTPS POST with `Content-Type: application/json`, UTF-8 body.
- **Consumers:**
  - Browser client sends requests directly to n8n when the user submits a message.
  - `chat_api.php` can forward identical payloads in "proxy" mode (used by other channels) and always logs conversations in "log" mode.
- **Authentication:** Relies on upstream validation inside n8n — no tokens added by the chat frontend. Backend proxy may enrich metadata with server-only fields.

## 2. Incoming JSON (chat → n8n)
The frontend builds the payload in `buildPayload()` and adds telemetry from `captureRequestHeaders()`.

```jsonc
{
  "channel": "web",                   // string; required. Source channel hint for routing.
  "message": "string",                // string; required. User message body.
  "session_id": "uuid",               // string; required. Stable per-browser session.
  "client": {
    "gtc_user_id": 12345,             // integer; required. Populated after auth.
    "user_id": 987,                   // optional legacy ID.
    "email": "user@example.com",     // optional; best-known email.
    "locale": "en-US",               // optional locale from browser.
    "timezone": "Europe/Prague",     // optional IANA tz.
    "metadata": {
      "full_name": "Ada Lovelace"    // optional free-form fields.
    }
  },
  "metadata": {
    "page": "/chat",                 // optional. Pathname where the chat runs.
    "user_agent": "...",              // optional.
    "language": "en-US"              // optional.
  },
  "headers": {                         // optional snapshot of browser headers for triage.
    "origin": "https://chat.gtstor.com",
    "referer": "…",
    "accept-language": "en-US,en;q=0.9",
    "user-agent": "…",
    "sec-ch-ua": "…",
    "sec-ch-ua-platform": "ChromeOS",
    "x-device-cores": "8"
  },
  "source": "web_chat_frontend",      // string. Helps identify producer in logs.
  "chat_id": "ch_abc123" | null,      // string or null. Existing chat thread; created server-side if absent.
  "mode": "proxy" | "log" (proxy mode only when using chat_api.php).
}
```

### Mandatory fields
`message`, `session_id`, `client.gtc_user_id`, and `channel` are always required before hitting the webhook. The frontend blocks submission if `gtc_user_id` is missing.

### Optional controls (`chat_api.php` only)
When other services post via `chat_api.php`, they may include:
- `log_user` / `log_assistant` (bool) – control DB logging per role.
- `metadata`, `headers`, `trace_id`, `stage`, `webhookUrl`, `executionMode` – preserved inside DB metadata for auditing.

## 3. Outgoing JSON (n8n → chat)
The frontend and proxy expect the webhook to return JSON. Successful payloads must follow this contract:

```jsonc
{
  "success": true,                     // boolean; required for proxy compatibility.
  "chat_id": "ch_abc123",            // string; optional but recommended. Persists threads.
  "reply": "Text to display",        // string; primary assistant reply.
  "trace_id": "wf-20251126-001",    // string; optional. n8n execution trace.
  "stage": "qualifying",             // string; optional. High-level workflow stage.
  "output": "…", "message": "…",
  "answer": "…", "text": "…"      // optional aliases – frontend falls back to these
                                        // when `reply` is missing.
  // any extra diagnostic fields are echoed back into assistant log metadata.
}
```

### Error responses
Return non-200 status or `{ "success": false, "message": "…" }` to surface issues. The frontend interprets:
- `401` or `{ "code": "unauthorized" }` → sign out user.
- `402` or `{ "status": "payment_required" }` → prompt subscription.
- `>=500` or `{ "status": "error" }` → show generic server error.

### Empty replies
If `reply` (or its aliases) resolves to an empty string, the frontend shows “Awaiting workflow response…”, and `chat_api.php` treats it as a webhook failure (HTTP 502 to the client).

## 4. Logging & Persistence
- Every outbound payload (user + assistant) is queued to `/chat_api.php` with `mode: "log"`. The script writes records into `chat_messages` together with metadata such as headers, trace IDs, and workflow response bodies (`response`).
- When services need synchronous replies through the backend, they post the same payload with `mode: "proxy"`. The proxy stores the message, forwards it to n8n, and returns the webhook response to the caller.
- `chat_id` management lives server-side: if the request lacks it, the proxy creates one based on the `message` preview and `gtc_user_id`.

## 5. Validation Checklist
1. Ensure `client.gtc_user_id` is a positive integer; the proxy rejects others.
2. Keep `session_id` stable per browser tab until reset.
3. When introducing new metadata keys, confirm n8n ignores unknown fields.
4. Always respond with JSON and include a human-readable `reply` for the UI.
5. Populate `trace_id` for analytics; values propagate to UI badges and DB logs.

## 6. Sample Flow
1. Browser gathers context and POSTs the payload above to `N8N_WEBHOOK_URL`.
2. n8n workflow processes the message, crafts `{ success: true, reply: "…", trace_id: "…" }`.
3. Frontend displays the reply, stores history locally, and enqueues an assistant log to `/chat_api.php` along with the full workflow response for auditing.
4. Optional: backend services can replay the same payload via `chat_api.php?mode=proxy` to reuse logging + chat persistence while still leveraging the n8n workflow.
