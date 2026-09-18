-- Helpdesk / Ticket Management schema for Supabase
-- Run in the Supabase SQL editor or via supabase db push

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  created_at timestamptz not null default now()
);

-- Tickets
create sequence if not exists public.tickets_ticket_number_seq start 1001;

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number bigint not null default nextval('public.tickets_ticket_number_seq') unique,
  subject text not null,
  description text not null default '',
  sender_email text not null,
  sender_name text,
  status public.ticket_status not null default 'open',
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter sequence public.tickets_ticket_number_seq owned by public.tickets.ticket_number;

-- Comments / timeline
create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  is_internal boolean not null default false,
  content text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_assigned_to_idx on public.tickets (assigned_to);
create index if not exists tickets_sender_email_idx on public.tickets (lower(sender_email));
create index if not exists tickets_created_at_idx on public.tickets (created_at desc);
create index if not exists ticket_comments_ticket_id_idx on public.ticket_comments (ticket_id, created_at);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_comments enable row level security;

-- Authenticated agents can read/update all helpdesk data
drop policy if exists "Agents can view profiles" on public.profiles;
create policy "Agents can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Agents can update own profile" on public.profiles;
create policy "Agents can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Agents can view tickets" on public.tickets;
create policy "Agents can view tickets"
  on public.tickets for select
  to authenticated
  using (true);

drop policy if exists "Agents can insert tickets" on public.tickets;
create policy "Agents can insert tickets"
  on public.tickets for insert
  to authenticated
  with check (true);

drop policy if exists "Agents can update tickets" on public.tickets;
create policy "Agents can update tickets"
  on public.tickets for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Agents can view comments" on public.ticket_comments;
create policy "Agents can view comments"
  on public.ticket_comments for select
  to authenticated
  using (true);

drop policy if exists "Agents can insert comments" on public.ticket_comments;
create policy "Agents can insert comments"
  on public.ticket_comments for insert
  to authenticated
  with check (true);

-- Service role (webhooks) bypasses RLS by default via the service key.
-- Optional: allow anon insert for inbound pipeline only if you use anon key (not recommended).
