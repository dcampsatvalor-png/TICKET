import { isDemoMode } from "@/lib/env";
import {
  addDemoComment,
  createDemoTicket,
  findDemoTicketByNumber,
  getDemoAgents,
  getDemoCurrentUser,
  getDemoTicket,
  listDemoTickets,
  listOpenDemoTicketsBySender,
  updateDemoTicketAssignee,
  updateDemoTicketEmailThread,
  updateDemoTicketStatus,
} from "@/lib/demo/store";
import {
  extractTicketNumber,
  normalizeEmailSubject,
} from "@/lib/email/threading";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type {
  AssignmentFilter,
  Profile,
  StatusFilter,
  Ticket,
  TicketComment,
  TicketListItem,
  TicketStatus,
  TicketWithRelations,
} from "@/types/database";

export async function getCurrentProfile(): Promise<Profile | null> {
  if (isDemoMode()) return getDemoCurrentUser();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as Profile;

  return {
    id: user.id,
    full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Agente",
    email: user.email ?? "",
    created_at: new Date().toISOString(),
  };
}

export async function listAgents(): Promise<Profile[]> {
  if (isDemoMode()) return getDemoAgents();
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").order("full_name");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function listTickets(filters: {
  status: StatusFilter;
  assignment: AssignmentFilter;
}): Promise<TicketListItem[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  if (isDemoMode()) {
    return listDemoTickets({
      ...filters,
      currentUserId: profile.id,
    });
  }

  const supabase = await createClient();
  let query = supabase
    .from("tickets")
    .select("*, assignee:profiles!tickets_assigned_to_fkey(*)")
    .order("updated_at", { ascending: false });

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.assignment === "mine") {
    query = query.eq("assigned_to", profile.id);
  } else if (filters.assignment === "unassigned") {
    query = query.is("assigned_to", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TicketListItem[];
}

export async function getTicket(id: string): Promise<TicketWithRelations | null> {
  if (isDemoMode()) return getDemoTicket(id);

  const supabase = await createClient();
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*, assignee:profiles!tickets_assigned_to_fkey(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!ticket) return null;

  const { data: comments, error: commentsError } = await supabase
    .from("ticket_comments")
    .select("*, author:profiles(*)")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (commentsError) throw commentsError;

  return {
    ...(ticket as Ticket & { assignee: Profile | null }),
    comments: (comments ?? []) as (TicketComment & { author: Profile | null })[],
  };
}

export async function setTicketStatus(id: string, status: TicketStatus): Promise<void> {
  if (isDemoMode()) {
    updateDemoTicketStatus(id, status);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("tickets").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function setTicketAssignee(
  id: string,
  assignedTo: string | null
): Promise<void> {
  if (isDemoMode()) {
    updateDemoTicketAssignee(id, assignedTo);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ assigned_to: assignedTo })
    .eq("id", id);
  if (error) throw error;
}

export async function addComment(input: {
  ticketId: string;
  content: string;
  isInternal: boolean;
  authorId: string | null;
}): Promise<TicketComment> {
  if (isDemoMode()) {
    return addDemoComment(input);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticket_comments")
    .insert({
      ticket_id: input.ticketId,
      content: input.content,
      is_internal: input.isInternal,
      author_id: input.authorId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as TicketComment;
}

function cleanTicketSubject(subject: string): string {
  return (
    subject.replace(/\s*\[Ticket\s*#\d+\]\s*/gi, "").trim() || subject.trim() || "(sin asunto)"
  );
}

function subjectsMatchForThread(emailSubject: string, ticketSubject: string): boolean {
  const a = normalizeEmailSubject(emailSubject);
  const b = normalizeEmailSubject(ticketSubject);
  return Boolean(a && b && a === b);
}

function appendMessageIdChain(
  existing: string | null | undefined,
  messageId: string
): string {
  const parts = (existing ?? "")
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.includes(messageId)) parts.push(messageId);
  return parts.join(" ");
}

async function appendInboundComment(
  ticket: Ticket,
  body: string,
  messageId?: string | null,
  threadMeta?: { threadIndex?: string | null; threadTopic?: string | null }
): Promise<{ ticket: Ticket; created: false }> {
  if (isDemoMode()) {
    addDemoComment({
      ticketId: ticket.id,
      authorId: null,
      content: body,
      isInternal: false,
    });
    if (messageId) {
      ticket.last_email_message_id = messageId;
      ticket.email_references = appendMessageIdChain(
        ticket.email_references,
        messageId
      );
    }
    if (threadMeta?.threadIndex) ticket.email_thread_index = threadMeta.threadIndex;
    if (threadMeta?.threadTopic) ticket.email_thread_topic = threadMeta.threadTopic;
    ticket.updated_at = new Date().toISOString();
    return { ticket, created: false };
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  await supabase.from("ticket_comments").insert({
    ticket_id: ticket.id,
    author_id: null,
    content: body,
    is_internal: false,
  });

  const patch: Record<string, string> = { updated_at: now };
  if (messageId) {
    patch.last_email_message_id = messageId;
    patch.email_references = appendMessageIdChain(
      ticket.email_references,
      messageId
    );
  }
  if (threadMeta?.threadIndex) patch.email_thread_index = threadMeta.threadIndex;
  if (threadMeta?.threadTopic) patch.email_thread_topic = threadMeta.threadTopic;
  await supabase.from("tickets").update(patch).eq("id", ticket.id);
  return {
    ticket: {
      ...ticket,
      ...patch,
    },
    created: false,
  };
}

/**
 * Threading rules (helpdesk-style conversation forever):
 * 1. Subject contains [Ticket #N] → append to that ticket
 * 2. In-Reply-To / References match a stored Message-ID on a ticket → same thread
 * 3. Same sender + open/in_progress + same normalized subject → same thread
 * 4. Otherwise → create a new ticket
 */
export async function ingestInboundEmail(input: {
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string | null;
  messageId?: string | null;
  inReplyTo?: string | null;
  referencesHeader?: string | null;
  threadIndex?: string | null;
  threadTopic?: string | null;
}): Promise<{ ticket: Ticket; created: boolean }> {
  const ticketNumber = extractTicketNumber(input.subject);
  const messageId = input.messageId?.trim() || null;
  const threadMeta = {
    threadIndex: input.threadIndex ?? null,
    threadTopic: input.threadTopic ?? null,
  };
  const threadIds = [
    input.inReplyTo,
    ...(input.referencesHeader ?? "").split(/\s+/),
  ]
    .map((id) => id?.trim())
    .filter((id): id is string => Boolean(id));

  if (isDemoMode()) {
    if (ticketNumber != null) {
      const existing = findDemoTicketByNumber(ticketNumber);
      if (existing) {
        return appendInboundComment(existing, input.body, messageId, threadMeta);
      }
    }

    const openForSender = listOpenDemoTicketsBySender(input.senderEmail);
    const byHeader = openForSender.find((t) => {
      const known = [
        t.last_email_message_id,
        ...(t.email_references ?? "").split(/\s+/),
      ]
        .map((x) => x?.trim())
        .filter(Boolean);
      return threadIds.some((id) => known.includes(id));
    });
    if (byHeader) {
      return appendInboundComment(byHeader, input.body, messageId, threadMeta);
    }

    const sameSubject = openForSender.find((t) =>
      subjectsMatchForThread(input.subject, t.subject)
    );
    if (sameSubject) {
      return appendInboundComment(sameSubject, input.body, messageId, threadMeta);
    }

    const ticket = createDemoTicket({
      subject: cleanTicketSubject(input.subject),
      description: input.body,
      senderEmail: input.senderEmail,
      senderName: input.senderName,
      messageId,
      threadIndex: threadMeta.threadIndex,
      threadTopic: threadMeta.threadTopic,
    });
    return { ticket, created: true };
  }

  const supabase = createServiceClient();

  if (ticketNumber != null) {
    const { data: existing } = await supabase
      .from("tickets")
      .select("*")
      .eq("ticket_number", ticketNumber)
      .maybeSingle();
    if (existing) {
      return appendInboundComment(
        existing as Ticket,
        input.body,
        messageId,
        threadMeta
      );
    }
  }

  if (threadIds.length > 0) {
    const { data: byLastId } = await supabase
      .from("tickets")
      .select("*")
      .in("last_email_message_id", threadIds)
      .in("status", ["open", "in_progress", "resolved"])
      .order("updated_at", { ascending: false })
      .limit(1);
    if (byLastId?.[0]) {
      return appendInboundComment(
        byLastId[0] as Ticket,
        input.body,
        messageId,
        threadMeta
      );
    }

    const { data: recent } = await supabase
      .from("tickets")
      .select("*")
      .in("status", ["open", "in_progress", "resolved"])
      .not("email_references", "is", null)
      .order("updated_at", { ascending: false })
      .limit(50);
    const matched = ((recent ?? []) as Ticket[]).find((t) => {
      const known = (t.email_references ?? "").split(/\s+/).filter(Boolean);
      if (t.last_email_message_id) known.push(t.last_email_message_id);
      return threadIds.some((id) => known.includes(id));
    });
    if (matched) {
      return appendInboundComment(matched, input.body, messageId, threadMeta);
    }
  }

  const { data: openTickets } = await supabase
    .from("tickets")
    .select("*")
    .ilike("sender_email", input.senderEmail)
    .in("status", ["open", "in_progress"])
    .order("updated_at", { ascending: false });

  const openList = (openTickets ?? []) as Ticket[];
  const sameSubject = openList.find((t) =>
    subjectsMatchForThread(input.subject, t.subject)
  );
  if (sameSubject) {
    return appendInboundComment(sameSubject, input.body, messageId, threadMeta);
  }

  const subject = cleanTicketSubject(input.subject);

  const insertRow: Record<string, unknown> = {
    subject,
    description: input.body,
    sender_email: input.senderEmail,
    sender_name: input.senderName,
    status: "open",
  };
  if (messageId) {
    insertRow.last_email_message_id = messageId;
    insertRow.email_references = messageId;
  }
  if (threadMeta.threadIndex) insertRow.email_thread_index = threadMeta.threadIndex;
  if (threadMeta.threadTopic) insertRow.email_thread_topic = threadMeta.threadTopic;

  const { data: created, error } = await supabase
    .from("tickets")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) throw error;
  return { ticket: created as Ticket, created: true };
}

export async function updateTicketEmailThread(
  ticketId: string,
  messageId: string | null | undefined,
  previousReferences?: string | null,
  threadIndex?: string | null
): Promise<void> {
  if (isDemoMode()) {
    updateDemoTicketEmailThread(
      ticketId,
      messageId,
      previousReferences,
      threadIndex
    );
    return;
  }

  const supabase = createServiceClient();
  const patch: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };
  if (messageId) {
    patch.last_email_message_id = messageId;
    patch.email_references = appendMessageIdChain(previousReferences, messageId);
  }
  if (threadIndex) patch.email_thread_index = threadIndex;
  if (!messageId && !threadIndex) return;

  await supabase.from("tickets").update(patch).eq("id", ticketId);
}
