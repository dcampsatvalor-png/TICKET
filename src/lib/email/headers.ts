/** Helpers to read email headers with case-insensitive keys. */
export function headerGet(
  headers: Record<string, string> | null | undefined,
  name: string
): string | null {
  if (!headers) return null;
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target && value?.trim()) return value.trim();
  }
  return null;
}

/**
 * Prefer the client's original Message-ID when mail was forwarded/copied to Resend.
 * Outlook forwards often invent a new Message-ID; the original may still appear in
 * References, In-Reply-To, or vendor-specific headers.
 */
export function resolveOriginalMessageId(input: {
  messageId?: string | null;
  headers?: Record<string, string> | null;
}): string | null {
  const headers = input.headers ?? {};
  const candidates = [
    headerGet(headers, "X-Original-Message-ID"),
    headerGet(headers, "X-MS-Exchange-Parent-Message-Id"),
    headerGet(headers, "X-Microsoft-Original-Message-ID"),
    // First id in References is often the conversation root
    ...(headerGet(headers, "References") ?? "").split(/\s+/),
    headerGet(headers, "In-Reply-To"),
    input.messageId,
    headerGet(headers, "Message-ID"),
  ]
    .map((id) => id?.trim())
    .filter((id): id is string => Boolean(id));

  return candidates[0] ?? null;
}

export function resolveThreadHeaders(headers?: Record<string, string> | null): {
  threadIndex: string | null;
  threadTopic: string | null;
} {
  return {
    threadIndex: headerGet(headers, "Thread-Index"),
    threadTopic: headerGet(headers, "Thread-Topic"),
  };
}
