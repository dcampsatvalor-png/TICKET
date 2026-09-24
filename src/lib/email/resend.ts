import { Resend } from "resend";
import {
  bareConversationSubject,
  extendThreadIndex,
} from "@/lib/email/thread-index";
import { hasResendConfigured } from "@/lib/env";

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
  /** Thread-Index actually sent (extended); store for the next reply */
  threadIndex?: string;
  mocked?: boolean;
  error?: string;
}> {
  // Keep client subject as a normal "Re: …" so Outlook/Gmail stay in-thread.
  // Ticket number goes in the body (matching still uses Message-ID / References).
  const topic =
    (input.threadTopic?.trim() || bareConversationSubject(input.subject)) ||
    input.subject;
  // Keep Thread-Topic clean for Outlook; include [Ticket #N] in subject so
  // inbound echoes / client replies can always reattach to the same ticket.
  const taggedSubject = `Re: ${topic} [Ticket #${input.ticketNumber}]`;

  const outboundThreadIndex = input.threadIndex
    ? extendThreadIndex(input.threadIndex) ?? undefined
    : undefined;

  if (!hasResendConfigured()) {
    console.info("[demo/email] Would send reply via Resend", {
      to: input.to,
      subject: taggedSubject,
      from: process.env.RESEND_FROM_EMAIL ?? "helpdesk@demo.local",
      inReplyTo: input.inReplyTo,
      threadIndex: outboundThreadIndex,
      preview: input.body.slice(0, 120),
    });
    return {
      ok: true,
      mocked: true,
      id: `demo-email-${Date.now()}`,
      messageId: `<demo-${Date.now()}@local>`,
      threadIndex: outboundThreadIndex,
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL!;
  // Prefer explicit Reply-To. Do NOT fall back to Resend inbound (….resend.app):
  // clients should reply to incidencias@…; Outlook copies that mail into Resend.
  const replyTo = process.env.RESEND_REPLY_TO || undefined;

  const headers: Record<string, string> = {
    "Thread-Topic": topic,
  };
  if (input.inReplyTo) {
    headers["In-Reply-To"] = input.inReplyTo;
    headers.References = appendReference(input.references, input.inReplyTo);
  }
  if (outboundThreadIndex) {
    headers["Thread-Index"] = outboundThreadIndex;
  }

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    ...(replyTo ? { replyTo } : {}),
    subject: taggedSubject,
    text: `${input.body}\n\n— ${input.agentName}\nSoporte IT · Ticket #${input.ticketNumber}`,
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

  return {
    ok: true,
    id: data?.id,
    messageId,
    threadIndex: outboundThreadIndex,
  };
}
