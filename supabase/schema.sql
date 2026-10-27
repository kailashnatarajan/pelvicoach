-- PelviCoach schema. Run once in Supabase > SQL Editor. Synthetic/demo data only.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'patient' check (role in ('patient','clinician')),
  full_name text,
  link_code text unique default upper(substr(md5(random()::text),1,6))
);
create table public.care_links (
  clinician_id uuid references public.profiles(id) on delete cascade,
  patient_id   uuid references public.profiles(id) on delete cascade,
  primary key (clinician_id, patient_id)
);
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  source text check (source in ('simulator','wokwi','replay')),
  device_id text, mvc real,
  started_at timestamptz default now(), ended_at timestamptz
);
create table public.attempts (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  n int, result text check (result in ('OK','MISS','COMPENSATED','INVALID')),
  target_pct int, hold_s int, avg_squeeze_pct int, why text,
  amplitude_only_verdict text, false_credit boolean default false,
  created_at timestamptz default now()
);
create table public.settings (
  patient_id uuid primary key references public.profiles(id) on delete cascade,
  target_pct int default 30 check (target_pct between 15 and 80),
  hold_s int default 3 check (hold_s between 2 and 8),
  goal_reps int default 8 check (goal_reps between 1 and 30),
  updated_by uuid, updated_at timestamptz default now()
);
create index on public.sessions (patient_id, started_at desc);
create index on public.attempts (session_id, created_at desc);

-- New sign-ups are ALWAYS patients. Promote a clinician by hand (see bottom).
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Helpers (security definer so RLS policies can use them without recursion)
create function public.is_clinician() returns boolean language sql stable security definer set search_path = public as
$$ select exists(select 1 from profiles where id = auth.uid() and role = 'clinician') $$;
create function public.is_linked_clinician(pid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists(select 1 from care_links where clinician_id = auth.uid() and patient_id = pid) $$;

-- Clinician links to a patient using the patient's own code (patient shares it = consent step)
create function public.link_by_code(p_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if not is_clinician() then raise exception 'clinician only'; end if;
  select id into pid from profiles where link_code = upper(trim(p_code)) and role = 'patient';
  if pid is null then raise exception 'unknown code'; end if;
  insert into care_links values (auth.uid(), pid) on conflict do nothing;
  return pid;
end $$;
revoke all on function public.link_by_code(text) from public, anon;
grant execute on function public.link_by_code(text) to authenticated;

-- Row-level security
alter table public.profiles   enable row level security;
alter table public.care_links enable row level security;
alter table public.sessions   enable row level security;
alter table public.attempts   enable row level security;
alter table public.settings   enable row level security;

create policy profiles_read on public.profiles for select using (id = auth.uid() or is_linked_clinician(id));
create policy profiles_upd  on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;           -- users may not change their own role...
grant  update (full_name) on public.profiles to authenticated;       -- ...only their name

create policy links_read on public.care_links for select using (clinician_id = auth.uid() or patient_id = auth.uid());
create policy links_del  on public.care_links for delete using (patient_id = auth.uid());   -- patient can revoke

create policy sess_read on public.sessions for select using (patient_id = auth.uid() or is_linked_clinician(patient_id));
create policy sess_ins  on public.sessions for insert with check (patient_id = auth.uid());
create policy sess_upd  on public.sessions for update using (patient_id = auth.uid()) with check (patient_id = auth.uid());

create policy att_read on public.attempts for select using (exists (select 1 from public.sessions s where s.id = session_id));
create policy att_ins  on public.attempts for insert with check (exists (select 1 from public.sessions s where s.id = session_id and s.patient_id = auth.uid()));

create policy set_read on public.settings for select using (patient_id = auth.uid() or is_linked_clinician(patient_id));
create policy set_ins  on public.settings for insert with check (is_linked_clinician(patient_id));
create policy set_upd  on public.settings for update using (is_linked_clinician(patient_id)) with check (is_linked_clinician(patient_id));

-- Live tracking (Realtime respects the policies above)
alter publication supabase_realtime add table public.attempts, public.sessions, public.settings;

-- AFTER signing up your clinician account in the dashboard, run:
-- update public.profiles set role = 'clinician' where id = (select id from auth.users where email = 'you@example.com');

-- ===== Stage 1 addition: safe clinician sign-up with a secret access code =====
-- Nobody can read this table from the website (RLS on, no policies). Only claim_clinician() checks it.
create table public.app_secrets (key text primary key, value text not null);
alter table public.app_secrets enable row level security;
insert into public.app_secrets values ('clinician_code', 'CHANGE-ME-2026');   -- <- change this code before your demo

create function public.claim_clinician(p_code text) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from app_secrets where key = 'clinician_code' and value = trim(p_code)) then
    raise exception 'Wrong clinician access code';
  end if;
  update profiles set role = 'clinician' where id = auth.uid();
end $$;
revoke all on function public.claim_clinician(text) from public, anon;
grant execute on function public.claim_clinician(text) to authenticated;
