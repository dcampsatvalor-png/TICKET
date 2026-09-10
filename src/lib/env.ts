/**
 * Demo mode activates when Supabase public credentials are missing.
 * The UI uses an in-memory ticket store and a fixed demo agent session.
 */
export function isDemoMode(): boolean {
  if (process.env.HELP_DESK_DEMO_MODE === "true") return true;
  if (process.env.HELP_DESK_DEMO_MODE === "false") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !url || !anon || url.includes("your-project") || anon.includes("your-anon");
}

export function hasResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}
