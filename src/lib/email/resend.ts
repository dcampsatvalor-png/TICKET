import { Resend } from "resend";
import { hasResendConfigured } from "@/lib/env";

function buildReplySubject(ticketNumber: number, subject: string): string {
  const bare = subject
    .replace(/^\s*((re|fw|fwd|rv|aw|sv)\s*(\[\d+\])?\s*:\s*)+/i, "")
    .replace(/\s*\[Ticket\s*#\d+\]\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `Re: [Ticket #${ticketNumber}] ${bare || subject}`;
}

function appendReference(existing: string | null | undefined, messageId: string): string {
  const parts = (existing ?? "")
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.includes(messageId)) parts.push(messageId);
  return parts.join(" ");
}

export async function sendTicketReplyEmail(input: {
  to: string;
  ticketNumber: number;
  subject: string;
  body: string;
  agentName: string;
  /** RFC Message-ID of the email we are replying to */
  inReplyTo?: string | null;
  /** Existing References chain */
  references?: string | null;
  /** Outlook conversation headers */
  threadIndex?: string | null;
  threadTopic?: string | null;
}): Promise<{
  ok: boolean;
  id?: string;
  messageId?: string;
  mocked?: boolean;
  error?: string;
}> {
  const taggedSubject = buildReplySubject(input.ticketNumber, input.subject);

  if (!hasResendConfigured()) {
    console.info("[demo/email] Would send reply via Resend", {
      to: input.to,
      subject: taggedSubject,
      from: process.env.RESEND_FROM_EMAIL ?? "helpdesk@demo.local",
      inReplyTo: input.inReplyTo,
      preview: input.body.slice(0, 120),
    });
    return {
      ok: true,
      mocked: true,
      id: `demo-email-${Date.now()}`,
      messageId: `<demo-${Date.now()}@local>`,
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL!;
  // So the client's "Reply" goes back into Resend inbound → ticket thread
  const replyTo =
    process.env.RESEND_REPLY_TO ||
    process.env.RESEND_INBOUND_EMAIL ||
    undefined;

  const headers: Record<string, string> = {};
  if (input.inReplyTo) {
    headers["In-Reply-To"] = input.inReplyTo;
    headers.References = appendReference(input.references, input.inReplyTo);
  }
  // Outlook conversation view
  if (input.threadTopic) {
    headers["Thread-Topic"] = input.threadTopic;
  } else {
    headers["Thread-Topic"] = input.subject
      .replace(/^\s*((re|fw|fwd|rv)\s*:\s*)+/i, "")
      .replace(/\s*\[Ticket\s*#\d+\]\s*/gi, " ")
      .trim();
  }
  if (input.threadIndex) {
    headers["Thread-Index"] = input.threadIndex;
  }

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    ...(replyTo ? { replyTo } : {}),
    subject: taggedSubject,
    text: `${input.body}\n\n— ${input.agentName}\nSoporte IT`,
    headers,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  let messageId: string | undefined;
  if (data?.id) {
    try {
      const { data: sent } = await resend.emails.get(data.id);
      messageId = sent?.message_id ?? undefined;
    } catch {
      // non-fatal
    }
  }

  return { ok: true, id: data?.id, messageId };
}
