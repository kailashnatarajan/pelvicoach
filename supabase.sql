-- All PelviCoach objects are prefixed pc_ so nothing clashes with tables you already have.
-- WARNING: running this file again DELETES all existing PelviCoach data (pc_ tables). For an existing project run supabase_update.sql instead.
drop trigger if exists pc_on_auth_user_created on auth.users;
drop function if exists public.pc_handle_new_user();
drop function if exists public.pc_set_patient(uuid, text, jsonb);
drop table if exists public.pc_sessions, public.pc_clinic_config, public.pc_profiles cascade;

-- Run this whole file once: Supabase dashboard > SQL Editor > New query > paste > Run.

create table public.pc_profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('doctor','patient')),
  name text not null,
  email text,
  doctor_id uuid references public.pc_profiles(id),
  invite_code text unique,
  mode text not null default 'workout' check (mode in ('workout','bedridden')),
  plan jsonb,
  summary jsonb,
  consent boolean not null default true,
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table public.pc_sessions (
  id text primary key,
  user_id uuid not null references public.pc_profiles(id) on delete cascade,
  ts bigint not null,
  data jsonb not null
);
-- Secret clinic code that doctors need to sign up. CHANGE THE VALUE.
create table public.pc_clinic_config (code text not null);
insert into public.pc_clinic_config values ('CHANGE-ME-CLINIC-CODE');

alter table public.pc_profiles enable row level security;
alter table public.pc_sessions enable row level security;
alter table public.pc_clinic_config enable row level security;   -- no policies: clients can never read it

create policy profiles_read on public.pc_profiles for select to authenticated
  using (id = auth.uid() or doctor_id = auth.uid());
create policy profiles_own_summary on public.pc_profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy sessions_insert on public.pc_sessions for insert to authenticated
  with check (user_id = auth.uid());
create policy sessions_read on public.pc_sessions for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.pc_profiles p where p.id = pc_sessions.user_id and p.doctor_id = auth.uid()));

revoke all on public.pc_profiles, public.pc_sessions, public.pc_clinic_config from anon, authenticated;
grant select on public.pc_profiles to authenticated;
grant update (summary) on public.pc_profiles to authenticated;      -- patients can change nothing else
grant select, insert on public.pc_sessions to authenticated;

-- Creates the profile at sign-up and checks the codes on the server.
create or replace function public.pc_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := new.raw_user_meta_data; d uuid; c text;
begin
  if m->>'role' = 'doctor' then
    if not exists (select 1 from public.pc_clinic_config where code = m->>'clinic_code') then
      raise exception 'Clinic code not accepted';
    end if;
    c := upper(substr(md5(random()::text), 1, 6));
    insert into public.pc_profiles (id, role, name, email, invite_code) values (new.id, 'doctor', m->>'name', new.email, c);
  elsif m->>'role' = 'patient' then
    select id into d from public.pc_profiles where role = 'doctor' and invite_code = upper(m->>'invite_code');
    if d is null then raise exception 'Invite code not found'; end if;
    insert into public.pc_profiles (id, role, name, email, doctor_id) values (new.id, 'patient', m->>'name', new.email, d);
  else
    raise exception 'Invalid role';
  end if;
  return new;
end $$;
create trigger pc_on_auth_user_created after insert on auth.users
  for each row execute function public.pc_handle_new_user();

-- Doctors change a patient's mode or plan only through this function.
create or replace function public.pc_set_patient(pid uuid, new_mode text, new_plan jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.pc_profiles where id = pid and doctor_id = auth.uid()) then
    raise exception 'Not allowed';
  end if;
  update public.pc_profiles set mode = coalesce(new_mode, mode), plan = coalesce(new_plan, plan) where id = pid;
end $$;
revoke all on function public.pc_set_patient(uuid, text, jsonb) from public, anon;
grant execute on function public.pc_set_patient(uuid, text, jsonb) to authenticated;

-- ===== Update block (optional doctor, patient-chosen mode) =====
-- Sign-up: the doctor invite code is now optional for patients.
create or replace function public.pc_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := new.raw_user_meta_data; d uuid; c text;
begin
  if m->>'role' = 'doctor' then
    if not exists (select 1 from public.pc_clinic_config where code = m->>'clinic_code') then
      raise exception 'Clinic code not accepted';
    end if;
    c := upper(substr(md5(random()::text), 1, 6));
    insert into public.pc_profiles (id, role, name, email, invite_code) values (new.id, 'doctor', m->>'name', new.email, c);
  elsif m->>'role' = 'patient' then
    if nullif(btrim(m->>'invite_code'), '') is not null then
      select id into d from public.pc_profiles where role = 'doctor' and invite_code = upper(btrim(m->>'invite_code'));
      if d is null then raise exception 'Invite code not found'; end if;
    end if;
    insert into public.pc_profiles (id, role, name, email, doctor_id) values (new.id, 'patient', m->>'name', new.email, d);
  else
    raise exception 'Invalid role';
  end if;
  return new;
end $$;

-- Patients choose their own mode.
grant update (mode) on public.pc_profiles to authenticated;

-- Lets the sign-up screen check an invite code and show a clear error.
create or replace function public.pc_check_invite(code text) returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from public.pc_profiles where role = 'doctor' and invite_code = upper(btrim(code)))
$$;
revoke all on function public.pc_check_invite(text) from public;
grant execute on function public.pc_check_invite(text) to anon, authenticated;

-- Patients can link or unlink a doctor later (null or empty code = unlink).
create or replace function public.pc_link_doctor(code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare d uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if code is null or btrim(code) = '' then
    update public.pc_profiles set doctor_id = null, plan = null where id = auth.uid() and role = 'patient';
    return true;
  end if;
  select id into d from public.pc_profiles where role = 'doctor' and invite_code = upper(btrim(code));
  if d is null then return false; end if;
  update public.pc_profiles set doctor_id = d where id = auth.uid() and role = 'patient';
  return true;
end $$;
revoke all on function public.pc_link_doctor(text) from public, anon;
grant execute on function public.pc_link_doctor(text) to authenticated;
