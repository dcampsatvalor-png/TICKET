-- Outlook / email client conversation headers for proper threading
alter table public.tickets
  add column if not exists email_thread_index text,
  add column if not exists email_thread_topic text;
