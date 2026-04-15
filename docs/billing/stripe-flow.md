# GTC Subscription Flow (Stripe -> n8n -> GTC platform)

_Last updated: 2026-04-04_

This document describes the current production billing runtime and the implemented Telegram-first Stripe behavior validated in runtime. **`gtc_user_id` is the canonical internal entitlement key** across billing and access-control checks. Email may be sent to Stripe for billing or contact purposes, but it does not prove entitlement inside GTC. Telegram and Web can currently resolve to separate user or account records; this document does not assume a merged cross-channel identity model.

---

## 1. Channels and identities

| Channel | Entry point | Identity storage | How it links to billing |
| --- | --- | --- | --- |
| Telegram bot | `@Procurement_AnalystBot` | Table `auth_telegram` → `auth.users.id` | Each Telegram record resolves to a `gtc_user_id` via the owning `user.id`. |
| Web chat | `https://app.gtstor.com/chat/` | `gtc-auth` (`auth.users`, OTP/email/password, Google/OTP) | Every successful auth path sets `auth.users.gtc_user_id`. |

Key rules:
- `gtc_user_id` is an integer and is the canonical internal entitlement key everywhere billing and access control are resolved.
- All subscription checks query `gtc_user_id` -> `subscriptions` rather than channel-only identifiers or email.
- Email can be stored in Stripe as billing or contact data, but email is not the entitlement identifier in GTC.
- Telegram and Web may currently create or resolve separate users or accounts; shared entitlement depends on `gtc_user_id`, not on an assumed merged identity record.

---

## 2. Payment runtime entrypoints

### Telegram runtime payment entrypoint (`payment_tg.php`)

- URL: `https://pay.gtstor.com/payment_tg.php`
- File: `/var/www/html/payment_tg.php`
- Current runtime link pattern:
  ```text
  https://pay.gtstor.com/payment_tg.php?gtc_user_id=<INT>
  ```
- `gtc_user_id` is the primary incoming parameter and the canonical internal entitlement key.
- The page now resolves `gtc_user_id -> stripe_customer_id -> Stripe Customer Session -> Pricing Table / Checkout`.
- Stripe Pricing Table is bound through `customer-session-client-secret`.
- `client-reference-id = gtc_user_id` remains present.
- `metadata.gtc_user_id` remains present for downstream webhook compatibility.
- `email` is optional billing/contact data and may still be stored as `metadata.gtc_email`, but it is not the Telegram identity mechanism.
- `customer-email` and `customer_email` are no longer the primary Telegram identity fields.
- Runtime validation on 2026-04-04 confirmed that a Telegram user completed subscription checkout successfully, a trial subscription was created, access was granted, and reuse of the same email no longer triggered an email-based "already subscribed" block in the Telegram flow.

### Web runtime payment entrypoint (`payment.php`)

- URL: `https://pay.gtstor.com/payment.php`
- File: `/var/www/html/payment.php`
- Current web link pattern:
  ```text
  https://pay.gtstor.com/payment.php?gtc_user_id=<INT>&email=<URL-ENCODED-EMAIL>
  ```
- In the current web runtime, `payment.php` validates both `gtc_user_id` and `email`.
- This remains a separate web payment flow and was not modified by the Telegram-first Stripe fix.

### Saved artifacts and scope

- `docs/workflows/GTC Sales Agent - Web Chat.json` is a saved web workflow export artifact.
- If that export conflicts with verified production behavior, treat the export as stale and prefer observed runtime behavior for Telegram payment routing.

---

## 3. Current Stripe compatibility contract

Both payment pages currently use Stripe Pricing Table. `payment_tg.php` now uses a Customer Session bootstrap plus a post-create metadata bridge, while `payment.php` keeps the existing web attach path.

Mandatory compatibility fields:
- `client_reference_id = gtc_user_id`
- `metadata.gtc_user_id = gtc_user_id`

These fields remain mandatory compatibility fields after the Telegram-first implementation.

Known page-specific behavior:
- `payment_tg.php` resolves `gtc_user_id -> stripe_customer_id -> Stripe Customer Session -> Pricing Table / Checkout`.
- `payment_tg.php` binds Stripe Pricing Table via `customer-session-client-secret`.
- `payment_tg.php` preserves `client_reference_id = gtc_user_id` and `metadata.gtc_user_id = gtc_user_id`.
- `payment_tg.php` may still attach `metadata.gtc_email` when email exists, but it does not send `customer-email` or `customer_email` as the Telegram identity mechanism.
- `payment.php` remains unchanged and continues to run the separate web flow that validates `gtc_user_id` plus `email`.
- Email-based Stripe resolution is no longer the Telegram runtime behavior; entitlement inside GTC remains keyed by `gtc_user_id`.

### Metadata bridge (`attach-metadata` action)

Stripe Pricing Tables do not automatically mirror session metadata, so we keep a bridge. The Telegram and web attach paths now differ deliberately:

1. JS listens for `checkoutsessioncreated`:
   ```js
   pricingTable.addEventListener('checkoutsessioncreated', async (event) => {
     const sessionId = event?.detail?.session?.id;
     if (!sessionId) return;
     const endpoint = new URL(window.location.href);
     endpoint.searchParams.set('action', 'attach-metadata');
     await fetch(endpoint, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ session_id: sessionId })
     });
   });
   ```
2. The Telegram PHP handler (`payment_tg.php`) reads `session_id` plus session-stored `gtc_user_id` and, when available, `email`, then calls:
  ```http
  POST https://api.stripe.com/v1/checkout/sessions/{SESSION_ID}
  metadata[gtc_user_id]=...
  metadata[gtc_email]=...   # only when email exists
  ```
  using `STRIPE_SECRET_KEY`.
3. The web PHP handler (`payment.php`) keeps the existing web attach path and may still call:
  ```http
  POST https://api.stripe.com/v1/checkout/sessions/{SESSION_ID}
  metadata[gtc_user_id]=...
  metadata[gtc_email]=...   # only when email exists
  customer_email=...        # only when email exists
  ```
  using `STRIPE_SECRET_KEY`.

Resulting Checkout Session fields:
- Telegram flow: `client_reference_id` = `gtc_user_id`
- Telegram flow: `metadata.gtc_user_id` = `gtc_user_id`
- Telegram flow: `metadata.gtc_email` = `email` when available
- Web flow: `customer_email` = `email` may still be present

This guarantees every downstream Stripe event can carry `gtc_user_id`. Email remains secondary billing or contact data.

### Runtime dependency: PHP-FPM environment wiring

`payment_tg.php` now depends on host-level PHP-FPM environment wiring for:
- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`
- `STRIPE_SECRET_KEY`

These values must be exposed to the PHP-FPM pool at runtime. Do not store secret values in repository documents, code snapshots, or workflow exports.

---

## 4. Stripe → n8n webhook processing

- No n8n webhook change was required for the Telegram-first Stripe fix. Downstream compatibility is preserved by `client_reference_id` and `metadata.gtc_user_id`.

- **Single consumer:** the n8n workflow (do **not** enable the Express `/stripe/webhook` route in production to avoid double handling).
- n8n receives all Stripe events and maps IDs as follows:
  ```js
  const gtc_user_id = $json.data.object.client_reference_id
                   || $json.data.object.metadata?.gtc_user_id
                   || 'null';

  const email = $json.data.object.customer_details?.email
             || $json.data.object.customer_email
             || $json.data.object.metadata?.gtc_email
             || null;
  ```

`email` may still be useful for support, billing, or reconciliation. It must not be documented as the entitlement key.

### Example SQL (customers)
```sql
INSERT INTO stripe_customers (stripe_customer_id, gtc_user_id, email, livemode)
VALUES ($1, NULLIF($2, 'null')::integer, $3, $4::boolean)
ON CONFLICT (stripe_customer_id) DO UPDATE SET
  gtc_user_id = COALESCE(EXCLUDED.gtc_user_id, stripe_customers.gtc_user_id),
  email       = COALESCE(EXCLUDED.email, stripe_customers.email),
  livemode    = EXCLUDED.livemode,
  updated_at  = NOW();
```
- `$1` = Stripe customer ID, `$2` = resolved `gtc_user_id`, etc.
- Diagnostics: `SELECT * FROM stripe_customers_orphans LIMIT 50;` highlights customers with no `gtc_user_id` or no linked subscriptions.

### Example SQL (subscriptions)
For `customer.subscription.created/updated/deleted` events we store:
- `gtc_user_id`
- `stripe_subscription_id`, `stripe_customer_id`
- `plan_code` (from `price_id` or nickname)
- `status`, `start_date`, `end_date`
- `stripe_price_id`, `stripe_product_id`, `livemode`

This yields rows such as:
```json
{
  "gtc_user_id": 3598,
  "stripe_customer_id": "cus_...",
  "stripe_subscription_id": "sub_...",
  "plan_code": "standard_monthly",
  "status": "trialing",
  "end_date": "2025-12-24T11:03:00Z"
}
```

---

## 5. Entitlement checks (Telegram + web chat)

Both channels trust the `subscriptions` table keyed by `gtc_user_id`.

**Telegram (pseudo-SQL):**
```sql
SELECT
  u.id,
  u.gtc_user_id,
  (
    COALESCE(u.telegram_bot_access, false)
    OR EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.gtc_user_id = u.gtc_user_id
        AND s.status IN ('active','trialing')
        AND s.end_date > NOW()
    )
  ) AS telegram_bot_access
FROM ...
```

**Web chat:** once a user signs in (password, OTP, Google), the frontend hits `/auth/status`. If `subscriptions` reports `active/trialing` and not expired for that `gtc_user_id`, the chat unlocks premium features; otherwise the Billing panel is shown.

---

## 6. Implemented scope & guardrails

- `gtc_user_id` is the canonical internal key between payment and entitlement.
- The Telegram-first Stripe customer binding is implemented in `/var/www/html/payment_tg.php` only.
- `/var/www/html/payment.php` remains a separate web payment flow and was not changed in this step.
- `client_reference_id` and `metadata.gtc_user_id` must remain mandatory compatibility fields.
- n8n remains the authoritative Stripe webhook processor; the existing `gtc_user_id` extraction logic was preserved.
- Entitlement logic remained unchanged.
- App layers (Telegram and Web) should never treat email as proof of entitlement; always check `subscriptions` with `gtc_user_id`.
- Telegram and Web account models may still remain separate after this implementation.
- Validate billing behavior against production runtime, not only against saved workflow exports.
