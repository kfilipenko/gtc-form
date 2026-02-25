-- Add email to stripe_customers and surface orphan diagnostics.
ALTER TABLE stripe_customers
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_stripe_customers_email_lower
  ON stripe_customers (lower(email))
  WHERE email IS NOT NULL;

CREATE OR REPLACE VIEW stripe_customers_orphans AS
SELECT
  sc.stripe_customer_id,
  sc.gtc_user_id,
  sc.email,
  sc.livemode,
  sc.created_at,
  sc.updated_at,
  COUNT(s.stripe_subscription_id) AS subscription_count,
  COUNT(DISTINCT s.gtc_user_id) AS subscription_gtc_users,
  ARRAY_AGG(DISTINCT s.stripe_subscription_id) FILTER (WHERE s.stripe_subscription_id IS NOT NULL) AS subscription_ids
FROM stripe_customers sc
LEFT JOIN subscriptions s ON s.stripe_customer_id = sc.stripe_customer_id
GROUP BY sc.stripe_customer_id, sc.gtc_user_id, sc.email, sc.livemode, sc.created_at, sc.updated_at
HAVING COUNT(s.stripe_subscription_id) = 0 OR sc.gtc_user_id IS NULL
ORDER BY sc.created_at DESC;
