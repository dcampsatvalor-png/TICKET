-- Email threading metadata for inbound/outbound conversation
alter table public.tickets
  add column if not exists last_email_message_id text,
  add column if not exists email_references text;

comment on column public.tickets.last_email_message_id is
  'RFC Message-ID of the latest email in the thread (for In-Reply-To)';
comment on column public.tickets.email_references is
  'Space-separated RFC Message-ID chain for References header';
