import { NextResponse } from "next/server";
import { Resend } from "resend";
import { Webhook } from "svix";
import {
  headerGet,
  resolveOriginalMessageId,
  resolveThreadHeaders,
} from "@/lib/email/headers";
import { isHelpdeskSystemAddress } from "@/lib/email/system-addresses";
import { isDemoMode } from "@/lib/env";
import { ingestInboundEmail } from "@/lib/tickets/service";

type ResendInboundPayload = {
  type?: string;
  data?: {
    from?: string;
    to?: string[] | string;
    subject?: string;
    text?: string | null;
    html?: string | null;
    email_id?: string;
    message_id?: string;
  };
  from?: string;
  subject?: string;
  text?: string;
  html?: string;
  message_id?: string;
};

function parseAddress(raw: string): { email: string; name: string | null } {
  const match = raw.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/);
  if (match) {
    const name = match[1]?.trim() || null;
    return { email: match[2].trim().toLowerCase(), name };
  }
  return { email: raw.trim().toLowerCase(), name: null };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function verifyWebhook(req: Request, body: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  const shared = req.headers.get("x-webhook-secret");
  if (secret && shared && shared === secret) {
    return true;
  }

  if (secret?.startsWith("whsec_")) {
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) return false;
    try {
      const wh = new Webhook(secret);
      wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
      return true;
    } catch {
      return false;
    }
  }

  if (!secret || isDemoMode()) {
    return true;
  }

  return false;
}

async function resolveInboundContent(data: {
  from?: string;
  subject?: string;
  text?: string | null;
  html?: string | null;
  email_id?: string;
  message_id?: string;
}): Promise<{
  fromRaw: string;
  subject: string;
  body: string;
  messageId: string | null;
  inReplyTo: string | null;
  references: string | null;
  threadIndex: string | null;
  threadTopic: string | null;
}> {
  let fromRaw = data.from ?? "";
  let subject = data.subject ?? "(sin asunto)";
  let text: string | null = data.text ?? null;
  let html: string | null = data.html ?? null;
  let headers: Record<string, string> = {};
  let webhookMessageId: string | null = data.message_id ?? null;

  if (data.email_id && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data: email, error } = await resend.emails.receiving.get(data.email_id);
    if (error) {
      throw new Error(error.message);
    }
    if (email) {
      fromRaw = email.from || fromRaw;
      subject = email.subject || subject;
      text = email.text ?? text;
      html = email.html ?? html;
      headers = (email.headers ?? {}) as Record<string, string>;
      webhookMessageId =
        (email as { message_id?: string }).message_id ||
        headerGet(headers, "Message-ID") ||
        webhookMessageId;
    }
  }

  const messageId = resolveOriginalMessageId({
    messageId: webhookMessageId,
    headers,
  });
  const { threadIndex, threadTopic } = resolveThreadHeaders(headers);
  const inReplyTo = headerGet(headers, "In-Reply-To");
  const references = headerGet(headers, "References");

  const body =
    (text || "").trim() ||
    (html ? stripHtml(html) : "") ||
    "(mensaje vacío)";

  return {
    fromRaw,
    subject,
    body,
    messageId,
    inReplyTo,
    references,
    threadIndex,
    threadTopic,
  };
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!verifyWebhook(req, rawBody)) {
    return NextResponse.json({ error: "Firma de webhook no válida" }, { status: 401 });
  }

  let payload: ResendInboundPayload;
  try {
    payload = JSON.parse(rawBody) as ResendInboundPayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (payload.type && payload.type !== "email.received") {
    return NextResponse.json({ ok: true, ignored: payload.type });
  }

  const data = payload.data ?? payload;

  let fromRaw: string;
  let subject: string;
  let body: string;
  let messageId: string | null;
  let inReplyTo: string | null;
  let references: string | null;
  let threadIndex: string | null;
  let threadTopic: string | null;
  try {
    ({
      fromRaw,
      subject,
      body,
      messageId,
      inReplyTo,
      references,
      threadIndex,
      threadTopic,
    } = await resolveInboundContent(data));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al leer el correo";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!fromRaw) {
    return NextResponse.json({ error: "Falta el remitente" }, { status: 400 });
  }

  if (!messageId && data.message_id) {
    messageId = data.message_id;
  }

  const { email, name } = parseAddress(fromRaw);

  // Agent replies are sent From incidencias@…; Outlook may copy them back into
  // Resend. That echo must not open a second ticket (comment already saved).
  if (isHelpdeskSystemAddress(email)) {
    return NextResponse.json({
      ok: true,
      ignored: "helpdesk_outbound_echo",
      from: email,
    });
  }

  const result = await ingestInboundEmail({
    subject,
    body,
    senderEmail: email,
    senderName: name,
    messageId,
    inReplyTo,
    referencesHeader: references,
    threadIndex,
    threadTopic,
  });

  return NextResponse.json({
    ok: true,
    created: result.created,
    ticket_id: result.ticket.id,
    ticket_number: result.ticket.ticket_number,
  });
}
