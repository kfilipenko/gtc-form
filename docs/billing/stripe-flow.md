# GTC Subscription Flow (Stripe → n8n → GTC platform)

_Last updated: 2025-11-24_

This document describes the final, working flow that connects our user-facing channels, billing portal, Stripe Checkout, n8n automations, and the entitlement checks inside Telegram and the web chat. **`gtc_user_id` stays the single linking key at every hop**; all future changes to billing or identity must preserve this invariant.

---

## 1. Channels and identities

| Channel | Entry point | Identity storage | How it links to billing |
| --- | --- | --- | --- |
| Telegram bot | `@Procurement_AnalystBot` | Table `auth_telegram` → `auth.users.id` | Each Telegram record resolves to a `gtc_user_id` via the owning `user.id`. |
| Web chat | `https://app.gtstor.com/chat/` | `gtc-auth` (`auth.users`, OTP/email/password, Google/OTP) | Every successful auth path sets `auth.users.gtc_user_id`. |

Key rules:
- `gtc_user_id` is an integer and is the canonical identity everywhere (Telegram, web chat, billing, entitlements).
- All subscription checks query `gtc_user_id` → `subscriptions` rather than channel-specific identifiers.

---

## 2. Payment portal (`payment.php`)

- URL: `https://pay.gtstor.com/payment.php`
- File: `/var/www/html/payment.php`

### Entry flow
1. The chat UI’s **Open billing portal** button constructs:
   ```text
   https://pay.gtstor.com/payment.php?gtc_user_id=<INT>&email=<URL-ENCODED-EMAIL>
   ```
2. `payment.php` validates both parameters (positive int + valid email).
3. On success it stores them in the PHP session and renders a header block showing the user’s GTC ID + email. Invalid/missing inputs show an error and hide Stripe checkout.

### Stripe Pricing Table
```html
<stripe-pricing-table
  pricing-table-id="prctbl_1RzeYdLv47UCHXcLQEZ20LLW"
  publishable-key="pk_live_..."
  client-reference-id="<?= htmlspecialchars((string)$gtcUserId) ?>"
  customer-email="<?= htmlspecialchars($gtcEmail) ?>">
</stripe-pricing-table>
```
- `client-reference-id` == `gtc_user_id` 100% of the time.
- `customer-email` is prefilled so Stripe shows the right address.

---

## 3. Metadata bridge (`attach-metadata` action)

Stripe Pricing Tables do not automatically mirror session metadata, so we add a bridge:

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
2. The PHP handler (`handle_metadata_attach`) reads `session_id` + session-stored `gtc_user_id/email`, then calls:
   ```http
   POST https://api.stripe.com/v1/checkout/sessions/{SESSION_ID}
   metadata[gtc_user_id]=...
   metadata[gtc_email]=...
   customer_email=...
   ```
   using `STRIPE_SECRET_KEY`.

Resulting Checkout Session fields:
- `client_reference_id` = `gtc_user_id`
- `metadata.gtc_user_id` = `gtc_user_id`
- `metadata.gtc_email` = `email`
- `customer_email` = `email`

This guarantees every downstream Stripe event carries `gtc_user_id` and email.

---

## 4. Stripe → n8n webhook processing

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

## 6. Summary & guardrails

- `gtc_user_id` is the **only** linking key between identity, payment, and entitlement.
- `payment.php` must always set both `client_reference_id` and metadata before redirecting to Stripe.
- n8n remains the authoritative Stripe webhook processor; any new automation must reuse the same `gtc_user_id` extraction logic.
- App layers (Telegram/web chat) should never trust channel-only flags—always check `subscriptions` with `gtc_user_id`.
- Future billing changes must preserve these invariants to keep subscriptions consistent across all channels.
