"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  developmentReplyAction,
  updateDevelopmentAssigneeAction,
  updateDevelopmentStatusAction,
} from "@/app/actions/desarrollos";
import type {
  DevelopmentRequestWithRelations,
  Profile,
  TicketStatus,
} from "@/types/database";
import { STATUS_LABELS } from "@/types/database";
import { RelativeTime, StatusBadge } from "@/components/tickets/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingOverlay, Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ArrowLeft, Lock, Mail, MessageSquare } from "lucide-react";

export function DevelopmentDetail({
  request,
  agents,
}: {
  request: DevelopmentRequestWithRelations;
  agents: Profile[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingLabel, setPendingLabel] = useState("Procesando…");
  const [mode, setMode] = useState<"public" | "internal">("public");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function onStatusChange(value: string | null) {
    if (!value) return;
    setPendingLabel("Actualizando estado…");
    startTransition(async () => {
      await updateDevelopmentStatusAction(request.id, value as TicketStatus);
      router.refresh();
    });
  }

  function onAssigneeChange(value: string | null) {
    if (!value) return;
    setPendingLabel("Asignando agente…");
    startTransition(async () => {
      await updateDevelopmentAssigneeAction(
        request.id,
        value === "none" ? null : value
      );
      router.refresh();
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPendingLabel(
      mode === "internal" ? "Guardando nota…" : "Enviando respuesta…"
    );
    startTransition(async () => {
      const result = await developmentReplyAction({
        requestId: request.id,
        content,
        isInternal: mode === "internal",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setContent("");
      setSuccess(
        mode === "internal"
          ? "Nota interna guardada."
          : "Respuesta enviada al solicitante."
      );
      router.refresh();
    });
  }

  const timeline = [
    {
      id: `desc-${request.id}`,
      kind: "customer" as const,
      content: request.description,
      created_at: request.created_at,
      authorLabel: request.sender_name ?? request.sender_email,
    },
    ...request.comments.map((c) => ({
      id: c.id,
      kind: (c.author_id === null
        ? "customer"
        : c.is_internal
          ? "internal"
          : "public") as "customer" | "internal" | "public",
      content: c.content,
      created_at: c.created_at,
      authorLabel:
        c.author?.full_name ??
        (c.author_id === null
          ? (request.sender_name ?? request.sender_email)
          : "Agente"),
    })),
  ];

  function goBack() {
    setPendingLabel("Volviendo a desarrollos…");
    startTransition(() => {
      router.push("/desarrollos");
    });
  }

  return (
    <div className="relative space-y-8">
      {isPending && <LoadingOverlay label={pendingLabel} />}
      <div className="space-y-4">
        <button
          type="button"
          onClick={goBack}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800 disabled:cursor-wait"
        >
          <ArrowLeft className="size-3.5" />
          Volver a desarrollos
        </button>

        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-violet-600">
                D#{request.request_number}
              </span>
              <StatusBadge status={request.status} />
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {request.subject}
            </h1>
            <p className="text-sm text-slate-600">
              De{" "}
              <span className="font-medium text-slate-800">
                {request.sender_name ?? request.sender_email}
              </span>
              {request.sender_name && (
                <span className="text-slate-500"> · {request.sender_email}</span>
              )}
              <span className="mx-2 text-slate-300">·</span>
              <RelativeTime date={request.created_at} />
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:w-80 lg:flex-col">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={request.status}
                onValueChange={onStatusChange}
                disabled={isPending}
              >
                <SelectTrigger id="status" className="w-full bg-white">
                  <SelectValue>
                    {(value: TicketStatus | null) =>
                      value ? STATUS_LABELS[value] : "Seleccionar"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="assignee">Responsable</Label>
              <Select
                value={request.assigned_to ?? "none"}
                onValueChange={onAssigneeChange}
                disabled={isPending}
              >
                <SelectTrigger id="assignee" className="w-full bg-white">
                  <SelectValue>
                    {(value: string | null) => {
                      if (!value || value === "none") return "Sin asignar";
                      return (
                        agents.find((a) => a.id === value)?.full_name ?? "Agente"
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-slate-900">
          Cronología
        </h2>
        <ol className="space-y-3">
          {timeline.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                "rounded-xl border px-4 py-3.5 animate-in fade-in slide-in-from-left-1",
                item.kind === "customer" && "border-slate-200 bg-white",
                item.kind === "public" && "border-violet-200 bg-violet-50/50",
                item.kind === "internal" && "border-amber-200 bg-amber-50/60"
              )}
              style={{
                animationDelay: `${Math.min(index, 10) * 35}ms`,
                animationFillMode: "both",
              }}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                {item.kind === "customer" && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                    <Mail className="size-3" />
                    Correo del solicitante
                  </span>
                )}
                {item.kind === "public" && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-1.5 py-0.5 font-medium text-violet-800">
                    <MessageSquare className="size-3" />
                    Respuesta pública
                  </span>
                )}
                {item.kind === "internal" && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 font-medium text-amber-900">
                    <Lock className="size-3" />
                    Nota interna
                  </span>
                )}
                <span className="font-medium text-slate-700">{item.authorLabel}</span>
                <span className="text-slate-400">·</span>
                <RelativeTime date={item.created_at} />
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {item.content}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold text-slate-900">
          Responder
        </h2>
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("public")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition",
              mode === "public"
                ? "bg-violet-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Responder al solicitante
          </button>
          <button
            type="button"
            onClick={() => setMode("internal")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition",
              mode === "internal"
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Nota interna
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              mode === "public"
                ? "Escribe la respuesta que recibirá el solicitante por correo…"
                : "Nota visible solo para el equipo…"
            }
            rows={5}
            className="resize-y bg-slate-50/50"
            required
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-violet-700" role="status">
              {success}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {mode === "public"
                ? "Se envía desde desarrollos@… con [Desarrollo #…] en el asunto."
                : "Solo se guarda en el panel."}
            </p>
            <Button type="submit" disabled={isPending || !content.trim()}>
              {isPending ? (
                <Spinner
                  label={mode === "public" ? "Enviando…" : "Guardando…"}
                />
              ) : mode === "public" ? (
                "Enviar respuesta"
              ) : (
                "Guardar nota"
              )}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
