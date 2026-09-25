-- TRAVELGTC-AI-018: anonymous conversation capability; no authentication credentials stored.
begin;
create table if not exists travelgtc_mira_guest_sessions (
  token_hash text primary key check (length(token_hash) = 64),
  lead_id uuid not null unique references travelgtc_leads(id) on delete cascade,
  contact_id uuid not null references travelgtc_contacts(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  completed_turns integer not null default 0 check (completed_turns >= 0),
  claimed_user_id uuid null references travelgtc_identity.users(user_id),
  claimed_at timestamptz null
);
create index if not exists idx_travelgtc_mira_guest_expiry on travelgtc_mira_guest_sessions(expires_at) where claimed_user_id is null;
commit;
