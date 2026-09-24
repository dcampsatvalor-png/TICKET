/**
 * Addresses that belong to the helpdesk itself.
 * Inbound mail FROM these is almost always an echo of an agent reply
 * (Outlook copy/redirect of incidencias@ outbound) and must NOT open a new ticket.
 */

function emailFromFromHeader(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const match = raw.match(/<([^>]+@[^>]+)>/);
  const email = (match ? match[1] : raw).trim().toLowerCase();
  return email.includes("@") ? email : null;
}

export function helpdeskSystemAddresses(): Set<string> {
  const set = new Set<string>();
  const fromEnv = [
    process.env.RESEND_FROM_EMAIL,
    process.env.RESEND_REPLY_TO,
    process.env.RESEND_INBOUND_EMAIL,
    process.env.HELP_DESK_IGNORE_FROM,
  ];
  for (const raw of fromEnv) {
    if (!raw) continue;
    for (const part of raw.split(/[,;]/)) {
      const email = emailFromFromHeader(part) ?? part.trim().toLowerCase();
      if (email.includes("@")) set.add(email);
    }
  }
  // Known production mailboxes for this deployment
  set.add("incidencias@grupoatvalor.com");
  set.add("soporte@grupoatvalor.com");
  set.add("tickets@pelioluu.resend.app");
  return set;
}

export function isHelpdeskSystemAddress(email: string): boolean {
  return helpdeskSystemAddresses().has(email.trim().toLowerCase());
}
