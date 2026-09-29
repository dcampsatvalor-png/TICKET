"use server";

import { revalidatePath } from "next/cache";
import { sendDevelopmentReplyEmail } from "@/lib/email/resend";
import {
  addDevelopmentComment,
  getCurrentProfile,
  getDevelopmentRequest,
  setDevelopmentAssignee,
  setDevelopmentStatus,
  updateDevelopmentEmailThread,
} from "@/lib/developments/service";
import type { TicketStatus } from "@/types/database";

export async function updateDevelopmentStatusAction(
  requestId: string,
  status: TicketStatus
) {
  await setDevelopmentStatus(requestId, status);
  revalidatePath("/desarrollos");
  revalidatePath(`/desarrollos/${requestId}`);
  return { ok: true as const };
}

export async function updateDevelopmentAssigneeAction(
  requestId: string,
  assignedTo: string | null
) {
  await setDevelopmentAssignee(requestId, assignedTo);
  revalidatePath("/desarrollos");
  revalidatePath(`/desarrollos/${requestId}`);
  return { ok: true as const };
}

export async function developmentReplyAction(input: {
  requestId: string;
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

  const request = await getDevelopmentRequest(input.requestId);
  if (!request) {
    return { ok: false as const, error: "Petición no encontrada." };
  }

  await addDevelopmentComment({
    requestId: input.requestId,
    content,
    isInternal: input.isInternal,
    authorId: profile.id,
  });

  if (!input.isInternal) {
    const emailResult = await sendDevelopmentReplyEmail({
      to: request.sender_email,
      requestNumber: request.request_number,
      subject: request.subject,
      body: content,
      agentName: profile.full_name,
      inReplyTo: request.last_email_message_id,
      references: request.email_references,
      threadIndex: request.email_thread_index,
      threadTopic: request.email_thread_topic ?? request.subject,
    });
    if (!emailResult.ok) {
      return {
        ok: false as const,
        error: emailResult.error ?? "No se pudo enviar el correo.",
      };
    }
    if (emailResult.messageId || emailResult.threadIndex) {
      await updateDevelopmentEmailThread(
        request.id,
        emailResult.messageId,
        request.email_references,
        emailResult.threadIndex
      );
    }
  }

  revalidatePath("/desarrollos");
  revalidatePath(`/desarrollos/${input.requestId}`);
  return { ok: true as const };
}
