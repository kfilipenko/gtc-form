-- TRAVELGTC-CRM-007 - Administrative lifecycle for Mira chat cases.

begin;

create table if not exists travelgtc_chat_cases (
  lead_id uuid primary key references travelgtc_leads(id) on delete cascade,
  contact_id uuid not null references travelgtc_contacts(id) on delete restrict,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  updated_by text null,
  constraint travelgtc_chat_cases_status_chk
    check (status in ('active', 'hidden', 'archived', 'deleted'))
);

insert into travelgtc_chat_cases (lead_id, contact_id, status, created_at, updated_at, created_by, updated_by)
select l.id, l.contact_id, 'active', l.created_at, l.updated_at, 'migration:crm_007', 'migration:crm_007'
from travelgtc_leads l
where l.source_path = 'ai_chat'
on conflict (lead_id) do nothing;

create index if not exists idx_travelgtc_chat_cases_status_updated
  on travelgtc_chat_cases (status, updated_at desc);

create index if not exists idx_travelgtc_chat_cases_contact
  on travelgtc_chat_cases (contact_id);

commit;
