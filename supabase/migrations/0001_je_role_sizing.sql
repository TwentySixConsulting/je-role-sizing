-- Role Sizing: shared team storage.
--
-- Everything here is namespaced `je_` so it can live alongside other TwentySix
-- tables in the same Supabase project without colliding.
--
-- Access model: one shared team account in Supabase Auth. The app asks only for
-- a password and signs that account in. Row level security then requires an
-- authenticated session, so the anon key on its own reads nothing - the
-- password is enforced by the database, not by the page.

-- ---------------------------------------------------------------- roles ----

create table if not exists public.je_roles (
  id            uuid primary key,
  organisation  text        not null default '',
  title         text        not null default '',
  function_area text        not null default '',
  reports_to    text        not null default '',
  client_grade  text        not null default '',
  salary        text        not null default '',
  -- The extracted job description: {source, fileName, fileType, fileSize, text, html}
  jd            jsonb       not null default '{"source":"none","text":""}'::jsonb,
  -- factorId -> level number
  scores        jsonb       not null default '{}'::jsonb,
  -- factorId -> the reason recorded for that level
  rationale     jsonb       not null default '{}'::jsonb,
  notes         text        not null default '',
  evaluator     text        not null default '',
  status        text        not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz,
  constraint je_roles_status_check check (status in ('draft', 'complete', 'moderated'))
);

comment on table public.je_roles is
  'One row per role sized against the TwentySix role sizing scheme.';

-- The library groups by organisation and ranks within it; the library also
-- sorts by recency.
create index if not exists je_roles_organisation_idx on public.je_roles (organisation);
create index if not exists je_roles_updated_at_idx   on public.je_roles (updated_at desc);

-- ------------------------------------------------------------- settings ----

-- A single row, id 'team': the contribution bands the team works to.
create table if not exists public.je_settings (
  id           text        primary key default 'team',
  bands        jsonb       not null,
  updated_at   timestamptz not null default now()
);

comment on table public.je_settings is
  'Team-wide settings. One row, id = ''team''. Evaluator name and list sort are
   per-person and stay in the browser rather than here.';

-- ------------------------------------------------------ updated_at guard ----

-- Belt and braces: the app always sets updated_at, but a hand-run SQL fix
-- should not leave the library sorting on a stale timestamp.
create or replace function public.je_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists je_roles_touch on public.je_roles;
create trigger je_roles_touch
  before update on public.je_roles
  for each row execute function public.je_touch_updated_at();

drop trigger if exists je_settings_touch on public.je_settings;
create trigger je_settings_touch
  before update on public.je_settings
  for each row execute function public.je_touch_updated_at();

-- ------------------------------------------------------------------ RLS ----

alter table public.je_roles    enable row level security;
alter table public.je_settings enable row level security;

-- Anyone holding a valid session (i.e. anyone who typed the team password) can
-- read and write everything. Consultants share one pool of roles by design.
drop policy if exists je_roles_team_access on public.je_roles;
create policy je_roles_team_access
  on public.je_roles
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists je_settings_team_access on public.je_settings;
create policy je_settings_team_access
  on public.je_settings
  for all
  to authenticated
  using (true)
  with check (true);

-- No policy for the `anon` role, so an unauthenticated caller holding the
-- publishable key sees nothing. That is the point.

-- -------------------------------------------------------------- storage ----

-- Private bucket for the original uploaded job descriptions, so a consultant
-- can reopen the source Word or PDF file later.
--
-- The storage and realtime steps below are wrapped so that a permissions error
-- reports itself as a notice instead of rolling back the tables above. The app
-- works without them: only "open the original file" and live refresh are lost.
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit)
  values ('je-job-descriptions', 'je-job-descriptions', false, 26214400)
  on conflict (id) do update set public = false, file_size_limit = 26214400;
exception when others then
  raise notice 'Could not create the storage bucket (%). Create "je-job-descriptions" as a private bucket in Storage instead.', sqlerrm;
end
$$;

do $$
begin
  drop policy if exists je_files_team_access on storage.objects;
  create policy je_files_team_access
    on storage.objects
    for all
    to authenticated
    using (bucket_id = 'je-job-descriptions')
    with check (bucket_id = 'je-job-descriptions');
exception when others then
  raise notice 'Could not add the storage policy (%). Add it from Storage > Policies instead.', sqlerrm;
end
$$;

-- --------------------------------------------------------------- realtime ---

-- So a consultant sees a colleague's scoring appear without reloading.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'je_roles'
  ) then
    alter publication supabase_realtime add table public.je_roles;
  end if;
exception when others then
  raise notice 'Could not enable realtime (%). Turn it on for je_roles under Database > Replication.', sqlerrm;
end
$$;

-- ------------------------------------------------------------------ done ----

select 'Role sizing tables ready' as status,
       (select count(*) from public.je_roles)    as roles,
       (select count(*) from public.je_settings) as settings_rows;
