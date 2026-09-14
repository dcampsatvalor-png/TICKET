/**
 * Outlook / Exchange Conversation Index (Thread-Index header).
 *
 * Root indexes are 22 bytes. Each reply MUST append a 5-byte child block
 * (MimeKit / Microsoft PR_CONVERSATION_INDEX layout). Reusing the parent
 * index unchanged makes Outlook treat the message as a new conversation.
 */

const FILETIME_EPOCH_MS = Date.UTC(1601, 0, 1);

function utcNowAsFileTime(): bigint {
  return BigInt(Date.now() - FILETIME_EPOCH_MS) * BigInt(10000);
}

/** Append one reply level to a parent Thread-Index (base64). */
export function extendThreadIndex(parentBase64: string): string | null {
  const trimmed = parentBase64.trim();
  if (!trimmed) return null;

  let parent: Buffer;
  try {
    parent = Buffer.from(trimmed, "base64");
  } catch {
    return null;
  }

  // Valid indexes are 22 + 5*n bytes
  if (parent.length < 22 || (parent.length - 22) % 5 !== 0) {
    return null;
  }

  const filetime = utcNowAsFileTime();
  const child = Buffer.alloc(5);
  // Same bit layout as MimeKit CreateReplyThreadIndex
  const mask = BigInt(0xff);
  child[0] = Number((filetime >> BigInt(33)) & mask);
  child[1] = Number((filetime >> BigInt(25)) & mask);
  child[2] = Number((filetime >> BigInt(17)) & mask);
  child[3] = Number((filetime >> BigInt(9)) & mask);
  child[4] = Number(
    ((filetime >> BigInt(1)) & BigInt(0xfe)) |
      ((filetime >> BigInt(63)) & BigInt(0x01))
  );

  return Buffer.concat([parent, child]).toString("base64");
}

/** Bare subject for Thread-Topic / reply subject (no Re:/[Ticket #]). */
export function bareConversationSubject(subject: string): string {
  return subject
    .replace(/^\s*((re|fw|fwd|rv|aw|sv)\s*(\[\d+\])?\s*:\s*)+/i, "")
    .replace(/\s*\[Ticket\s*#\d+\]\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
