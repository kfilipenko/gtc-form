-- Enforce unique emails per auth table and expose a diagnostics view for cross-table duplicates.
-- Safe to run on empty tables; partial indexes ignore NULL emails.

-- Unique-by-email (case-insensitive) per provider table
CREATE UNIQUE INDEX IF NOT EXISTS ux_emailaccounts_email_lower
  ON emailaccounts (lower(email))
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_google_oauth_email_lower
  ON google_oauth (lower(email))
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_github_accounts_email_lower
  ON github_accounts (lower(email))
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_wix_accounts_email_lower
  ON wix_accounts (lower(email))
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_tilda_accounts_email_lower
  ON tilda_accounts (lower(email))
  WHERE email IS NOT NULL;

-- Diagnostic view: shows emails linked to multiple gtc_user_id across all auth tables.
CREATE OR REPLACE VIEW email_duplicate_conflicts AS
WITH emails AS (
  SELECT lower(email) AS email, gtc_user_id, 'emailaccounts' AS source FROM emailaccounts WHERE email IS NOT NULL
  UNION ALL
  SELECT lower(email), gtc_user_id, 'google_oauth' FROM google_oauth WHERE email IS NOT NULL
  UNION ALL
  SELECT lower(email), gtc_user_id, 'github_accounts' FROM github_accounts WHERE email IS NOT NULL
  UNION ALL
  SELECT lower(email), gtc_user_id, 'wix_accounts' FROM wix_accounts WHERE email IS NOT NULL
  UNION ALL
  SELECT lower(email), gtc_user_id, 'tilda_accounts' FROM tilda_accounts WHERE email IS NOT NULL
)
SELECT
  email,
  COUNT(DISTINCT gtc_user_id) AS distinct_users,
  array_agg(DISTINCT gtc_user_id ORDER BY gtc_user_id) AS gtc_user_ids,
  array_agg(DISTINCT source ORDER BY source) AS sources
FROM emails
GROUP BY email
HAVING COUNT(DISTINCT gtc_user_id) > 1
ORDER BY distinct_users DESC, email;
