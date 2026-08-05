-- TRAVELGTC-CRM-005 - Customer card data, kept project-local and additive.

begin;

create table if not exists travelgtc_customer_profiles (
  contact_id uuid primary key references travelgtc_contacts(id) on delete cascade,
  relationship_status text not null default 'new',
  assigned_to text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  updated_by text null,
  constraint travelgtc_customer_profiles_status_chk
    check (relationship_status in ('new', 'active', 'waiting_for_customer', 'consultation', 'official_step', 'closed'))
);

create table if not exists travelgtc_customer_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references travelgtc_contacts(id) on delete cascade,
  actor_user_id uuid null references travelgtc_identity.users(user_id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  updated_by text null,
  constraint travelgtc_customer_notes_body_chk check (length(trim(body)) between 2 and 2000)
);

insert into travelgtc_customer_profiles (contact_id, relationship_status, created_by, updated_by)
select id, 'new', 'migration:crm_005', 'migration:crm_005'
from travelgtc_contacts
on conflict (contact_id) do nothing;

create index if not exists idx_travelgtc_customer_profiles_status
  on travelgtc_customer_profiles (relationship_status, updated_at desc);

create index if not exists idx_travelgtc_customer_notes_contact_created
  on travelgtc_customer_notes (contact_id, created_at desc);

commit;
