import { Resend } from "resend";
import { hasResendConfigured } from "@/lib/env";

export async function sendTicketReplyEmail(input: {
  to: string;
  ticketNumber: number;
  subject: string;
  body: string;
  agentName: string;
}): Promise<{ ok: boolean; id?: string; mocked?: boolean; error?: string }> {
  const taggedSubject = `[Ticket #${input.ticketNumber}] ${input.subject.replace(
    /^\s*\[Ticket\s*#\d+\]\s*/i,
    ""
  )}`;

  if (!hasResendConfigured()) {
    console.info("[demo/email] Would send reply via Resend", {
      to: input.to,
      subject: taggedSubject,
      from: process.env.RESEND_FROM_EMAIL ?? "helpdesk@demo.local",
      preview: input.body.slice(0, 120),
    });
    return { ok: true, mocked: true, id: `demo-email-${Date.now()}` };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL!;

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: taggedSubject,
    text: `${input.body}\n\n— ${input.agentName}\nSoporte IT`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data?.id };
}
