-- userid
CREATE TABLE userid (
  gtc_user_id TEXT,
  uuid TEXT,
  created_at TEXT
);

-- emailaccounts
CREATE TABLE emailaccounts (
  gtc_user_id TEXT,
  email TEXT,
  password TEXT,
  created_at TEXT,
  verified BOOLEAN
);

-- google_oauth
CREATE TABLE google_oauth (
  gtc_user_id TEXT,
  google_id TEXT,
  email TEXT,
  name TEXT,
  picture TEXT,
  locale TEXT,
  created_at TEXT
);

-- telegram_accounts
CREATE TABLE telegram_accounts (
  gtc_user_id TEXT,
  telegram_id TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TEXT
);

-- github_accounts
CREATE TABLE github_accounts (
  gtc_user_id TEXT,
  github_id TEXT,
  username TEXT,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT
);

-- wix_accounts
CREATE TABLE wix_accounts (
  gtc_user_id TEXT,
  wix_id TEXT,
  email TEXT,
  name TEXT,
  created_at TEXT
);

-- tilda_accounts
CREATE TABLE tilda_accounts (
  gtc_user_id TEXT,
  tilda_id TEXT,
  email TEXT,
  name TEXT,
  created_at TEXT
);

-- user_history
CREATE TABLE user_history (
  gtc_user_id TEXT,
  source TEXT,
  prompt TEXT,
  timestamp TEXT,
  executionMode TEXT
);
