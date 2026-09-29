export function extractDevelopmentNumber(subject: string, body?: string | null): number | null {
  const fromSubject = subject.match(/\[Desarrollo\s*#(\d+)\]/i);
  if (fromSubject) return Number(fromSubject[1]);
  if (!body) return null;
  const fromBody =
    body.match(/\[Desarrollo\s*#(\d+)\]/i) || body.match(/\bDesarrollo\s*#(\d+)\b/i);
  return fromBody ? Number(fromBody[1]) : null;
}

export function cleanDevelopmentSubject(subject: string): string {
  let s = subject.trim();
  s = s.replace(/\s*\[Desarrollo\s*#\d+\]\s*/gi, " ");
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = s.replace(/^(re|fw|fwd|rv|aw|sv)\s*:\s*/i, "").trim();
  }
  return s.replace(/\s+/g, " ").trim() || subject;
}
