import { isDemoMode } from "@/lib/env";
import {
  addDemoDevelopmentComment,
  createDemoDevelopmentRequest,
  findDemoDevelopmentByNumber,
  getDemoDevelopmentRequest,
  listDemoDevelopmentRequests,
  listOpenDemoDevelopmentsBySender,
  updateDemoDevelopmentAssignee,
  updateDemoDevelopmentEmailThread,
  updateDemoDevelopmentStatus,
} from "@/lib/demo/developments-store";
import {
  cleanDevelopmentSubject,
  extractDevelopmentNumber,
} from "@/lib/email/development-threading";
import {
  messageIdListIncludes,
  messageIdsEqual,
  normalizeEmailSubject,
} from "@/lib/email/threading";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type {
  AssignmentFilter,
  DevelopmentRequest,
  DevelopmentRequestComment,
  DevelopmentRequestListItem,
  DevelopmentRequestWithRelations,
  Profile,
  StatusFilter,
  TicketStatus,
} from "@/types/database";
import { getCurrentProfile, listAgents } from "@/lib/tickets/service";

export { getCurrentProfile, listAgents };

export async function listDevelopmentRequests(filters: {
  status: StatusFilter;
  assignment?: AssignmentFilter;
  createdFrom?: Date | null;
  createdTo?: Date | null;
}): Promise<DevelopmentRequestListItem[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  if (isDemoMode()) {
    return listDemoDevelopmentRequests({
      status: filters.status,
      assignment: filters.assignment ?? "all",
      currentUserId: profile.id,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
    });
  }

  const supabase = await createClient();
  let query = supabase
    .from("development_requests")
    .select("*, assignee:profiles!development_requests_assigned_to_fkey(*)")
    .order("updated_at", { ascending: false });

  if (filters.status === "active") {
    query = query.in("status", ["open", "in_progress"]);
  } else if (filters.status === "done") {
    query = query.in("status", ["resolved", "closed"]);
  } else if (filters.status === "all") {
    query = query.neq("status", "cancelled");
  } else {
    query = query.eq("status", filters.status);
  }
  if (filters.assignment === "mine") {
    query = query.eq("assigned_to", profile.id);
  } else if (filters.assignment === "unassigned") {
    query = query.is("assigned_to", null).neq("status", "cancelled");
  }
  if (filters.createdFrom) {
    query = query.gte("created_at", filters.createdFrom.toISOString());
  }
  if (filters.createdTo) {
    query = query.lte("created_at", filters.createdTo.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DevelopmentRequestListItem[];
}

export async function getDevelopmentRequest(
  id: string
): Promise<DevelopmentRequestWithRelations | null> {
  if (isDemoMode()) return getDemoDevelopmentRequest(id);

  const supabase = await createClient();
  const { data: request, error } = await supabase
    .from("development_requests")
    .select("*, assignee:profiles!development_requests_assigned_to_fkey(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!request) return null;

  const { data: comments, error: commentsError } = await supabase
    .from("development_request_comments")
    .select("*, author:profiles(*)")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  if (commentsError) throw commentsError;

  return {
    ...(request as DevelopmentRequest & { assignee: Profile | null }),
    comments: (comments ?? []) as (DevelopmentRequestComment & {
      author: Profile | null;
    })[],
  };
}

export async function setDevelopmentStatus(
  id: string,
  status: TicketStatus
): Promise<void> {
  if (isDemoMode()) {
    updateDemoDevelopmentStatus(id, status);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("development_requests")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function setDevelopmentAssignee(
  id: string,
  assignedTo: string | null
): Promise<void> {
  if (isDemoMode()) {
    updateDemoDevelopmentAssignee(id, assignedTo);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("development_requests")
    .update({ assigned_to: assignedTo })
    .eq("id", id);
  if (error) throw error;
}

export async function addDevelopmentComment(input: {
  requestId: string;
  content: string;
  isInternal: boolean;
  authorId: string | null;
}): Promise<DevelopmentRequestComment> {
  if (isDemoMode()) {
    addDemoDevelopmentComment(input);
    return {
      id: `dev-comment-${Date.now()}`,
      request_id: input.requestId,
      author_id: input.authorId,
      is_internal: input.isInternal,
      content: input.content,
      created_at: new Date().toISOString(),
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("development_request_comments")
    .insert({
      request_id: input.requestId,
      content: input.content,
      is_internal: input.isInternal,
      author_id: input.authorId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DevelopmentRequestComment;
}

function subjectsMatchForThread(emailSubject: string, requestSubject: string): boolean {
  const a = normalizeEmailSubject(emailSubject);
  const b = normalizeEmailSubject(requestSubject);
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

async function appendInboundDevelopmentComment(
  request: DevelopmentRequest,
  body: string,
  messageId?: string | null,
  threadMeta?: { threadIndex?: string | null; threadTopic?: string | null }
): Promise<{ request: DevelopmentRequest; created: false }> {
  if (isDemoMode()) {
    addDemoDevelopmentComment({
      requestId: request.id,
      authorId: null,
      content: body,
      isInternal: false,
    });
    if (messageId) {
      request.last_email_message_id = messageId;
      request.email_references = appendMessageIdChain(
        request.email_references,
        messageId
      );
    }
    if (threadMeta?.threadIndex) request.email_thread_index = threadMeta.threadIndex;
    if (threadMeta?.threadTopic) request.email_thread_topic = threadMeta.threadTopic;
    request.updated_at = new Date().toISOString();
    return { request, created: false };
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  await supabase.from("development_request_comments").insert({
    request_id: request.id,
    author_id: null,
    content: body,
    is_internal: false,
  });

  const patch: Record<string, string> = { updated_at: now };
  if (messageId) {
    patch.last_email_message_id = messageId;
    patch.email_references = appendMessageIdChain(
      request.email_references,
      messageId
    );
  }
  if (threadMeta?.threadIndex) patch.email_thread_index = threadMeta.threadIndex;
  if (threadMeta?.threadTopic) patch.email_thread_topic = threadMeta.threadTopic;
  await supabase.from("development_requests").update(patch).eq("id", request.id);
  return {
    request: { ...request, ...patch },
    created: false,
  };
}

export async function ingestDevelopmentInboundEmail(input: {
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string | null;
  messageId?: string | null;
  inReplyTo?: string | null;
  referencesHeader?: string | null;
  threadIndex?: string | null;
  threadTopic?: string | null;
}): Promise<{ request: DevelopmentRequest; created: boolean }> {
  const requestNumber = extractDevelopmentNumber(input.subject, input.body);
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

  function requestMatchesThreadIds(r: DevelopmentRequest): boolean {
    if (
      r.last_email_message_id &&
      threadIds.some((id) => messageIdsEqual(id, r.last_email_message_id!))
    ) {
      return true;
    }
    return threadIds.some((id) =>
      messageIdListIncludes(r.email_references, id)
    );
  }

  if (isDemoMode()) {
    if (requestNumber != null) {
      const existing = findDemoDevelopmentByNumber(requestNumber);
      if (existing) {
        return appendInboundDevelopmentComment(
          existing,
          input.body,
          messageId,
          threadMeta
        );
      }
    }

    const openForSender = listOpenDemoDevelopmentsBySender(input.senderEmail);
    const byHeader = openForSender.find((r) => requestMatchesThreadIds(r));
    if (byHeader) {
      return appendInboundDevelopmentComment(
        byHeader,
        input.body,
        messageId,
        threadMeta
      );
    }

    const sameSubject = openForSender.find((r) =>
      subjectsMatchForThread(input.subject, r.subject)
    );
    if (sameSubject) {
      return appendInboundDevelopmentComment(
        sameSubject,
        input.body,
        messageId,
        threadMeta
      );
    }

    const request = createDemoDevelopmentRequest({
      subject: cleanDevelopmentSubject(input.subject),
      description: input.body,
      senderEmail: input.senderEmail,
      senderName: input.senderName,
      messageId,
    });
    return { request, created: true };
  }

  const supabase = createServiceClient();

  if (requestNumber != null) {
    const { data: existing } = await supabase
      .from("development_requests")
      .select("*")
      .eq("request_number", requestNumber)
      .maybeSingle();
    if (existing) {
      return appendInboundDevelopmentComment(
        existing as DevelopmentRequest,
        input.body,
        messageId,
        threadMeta
      );
    }
  }

  if (threadIds.length > 0) {
    const { data: recent } = await supabase
      .from("development_requests")
      .select("*")
      .in("status", ["open", "in_progress", "resolved", "closed"])
      .order("updated_at", { ascending: false })
      .limit(80);
    const matched = ((recent ?? []) as DevelopmentRequest[]).find((r) =>
      requestMatchesThreadIds(r)
    );
    if (matched) {
      return appendInboundDevelopmentComment(
        matched,
        input.body,
        messageId,
        threadMeta
      );
    }
  }

  const { data: openRequests } = await supabase
    .from("development_requests")
    .select("*")
    .ilike("sender_email", input.senderEmail)
    .in("status", ["open", "in_progress"])
    .order("updated_at", { ascending: false });

  const openList = (openRequests ?? []) as DevelopmentRequest[];
  const sameSubject = openList.find((r) =>
    subjectsMatchForThread(input.subject, r.subject)
  );
  if (sameSubject) {
    return appendInboundDevelopmentComment(
      sameSubject,
      input.body,
      messageId,
      threadMeta
    );
  }

  const subject = cleanDevelopmentSubject(input.subject);
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
    .from("development_requests")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) throw error;
  return { request: created as DevelopmentRequest, created: true };
}

export async function updateDevelopmentEmailThread(
  requestId: string,
  messageId: string | null | undefined,
  previousReferences?: string | null,
  threadIndex?: string | null
): Promise<void> {
  if (isDemoMode()) {
    updateDemoDevelopmentEmailThread(
      requestId,
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

  await supabase.from("development_requests").update(patch).eq("id", requestId);
}
