-- Peticiones de nuevo desarrollo (buzón desarrollos@…)

create sequence if not exists public.development_requests_request_number_seq start 2001;

create table if not exists public.development_requests (
  id uuid primary key default gen_random_uuid(),
  request_number bigint not null default nextval('public.development_requests_request_number_seq') unique,
  subject text not null,
  description text not null default '',
  sender_email text not null,
  sender_name text,
  status public.ticket_status not null default 'open',
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_email_message_id text,
  email_references text,
  email_thread_index text,
  email_thread_topic text
);

alter sequence public.development_requests_request_number_seq
  owned by public.development_requests.request_number;

create table if not exists public.development_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.development_requests (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  is_internal boolean not null default false,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists development_requests_status_idx on public.development_requests (status);
create index if not exists development_requests_assigned_to_idx on public.development_requests (assigned_to);
create index if not exists development_requests_created_at_idx on public.development_requests (created_at desc);
create index if not exists development_request_comments_request_id_idx
  on public.development_request_comments (request_id, created_at);

drop trigger if exists development_requests_set_updated_at on public.development_requests;
create trigger development_requests_set_updated_at
  before update on public.development_requests
  for each row execute function public.set_updated_at();

alter table public.development_requests enable row level security;
alter table public.development_request_comments enable row level security;

drop policy if exists "Agents can view development requests" on public.development_requests;
create policy "Agents can view development requests"
  on public.development_requests for select to authenticated using (true);

drop policy if exists "Agents can insert development requests" on public.development_requests;
create policy "Agents can insert development requests"
  on public.development_requests for insert to authenticated with check (true);

drop policy if exists "Agents can update development requests" on public.development_requests;
create policy "Agents can update development requests"
  on public.development_requests for update to authenticated using (true) with check (true);

drop policy if exists "Agents can view development comments" on public.development_request_comments;
create policy "Agents can view development comments"
  on public.development_request_comments for select to authenticated using (true);

drop policy if exists "Agents can insert development comments" on public.development_request_comments;
create policy "Agents can insert development comments"
  on public.development_request_comments for insert to authenticated with check (true);
