-- Add "Anulado" (cancelled) ticket status
alter type public.ticket_status add value if not exists 'cancelled';
