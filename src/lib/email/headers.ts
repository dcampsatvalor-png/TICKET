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
 * Message-ID of *this* inbound email (not the parent).
 *
 * When Outlook copies mail into Resend it may mint a new Message-ID; prefer
 * X-Original-Message-ID / X-Microsoft-Original-Message-ID when present.
 *
 * Do NOT use In-Reply-To, References, or X-MS-Exchange-Parent-Message-Id here:
 * those identify the parent and, if stored as last_email_message_id, break
 * threading for the next reply in the conversation.
 */
export function resolveOriginalMessageId(input: {
  messageId?: string | null;
  headers?: Record<string, string> | null;
}): string | null {
  const headers = input.headers ?? {};
  const candidates = [
    headerGet(headers, "X-Original-Message-ID"),
    headerGet(headers, "X-Microsoft-Original-Message-ID"),
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
