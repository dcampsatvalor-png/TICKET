/** Which product area an inbound email belongs to. */

export type InboundMailbox = "support" | "development";

function parseEmail(raw: string): string {
  const match = raw.match(/<([^>]+@[^>]+)>/);
  return (match ? match[1] : raw).trim().toLowerCase();
}

export function normalizeRecipientList(
  to: string | string[] | null | undefined,
  extraHeaders?: Record<string, string | null | undefined>
): string[] {
  const out = new Set<string>();
  const add = (raw?: string | null) => {
    if (!raw?.trim()) return;
    for (const part of raw.split(/[,;]/)) {
      const e = parseEmail(part);
      if (e.includes("@")) out.add(e);
    }
  };
  if (Array.isArray(to)) to.forEach(add);
  else add(to);
  if (extraHeaders) {
    add(extraHeaders["To"]);
    add(extraHeaders["to"]);
    add(extraHeaders["Cc"]);
    add(extraHeaders["cc"]);
    add(extraHeaders["Delivered-To"]);
    add(extraHeaders["X-Original-To"]);
    add(extraHeaders["Envelope-To"]);
    add(extraHeaders["X-MS-Exchange-Organization-OriginalRecipient"]);
    add(extraHeaders["X-MS-Exchange-Inbox-Rules-Loop"]);
  }
  return [...out];
}

export function developmentMailboxAddresses(): Set<string> {
  const set = new Set<string>();
  const raw =
    process.env.RESEND_DEVELOPMENT_INBOUND_EMAIL ||
    process.env.DEVELOPMENT_INBOUND_EMAIL ||
    "desarrollos@tasacioneshipotecarias.com";
  for (const part of raw.split(/[,;]/)) {
    const e = parseEmail(part);
    if (e.includes("@")) set.add(e);
  }
  return set;
}

export function classifyInboundMailbox(recipients: string[]): InboundMailbox {
  const dev = developmentMailboxAddresses();
  const hitsDev = recipients.some((r) => dev.has(r));
  if (hitsDev) return "development";
  return "support";
}

/** Collect every address that might indicate which mailbox the user wrote to. */
export function collectInboundRecipients(input: {
  to?: string | string[] | null;
  headers?: Record<string, string | null | undefined>;
}): string[] {
  const headers = input.headers ?? {};
  const fromHeaders = normalizeRecipientList(undefined, {
    To: headers["To"] ?? headers["to"],
    Cc: headers["Cc"] ?? headers["cc"],
    "Delivered-To": headers["Delivered-To"],
    "X-Original-To": headers["X-Original-To"],
    "Envelope-To": headers["Envelope-To"],
    "X-MS-Exchange-Organization-OriginalRecipient":
      headers["X-MS-Exchange-Organization-OriginalRecipient"],
  });
  const fromPayload = normalizeRecipientList(input.to);
  return [...new Set([...fromPayload, ...fromHeaders])];
}
