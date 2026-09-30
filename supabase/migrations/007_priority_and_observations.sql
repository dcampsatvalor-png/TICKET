-- Prioridad de incidencias + observaciones internas del equipo

do $$ begin
  create type public.ticket_priority as enum ('low', 'medium', 'high');
exception
  when duplicate_object then null;
end $$;

alter table public.tickets
  add column if not exists priority public.ticket_priority not null default 'medium';

create index if not exists tickets_priority_idx on public.tickets (priority);

create table if not exists public.ticket_observations (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists ticket_observations_ticket_id_idx
  on public.ticket_observations (ticket_id, created_at);

alter table public.ticket_observations enable row level security;

drop policy if exists "Agents can view observations" on public.ticket_observations;
create policy "Agents can view observations"
  on public.ticket_observations for select to authenticated using (true);

drop policy if exists "Agents can insert observations" on public.ticket_observations;
create policy "Agents can insert observations"
  on public.ticket_observations for insert to authenticated with check (true);
