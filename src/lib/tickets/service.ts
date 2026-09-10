import { isDemoMode } from "@/lib/env";
import {
  addDemoComment,
  createDemoTicket,
  findDemoTicketByNumber,
  findOpenDemoTicketBySender,
  getDemoAgents,
  getDemoCurrentUser,
  getDemoTicket,
  listDemoTickets,
  updateDemoTicketAssignee,
  updateDemoTicketStatus,
} from "@/lib/demo/store";
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

/** Inbound webhook helpers (service role or demo). */
export async function ingestInboundEmail(input: {
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string | null;
}): Promise<{ ticket: Ticket; created: boolean }> {
  const ticketNumberMatch = input.subject.match(/\[Ticket\s*#(\d+)\]/i);

  if (isDemoMode()) {
    if (ticketNumberMatch) {
      const existing = findDemoTicketByNumber(Number(ticketNumberMatch[1]));
      if (existing) {
        addDemoComment({
          ticketId: existing.id,
          authorId: null,
          content: input.body,
          isInternal: false,
        });
        return { ticket: existing, created: false };
      }
    }
    const open = findOpenDemoTicketBySender(input.senderEmail);
    if (open) {
      addDemoComment({
        ticketId: open.id,
        authorId: null,
        content: input.body,
        isInternal: false,
      });
      return { ticket: open, created: false };
    }
    const ticket = createDemoTicket({
      subject: input.subject.replace(/\s*\[Ticket\s*#\d+\]\s*/gi, "").trim() || input.subject,
      description: input.body,
      senderEmail: input.senderEmail,
      senderName: input.senderName,
    });
    return { ticket, created: true };
  }

  const supabase = createServiceClient();

  if (ticketNumberMatch) {
    const { data: existing } = await supabase
      .from("tickets")
      .select("*")
      .eq("ticket_number", Number(ticketNumberMatch[1]))
      .maybeSingle();
    if (existing) {
      await supabase.from("ticket_comments").insert({
        ticket_id: existing.id,
        author_id: null,
        content: input.body,
        is_internal: false,
      });
      return { ticket: existing as Ticket, created: false };
    }
  }

  const { data: openTickets } = await supabase
    .from("tickets")
    .select("*")
    .ilike("sender_email", input.senderEmail)
    .in("status", ["open", "in_progress"])
    .order("updated_at", { ascending: false })
    .limit(1);

  const open = openTickets?.[0] as Ticket | undefined;
  if (open) {
    await supabase.from("ticket_comments").insert({
      ticket_id: open.id,
      author_id: null,
      content: input.body,
      is_internal: false,
    });
    return { ticket: open, created: false };
  }

  const subject =
    input.subject.replace(/\s*\[Ticket\s*#\d+\]\s*/gi, "").trim() || input.subject;

  const { data: created, error } = await supabase
    .from("tickets")
    .insert({
      subject,
      description: input.body,
      sender_email: input.senderEmail,
      sender_name: input.senderName,
      status: "open",
    })
    .select("*")
    .single();

  if (error) throw error;
  return { ticket: created as Ticket, created: true };
}
