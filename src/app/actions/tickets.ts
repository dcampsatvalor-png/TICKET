"use server";

import { revalidatePath } from "next/cache";
import { sendTicketReplyEmail } from "@/lib/email/resend";
import {
  addComment,
  getCurrentProfile,
  getTicket,
  setTicketAssignee,
  setTicketStatus,
  updateTicketEmailThread,
} from "@/lib/tickets/service";
import type { TicketStatus } from "@/types/database";

export async function updateStatusAction(ticketId: string, status: TicketStatus) {
  await setTicketStatus(ticketId, status);
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true as const };
}

export async function updateAssigneeAction(
  ticketId: string,
  assignedTo: string | null
) {
  await setTicketAssignee(ticketId, assignedTo);
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true as const };
}

export async function replyAction(input: {
  ticketId: string;
  content: string;
  isInternal: boolean;
}) {
  const content = input.content.trim();
  if (!content) {
    return { ok: false as const, error: "El mensaje no puede estar vacío." };
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Sesión no válida." };
  }

  const ticket = await getTicket(input.ticketId);
  if (!ticket) {
    return { ok: false as const, error: "Ticket no encontrado." };
  }

  await addComment({
    ticketId: input.ticketId,
    content,
    isInternal: input.isInternal,
    authorId: profile.id,
  });

  if (!input.isInternal) {
    const emailResult = await sendTicketReplyEmail({
      to: ticket.sender_email,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      body: content,
      agentName: profile.full_name,
      inReplyTo: ticket.last_email_message_id,
      references: ticket.email_references,
      threadIndex: ticket.email_thread_index,
      threadTopic: ticket.email_thread_topic ?? ticket.subject,
    });
    if (!emailResult.ok) {
      return {
        ok: false as const,
        error: emailResult.error ?? "No se pudo enviar el correo.",
      };
    }
    if (emailResult.messageId) {
      await updateTicketEmailThread(
        ticket.id,
        emailResult.messageId,
        ticket.email_references
      );
    }
  }

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${input.ticketId}`);
  return { ok: true as const };
}
