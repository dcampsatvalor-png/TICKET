-- Roles de agente: administrador | empleado

do $$ begin
  create type public.app_role as enum ('admin', 'employee');
exception
  when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists role public.app_role not null default 'employee';

-- Si aún no hay ningún administrador, promover a todos los perfiles actuales
-- (arranque del equipo). Los usuarios nuevos se crean como empleado por defecto.
do $$
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    update public.profiles set role = 'admin';
  end if;
end $$;

create index if not exists profiles_role_idx on public.profiles (role);

-- Al crear usuario Auth, respetar role en metadata (admin | employee)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role public.app_role := 'employee';
begin
  if coalesce(new.raw_user_meta_data->>'role', '') = 'admin' then
    new_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
        role = coalesce(excluded.role, public.profiles.role);
  return new;
end;
$$;
