/**
 * Normalize email subjects for threading: strip reply/forward prefixes
 * and [Ticket #N] tags so "Re: Impresora" matches ticket "Impresora".
 */
export function normalizeEmailSubject(subject: string): string {
  let s = subject.trim();
  s = s.replace(/\s*\[Ticket\s*#\d+\]\s*/gi, " ");
  // Strip repeated Re:/Fw:/Rv:/AW:/SV: style prefixes (ES/EN/DE/…)
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = s
      .replace(
        /^(re|fw|fwd|rv|aw|sv|antw|resp)\s*(\[\d+\])?\s*:\s*/i,
        ""
      )
      .trim();
  }
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

export function isReplyOrForwardSubject(subject: string): boolean {
  return /^(re|fw|fwd|rv|aw|sv|antw|resp)\s*(\[\d+\])?\s*:/i.test(subject.trim());
}

export function extractTicketNumber(subject: string): number | null {
  const match = subject.match(/\[Ticket\s*#(\d+)\]/i);
  return match ? Number(match[1]) : null;
}

/** Subject first, then body footer ("Ticket #123" / "[Ticket #123]"). */
export function extractTicketNumberFromEmail(
  subject: string,
  body?: string | null
): number | null {
  const fromSubject = extractTicketNumber(subject);
  if (fromSubject != null) return fromSubject;
  if (!body) return null;
  const match =
    body.match(/\[Ticket\s*#(\d+)\]/i) || body.match(/\bTicket\s*#(\d+)\b/i);
  return match ? Number(match[1]) : null;
}

/** Compare Message-IDs ignoring <> and case. */
export function normalizeMessageId(id: string): string {
  return id.trim().replace(/^<|>$/g, "").toLowerCase();
}

export function messageIdsEqual(a: string, b: string): boolean {
  return normalizeMessageId(a) === normalizeMessageId(b);
}

export function messageIdListIncludes(
  haystack: string | null | undefined,
  needle: string
): boolean {
  const n = normalizeMessageId(needle);
  if (!n) return false;
  return (haystack ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .some((id) => normalizeMessageId(id) === n);
}
