-- UPDATE: optional doctor link + patient-chosen mode. Safe to run on top of your existing setup (keeps all accounts and data).
-- Supabase dashboard > SQL Editor > New query > paste > Run.

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
