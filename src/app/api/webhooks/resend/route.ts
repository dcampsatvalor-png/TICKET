import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { isDemoMode } from "@/lib/env";
import { ingestInboundEmail } from "@/lib/tickets/service";

type ResendInboundPayload = {
  type?: string;
  data?: {
    from?: string;
    subject?: string;
    text?: string | null;
    html?: string | null;
    email_id?: string;
  };
  // Alternate / simplified shapes for local testing
  from?: string;
  subject?: string;
  text?: string;
  html?: string;
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

  // Shared-secret header fallback (document in README)
  const shared = req.headers.get("x-webhook-secret");
  if (secret && shared && shared === secret) {
    return true;
  }

  // Svix signature verification (Resend webhooks)
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

  // Demo / local: allow when no secret configured
  if (!secret || isDemoMode()) {
    return true;
  }

  return false;
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

  const data = payload.data ?? payload;
  const fromRaw = data.from;
  const subject = data.subject ?? "(sin asunto)";
  const text = data.text ?? (data.html ? stripHtml(data.html) : "");

  if (!fromRaw) {
    return NextResponse.json({ error: "Falta el remitente" }, { status: 400 });
  }

  const { email, name } = parseAddress(fromRaw);
  const body = (text || "").trim() || "(mensaje vacío)";

  const result = await ingestInboundEmail({
    subject,
    body,
    senderEmail: email,
    senderName: name,
  });

  return NextResponse.json({
    ok: true,
    created: result.created,
    ticket_id: result.ticket.id,
    ticket_number: result.ticket.ticket_number,
  });
}
