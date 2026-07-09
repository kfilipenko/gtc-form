-- TRAVELGTC-API-001 - Lead capture and CRM intake schema

create extension if not exists pgcrypto;

create table if not exists travelgtc_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  updated_by text null,
  display_name text not null,
  primary_channel text not null,
  primary_contact text not null,
  email text null,
  phone text null,
  telegram text null,
  max_contact text null,
  whatsapp text null,
  consent_personal_data boolean not null default false,
  consent_communication boolean not null default false,
  consent_version text not null,
  notes text null
);

create table if not exists travelgtc_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  updated_by text null,
  contact_id uuid not null references travelgtc_contacts(id) on delete restrict,
  stage text not null default 'new_lead',
  declared_role text not null,
  inferred_role text null,
  primary_interest text not null,
  business_interest_level text null,
  source_channel text null,
  source_path text null,
  referrer text null,
  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  utm_content text null,
  utm_term text null,
  referral_code text null,
  locale text null,
  timezone text null,
  client_event_id text null unique,
  qualification_score integer null,
  compliance_risk text null,
  recommended_next_step text null,
  summary text null
);

create table if not exists travelgtc_travel_ideas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  updated_by text null,
  lead_id uuid not null references travelgtc_leads(id) on delete cascade,
  format text null,
  destination text null,
  approx_dates text null,
  audience_type text null,
  estimated_group_size text null,
  description text not null,
  important_details text null,
  status text not null default 'needs_review'
);

create table if not exists travelgtc_interactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  updated_by text null,
  lead_id uuid not null references travelgtc_leads(id) on delete cascade,
  contact_id uuid not null references travelgtc_contacts(id) on delete restrict,
  interaction_type text not null,
  channel text null,
  direction text not null,
  body text not null,
  human_approved boolean null,
  metadata_json jsonb null
);

create table if not exists travelgtc_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  updated_by text null,
  lead_id uuid not null references travelgtc_leads(id) on delete cascade,
  task_type text not null,
  title text not null,
  description text null,
  status text not null default 'open',
  priority text not null default 'normal',
  due_at timestamptz null,
  assigned_to text null
);

create table if not exists travelgtc_agent_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  updated_by text null,
  lead_id uuid null references travelgtc_leads(id) on delete set null,
  agent_type text not null,
  input_json jsonb not null,
  output_json jsonb null,
  status text not null,
  model_name text null,
  risk_flags_json jsonb null,
  human_review_status text not null default 'pending'
);

create table if not exists travelgtc_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  updated_by text null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_type text not null,
  actor_id text null,
  before_json jsonb null,
  after_json jsonb null
);

create index if not exists idx_travelgtc_leads_stage on travelgtc_leads(stage);
create index if not exists idx_travelgtc_leads_declared_role on travelgtc_leads(declared_role);
create index if not exists idx_travelgtc_leads_primary_interest on travelgtc_leads(primary_interest);
create index if not exists idx_travelgtc_leads_created_at on travelgtc_leads(created_at desc);
create index if not exists idx_travelgtc_tasks_lead_status on travelgtc_tasks(lead_id, status);
create index if not exists idx_travelgtc_interactions_lead_created on travelgtc_interactions(lead_id, created_at desc);
create index if not exists idx_travelgtc_agent_runs_lead_created on travelgtc_agent_runs(lead_id, created_at desc);
create index if not exists idx_travelgtc_audit_entity on travelgtc_audit_log(entity_type, entity_id, created_at desc);
