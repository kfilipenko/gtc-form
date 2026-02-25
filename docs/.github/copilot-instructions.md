# Copilot Instructions

## Orientation
- Repo is documentation-first; runtime pieces live on prod hosts but are described here. Always cross-ref docs before Assuming behavior.
- Core artifacts: `chat/index.html` SPA (inline CSS/JS), PHP logger `/var/www/html/chat_api.php`, n8n workflows in `docs/workflows/*.json`, and Postgres schema from `chat_sql_persistence.md`.
- `gtc_user_id` is the universal identifier (see `gtc_user_id_standard.md`); never invent alternate IDs when wiring auth, billing, or chat persistence.

## Web Chat Client (chat/index.html)
- Single page controls everything through a global `state` ({ user, sending, sessionId, history, traceId }). Respect that structure when adding features to avoid race conditions.
- Persisted keys (`chat:user`, `chat:session`, `chat:history`, loose `gtc_user_id`) must stay backward compatible; new data goes into `metadata` objects to avoid breaking older deployments.
- Message flow: `sendMessage()` validates `state.user.gtc_user_id`, pushes to log, POSTs `https://agent.gtstor.com/webhook/chat`, then calls `queueSqlLog()` to `/chat_api.php` for SQL durability. Never change one path without the other.
- Status UI (`updateStatus`, `setChatStatus`, `pushSystem`) are the only approved surfaces for error/debug info; avoid ad-hoc DOM injections.

## SQL Persistence & Logger
- `chat_sql_persistence.md` defines the authoritative schema: `chats` + `chat_messages` with UUID PKs, metadata JSONB, logical deletes only. Align new migrations with that table contract.
- `/chat_api.php` supports `mode:'log'` (standard) and `mode:'proxy'` (fallback relay). Keep payload parity with the webhook contract so the logger can replay traffic if n8n is down.
- Debug production issues by tailing `chat_transactions.log` (`tail -f /var/www/html/chat_transactions.log`); entries mirror every log/proxy event with timestamps and trace IDs.

## n8n Workflows
- Import `docs/workflows/GTC Sales Agent - Web Chat.json` and `docs/workflows/Web Search OpenAI.json` into n8n as described in `web_chat_workflow_instructions.md`.
- Workflow contract: POST `/webhook/web-chat` with `{ message, session_id, client:{gtc_user_id,...}, metadata }` (see `web_chat_workflow_plan.md`). Always return `chat_id` so the browser and SQL logger stay in sync.
- Required creds/env: `DB_GTC` Postgres, `OPENAI_AZURE_CREDENTIAL`, `TAVILY_API_KEY`; missing any of these will break execution before the AI node runs.
- Test via the sample payload in `web_chat_workflow_instructions.md` and ensure both user/assistant rows appear in `chat_log`.

## Identity & Entitlements
- `gtc_user_id` assignment rules (sequential ints, resolved via passports) live in `gtc_user_id_standard.md`; all auth flows must ask the DB for the canonical ID instead of calculating locally.
- Subscription checks (Telegram + web chat) depend on `subscriptions` keyed by `gtc_user_id`; follow the SQL snippets in `billing/stripe-flow.md` when extending entitlements.

## Billing Portal & Stripe Bridge
- `payment.php` builds Billing links as `https://pay.gtstor.com/payment.php?gtc_user_id=<int>&email=<encoded>` and mirrors both values into Stripe via the `attach-metadata` action.
- Any change to the portal must continue setting `client_reference_id` and `metadata.gtc_user_id` so n8n can reconcile webhook events with subscriptions.
- Stripe events are processed only by the n8n listener; do not enable duplicate listeners or you risk double-granting access.

## Developer Workflow
- When touching chat UX, update `chat_architecture.md` to keep the architecture map current (~700-line HTML file referenced there).
- Validate SQL changes locally with `psql` (`\d chats`, `\d chat_messages`) before rolling migrations; Stage 1 schema is treated as canonical.
- For workflow tweaks, use n8n’s Webhook testing mode, send the JSON sample from docs, and verify HTTP codes 401/402/200 align with the cases listed in `web_chat_workflow_instructions.md`.
- Production issues are usually traceable via the logger JSON lines + Stripe/n8n histories; capture trace IDs from UI badges to correlate across systems.
