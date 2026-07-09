-- TRAVELGTC-AUTH-002 - Shared GTC identity, sessions and TravelGTC account lead linkage
-- Idempotent migration: safe to re-run.

begin;

create extension if not exists pgcrypto;
create schema if not exists gtc_identity;

create table if not exists gtc_identity.users (
  user_id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text null,
  display_name text not null,
  primary_channel text not null,
  email_verified_at timestamptz null,
  phone_verified_at timestamptz null,
  account_status text not null default 'pending_verification',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gtc_identity_users_email_chk check (position('@' in email) > 1),
  constraint gtc_identity_users_status_chk check (account_status in ('pending_verification', 'active', 'suspended', 'closed'))
);

create unique index if not exists gtc_identity_users_email_uidx
  on gtc_identity.users (lower(email));

create table if not exists gtc_identity.auth_identities (
  auth_identity_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references gtc_identity.users(user_id) on delete cascade,
  provider text not null,
  provider_subject text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists gtc_identity_auth_identities_provider_uidx
  on gtc_identity.auth_identities (provider, provider_subject);

create table if not exists gtc_identity.user_credentials (
  credential_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references gtc_identity.users(user_id) on delete cascade,
  login_email text not null,
  password_hash text not null,
  password_set_at timestamptz not null default now(),
  password_updated_at timestamptz null,
  failed_login_attempts integer not null default 0,
  last_failed_login_at timestamptz null,
  last_login_at timestamptz null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gtc_identity_user_credentials_email_chk check (position('@' in login_email) > 1),
  constraint gtc_identity_user_credentials_hash_chk check (length(password_hash) > 20),
  constraint gtc_identity_user_credentials_failed_chk check (failed_login_attempts >= 0)
);

create unique index if not exists gtc_identity_user_credentials_login_email_uidx
  on gtc_identity.user_credentials (lower(login_email));

create table if not exists gtc_identity.user_sessions (
  session_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references gtc_identity.users(user_id) on delete cascade,
  session_token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  last_used_at timestamptz null,
  ip_address inet null,
  user_agent text null,
  constraint gtc_identity_user_sessions_hash_chk check (length(session_token_hash) >= 32),
  constraint gtc_identity_user_sessions_expiry_chk check (expires_at > created_at)
);

create index if not exists gtc_identity_user_sessions_user_idx
  on gtc_identity.user_sessions (user_id);

create index if not exists gtc_identity_user_sessions_active_lookup_idx
  on gtc_identity.user_sessions (session_token_hash, expires_at)
  where revoked_at is null;

create table if not exists gtc_identity.email_verification_tokens (
  email_verification_token_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references gtc_identity.users(user_id) on delete cascade,
  email text not null,
  verification_token_hash text not null unique,
  purpose text not null default 'account_email_verification',
  token_state text not null default 'pending',
  expires_at timestamptz not null,
  sent_at timestamptz null,
  used_at timestamptz null,
  delivery_status text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gtc_identity_email_tokens_state_chk check (token_state in ('pending', 'used', 'revoked')),
  constraint gtc_identity_email_tokens_hash_chk check (length(verification_token_hash) >= 32)
);

create index if not exists gtc_identity_email_tokens_pending_idx
  on gtc_identity.email_verification_tokens (user_id, email, purpose, expires_at)
  where token_state = 'pending';

create table if not exists gtc_identity.user_project_memberships (
  membership_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references gtc_identity.users(user_id) on delete cascade,
  project_code text not null,
  membership_status text not null default 'interested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, project_code)
);

create table if not exists gtc_identity.user_project_roles (
  role_assignment_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references gtc_identity.users(user_id) on delete cascade,
  project_code text not null,
  role_code text not null,
  source text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, project_code, role_code)
);

create table if not exists gtc_identity.user_consents (
  consent_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references gtc_identity.users(user_id) on delete cascade,
  project_code text null,
  consent_type text not null,
  consent_version text not null,
  granted boolean not null,
  accepted_at timestamptz not null default now(),
  withdrawn_at timestamptz null,
  source text not null,
  ip_address inet null,
  user_agent text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gtc_identity_user_consents_lookup_idx
  on gtc_identity.user_consents (user_id, project_code, consent_type, accepted_at desc);

create table if not exists gtc_identity.audit_events (
  audit_event_id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references gtc_identity.users(user_id) on delete set null,
  entity_type text not null,
  entity_id uuid null,
  action text not null,
  before_json jsonb null,
  after_json jsonb null,
  source text not null,
  created_at timestamptz not null default now()
);

create index if not exists gtc_identity_audit_entity_idx
  on gtc_identity.audit_events (entity_type, entity_id, created_at desc);

-- Optional compatibility backfill from the earlier CrewPortGlobal project schema.
-- This copies only shared identity and credential data needed for unified login.
-- It intentionally does not copy maritime profiles, documents, contracts, employer,
-- vessel, medical or project-specific CRM data into TravelGTC.
do $$
begin
  if to_regclass('crewportglobal.users') is not null then
    execute $sql$
      insert into gtc_identity.users (
        user_id, email, display_name, primary_channel, email_verified_at,
        account_status, created_at, updated_at
      )
      select
        u.user_id,
        u.email,
        coalesce(nullif(u.display_name, ''), u.email) as display_name,
        'email' as primary_channel,
        u.email_verified_at,
        case
          when coalesce(u.is_active, true) = false then 'suspended'
          when u.email_verified_at is not null then 'active'
          else 'pending_verification'
        end as account_status,
        u.created_at,
        u.updated_at
      from crewportglobal.users u
      where u.email is not null
      on conflict (user_id)
      do update set
        email = excluded.email,
        display_name = excluded.display_name,
        email_verified_at = coalesce(gtc_identity.users.email_verified_at, excluded.email_verified_at),
        updated_at = now()
    $sql$;

    execute $sql$
      insert into gtc_identity.user_project_memberships (
        user_id, project_code, membership_status, metadata
      )
      select
        u.user_id,
        'crewportglobal',
        case when coalesce(u.is_active, true) then 'active' else 'inactive' end,
        jsonb_build_object('source', 'crewportglobal_identity_backfill')
      from crewportglobal.users u
      join gtc_identity.users gu on gu.user_id = u.user_id
      on conflict (user_id, project_code)
      do nothing
    $sql$;
  end if;

  if to_regclass('crewportglobal.user_credentials') is not null then
    execute $sql$
      insert into gtc_identity.user_credentials (
        user_id, login_email, password_hash, password_set_at, password_updated_at,
        failed_login_attempts, last_failed_login_at, last_login_at, is_active,
        created_at, updated_at
      )
      select
        c.user_id,
        c.login_email,
        c.password_hash,
        c.password_set_at,
        c.password_updated_at,
        c.failed_login_attempts,
        c.last_failed_login_at,
        c.last_login_at,
        c.is_active,
        c.created_at,
        c.updated_at
      from crewportglobal.user_credentials c
      join gtc_identity.users u on u.user_id = c.user_id
      on conflict (user_id)
      do nothing
    $sql$;
  end if;
end $$;

alter table travelgtc_contacts
  add column if not exists user_id uuid null;

alter table travelgtc_leads
  add column if not exists user_id uuid null;

alter table travelgtc_travel_ideas
  add column if not exists created_by_user_id uuid null;

alter table travelgtc_interactions
  add column if not exists actor_user_id uuid null;

alter table travelgtc_audit_log
  add column if not exists actor_user_id uuid null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'travelgtc_contacts_user_fk'
  ) then
    alter table travelgtc_contacts
      add constraint travelgtc_contacts_user_fk
      foreign key (user_id) references gtc_identity.users(user_id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'travelgtc_leads_user_fk'
  ) then
    alter table travelgtc_leads
      add constraint travelgtc_leads_user_fk
      foreign key (user_id) references gtc_identity.users(user_id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'travelgtc_travel_ideas_created_by_user_fk'
  ) then
    alter table travelgtc_travel_ideas
      add constraint travelgtc_travel_ideas_created_by_user_fk
      foreign key (created_by_user_id) references gtc_identity.users(user_id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'travelgtc_interactions_actor_user_fk'
  ) then
    alter table travelgtc_interactions
      add constraint travelgtc_interactions_actor_user_fk
      foreign key (actor_user_id) references gtc_identity.users(user_id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'travelgtc_audit_log_actor_user_fk'
  ) then
    alter table travelgtc_audit_log
      add constraint travelgtc_audit_log_actor_user_fk
      foreign key (actor_user_id) references gtc_identity.users(user_id) on delete set null;
  end if;
end $$;

create index if not exists idx_travelgtc_contacts_user on travelgtc_contacts(user_id);
create index if not exists idx_travelgtc_leads_user_created on travelgtc_leads(user_id, created_at desc);
create index if not exists idx_travelgtc_travel_ideas_created_by_user on travelgtc_travel_ideas(created_by_user_id);

commit;
