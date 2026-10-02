import type {
  AssignmentFilter,
  Profile,
  StatusFilter,
  Ticket,
  TicketComment,
  TicketListItem,
  TicketObservation,
  TicketPriority,
  TicketStatus,
  TicketWithRelations,
} from "@/types/database";
import { ticketMatchesStatusFilter } from "@/types/database";

const DEMO_AGENTS: Profile[] = [
  {
    id: "demo-agent-1",
    full_name: "Ana Ruiz",
    email: "ana.ruiz@empresa.local",
    role: "admin",
    created_at: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "demo-agent-2",
    full_name: "Carlos Méndez",
    email: "carlos.mendez@empresa.local",
    role: "employee",
    created_at: "2026-01-10T09:05:00.000Z",
  },
];

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

type DemoStore = {
  profiles: Profile[];
  tickets: Ticket[];
  comments: TicketComment[];
  observations: TicketObservation[];
  nextTicketNumber: number;
};

declare global {
  var __helpdeskDemoStore: DemoStore | undefined;
}

function seedStore(): DemoStore {
  const tickets: Ticket[] = [
    {
      id: "demo-ticket-1",
      ticket_number: 1001,
      subject: "No puedo acceder a la VPN",
      description:
        "Buenos días,\n\nDesde ayer no consigo conectarme a la VPN corporativa. El cliente muestra error de autenticación.\n\nGracias,\nLaura",
      sender_email: "laura.garcia@cliente.com",
      sender_name: "Laura García",
      status: "open",
      priority: "high",
      assigned_to: null,
      created_at: hoursAgo(5),
      updated_at: hoursAgo(5),
    },
    {
      id: "demo-ticket-2",
      ticket_number: 1002,
      subject: "Solicitud de portátil de reemplazo",
      description:
        "Hola equipo,\n\nMi portátil se ha apagado y no enciende. Necesito un equipo de reemplazo para hoy.\n\nSaludos,\nMiguel Ortega",
      sender_email: "miguel.ortega@cliente.com",
      sender_name: "Miguel Ortega",
      status: "in_progress",
      priority: "high",
      assigned_to: "demo-agent-1",
      created_at: hoursAgo(26),
      updated_at: hoursAgo(3),
    },
    {
      id: "demo-ticket-3",
      ticket_number: 1003,
      subject: "Error al imprimir en planta 2",
      description:
        "La impresora HP-204 de la planta 2 imprime páginas en blanco. ¿Podéis revisarla?",
      sender_email: "recepcion@cliente.com",
      sender_name: "Recepción",
      status: "resolved",
      priority: "medium",
      assigned_to: "demo-agent-2",
      created_at: hoursAgo(72),
      updated_at: hoursAgo(12),
    },
    {
      id: "demo-ticket-4",
      ticket_number: 1004,
      subject: "Restablecer contraseña Office 365",
      description: "No puedo entrar al correo. He intentado restablecer la clave sin éxito.",
      sender_email: "sofia.lopez@cliente.com",
      sender_name: "Sofía López",
      status: "resolved",
      priority: "medium",
      assigned_to: "demo-agent-1",
      created_at: hoursAgo(96),
      updated_at: hoursAgo(90),
    },
    {
      id: "demo-ticket-5",
      ticket_number: 1005,
      subject: "Monitor sin señal",
      description: "El monitor de mi puesto se queda en negro al encender el PC.",
      sender_email: "jorge.navarro@cliente.com",
      sender_name: "Jorge Navarro",
      status: "closed",
      priority: "low",
      assigned_to: "demo-agent-2",
      created_at: hoursAgo(140),
      updated_at: hoursAgo(120),
    },
    {
      id: "demo-ticket-6",
      ticket_number: 1006,
      subject: "Acceso carpeta compartida Contabilidad",
      description: "Necesito permisos de lectura en \\\\fileserver\\contabilidad.",
      sender_email: "marta.ruiz@cliente.com",
      sender_name: "Marta Ruiz",
      status: "resolved",
      priority: "low",
      assigned_to: "demo-agent-1",
      created_at: hoursAgo(200),
      updated_at: hoursAgo(180),
    },
    {
      id: "demo-ticket-7",
      ticket_number: 1007,
      subject: "Outlook no sincroniza",
      description: "Outlook se queda en «Actualizando carpeta de bandeja de entrada».",
      sender_email: "pedro.gil@cliente.com",
      sender_name: "Pedro Gil",
      status: "cancelled",
      priority: "low",
      assigned_to: "demo-agent-2",
      created_at: hoursAgo(48),
      updated_at: hoursAgo(40),
    },
    {
      id: "demo-ticket-8",
      ticket_number: 1008,
      subject: "Instalar Teams en portátil nuevo",
      description: "Me han entregado un portátil sin Teams. ¿Podéis instalarlo?",
      sender_email: "elena.diaz@cliente.com",
      sender_name: "Elena Díaz",
      status: "in_progress",
      priority: "medium",
      assigned_to: "demo-agent-1",
      created_at: hoursAgo(10),
      updated_at: hoursAgo(2),
    },
  ];

  const comments: TicketComment[] = [
    {
      id: "demo-comment-1",
      ticket_id: "demo-ticket-2",
      author_id: "demo-agent-1",
      is_internal: true,
      content: "He pedido un portátil de loaner al almacén. Entrega prevista a las 16:00.",
      created_at: hoursAgo(4),
    },
    {
      id: "demo-comment-2",
      ticket_id: "demo-ticket-2",
      author_id: "demo-agent-1",
      is_internal: false,
      content:
        "Hola Miguel,\n\nEstamos preparando un equipo de reemplazo. Te avisaremos cuando esté listo para recoger en IT.\n\nUn saludo,\nAna",
      created_at: hoursAgo(3),
    },
    {
      id: "demo-comment-3",
      ticket_id: "demo-ticket-3",
      author_id: "demo-agent-2",
      is_internal: false,
      content:
        "Hola,\n\nHe cambiado el cartucho y limpieado los rodillos. Ya debería imprimir correctamente. Avísanos si persiste.\n\nCarlos — Soporte IT",
      created_at: hoursAgo(12),
    },
  ];

  const observations: TicketObservation[] = [
    {
      id: "demo-obs-1",
      ticket_id: "demo-ticket-1",
      author_id: "demo-agent-1",
      content: "El usuario confirma que el fallo empezó tras actualizar el cliente VPN.",
      created_at: hoursAgo(4),
    },
  ];

  return {
    profiles: DEMO_AGENTS,
    tickets,
    comments,
    observations,
    nextTicketNumber: 1009,
  };
}

function getStore(): DemoStore {
  if (!globalThis.__helpdeskDemoStore) {
    globalThis.__helpdeskDemoStore = seedStore();
  }
  return globalThis.__helpdeskDemoStore;
}

export function getDemoAgents(): Profile[] {
  return getStore().profiles;
}

/** All tickets with assignee for analytics (no filters). */
export function listAllDemoTicketsWithAssignee(): TicketListItem[] {
  const store = getStore();
  return store.tickets.map((ticket) => ({
    ...ticket,
    assignee: store.profiles.find((p) => p.id === ticket.assigned_to) ?? null,
  }));
}

export function getDemoCurrentUser(): Profile {
  return getStore().profiles[0];
}

export function createDemoUser(input: {
  fullName: string;
  email: string;
  role: "admin" | "employee";
}): Profile {
  const store = getStore();
  const id = `demo-agent-${Date.now()}`;
  const profile: Profile = {
    id,
    full_name: input.fullName,
    email: input.email.toLowerCase(),
    role: input.role,
    created_at: new Date().toISOString(),
  };
  store.profiles.push(profile);
  return profile;
}

export function updateDemoUserRole(
  id: string,
  role: "admin" | "employee"
): Profile | null {
  const profile = getStore().profiles.find((p) => p.id === id);
  if (!profile) return null;
  profile.role = role;
  return profile;
}

function ticketMatchesSearch(ticket: Ticket, q: string): boolean {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  const bare = term.replace(/^#/, "");
  if (/^\d+$/.test(bare) && String(ticket.ticket_number) === bare) return true;
  return (
    ticket.subject.toLowerCase().includes(term) ||
    ticket.description.toLowerCase().includes(term) ||
    ticket.sender_email.toLowerCase().includes(term) ||
    (ticket.sender_name?.toLowerCase().includes(term) ?? false) ||
    String(ticket.ticket_number).includes(bare)
  );
}

export function listDemoTickets(filters: {
  status: StatusFilter;
  assignment: AssignmentFilter;
  currentUserId: string;
  createdFrom?: Date | null;
  createdTo?: Date | null;
  q?: string | null;
  priority?: TicketPriority | "all";
}): TicketListItem[] {
  const store = getStore();
  const priority = filters.priority ?? "all";
  return store.tickets
    .filter((t) => ticketMatchesStatusFilter(t.status, filters.status))
    .filter((t) => priority === "all" || (t.priority ?? "medium") === priority)
    .filter((t) => ticketMatchesSearch(t, filters.q ?? ""))
    .filter((t) => {
      if (filters.assignment === "mine") return t.assigned_to === filters.currentUserId;
      if (filters.assignment === "unassigned") {
        return t.assigned_to === null && t.status !== "cancelled";
      }
      return true;
    })
    .filter((t) => {
      const created = new Date(t.created_at).getTime();
      if (filters.createdFrom && created < filters.createdFrom.getTime()) return false;
      if (filters.createdTo && created > filters.createdTo.getTime()) return false;
      return true;
    })
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .map((ticket) => ({
      ...ticket,
      priority: ticket.priority ?? "medium",
      assignee: store.profiles.find((p) => p.id === ticket.assigned_to) ?? null,
    }));
}

export function getDemoTicket(id: string): TicketWithRelations | null {
  const store = getStore();
  const ticket = store.tickets.find((t) => t.id === id);
  if (!ticket) return null;
  return {
    ...ticket,
    priority: ticket.priority ?? "medium",
    assignee: store.profiles.find((p) => p.id === ticket.assigned_to) ?? null,
    comments: store.comments
      .filter((c) => c.ticket_id === id)
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
      .map((c) => ({
        ...c,
        author: store.profiles.find((p) => p.id === c.author_id) ?? null,
      })),
    observations: (store.observations ?? [])
      .filter((o) => o.ticket_id === id)
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
      .map((o) => ({
        ...o,
        author: store.profiles.find((p) => p.id === o.author_id) ?? null,
      })),
  };
}

export function updateDemoTicketPriority(
  id: string,
  priority: TicketPriority
): void {
  const ticket = getStore().tickets.find((t) => t.id === id);
  if (ticket) {
    ticket.priority = priority;
    ticket.updated_at = new Date().toISOString();
  }
}

export function addDemoObservation(input: {
  ticketId: string;
  authorId: string | null;
  content: string;
}): TicketObservation {
  const store = getStore();
  if (!store.observations) store.observations = [];
  const observation: TicketObservation = {
    id: `demo-obs-${crypto.randomUUID()}`,
    ticket_id: input.ticketId,
    author_id: input.authorId,
    content: input.content,
    created_at: new Date().toISOString(),
  };
  store.observations.push(observation);
  const ticket = store.tickets.find((t) => t.id === input.ticketId);
  if (ticket) ticket.updated_at = observation.created_at;
  return observation;
}

export function updateDemoTicketEmailThread(
  id: string,
  messageId: string | null | undefined,
  previousReferences?: string | null,
  threadIndex?: string | null
): Ticket | null {
  const store = getStore();
  const ticket = store.tickets.find((t) => t.id === id);
  if (!ticket) return null;
  if (messageId) {
    const parts = (previousReferences ?? ticket.email_references ?? "")
      .split(/\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.includes(messageId)) parts.push(messageId);
    ticket.last_email_message_id = messageId;
    ticket.email_references = parts.join(" ");
  }
  if (threadIndex) ticket.email_thread_index = threadIndex;
  ticket.updated_at = new Date().toISOString();
  return ticket;
}

export function updateDemoTicketStatus(id: string, status: TicketStatus): Ticket | null {
  const store = getStore();
  const ticket = store.tickets.find((t) => t.id === id);
  if (!ticket) return null;
  ticket.status = status;
  ticket.updated_at = new Date().toISOString();
  return ticket;
}

export function updateDemoTicketAssignee(
  id: string,
  assignedTo: string | null
): Ticket | null {
  const store = getStore();
  const ticket = store.tickets.find((t) => t.id === id);
  if (!ticket) return null;
  ticket.assigned_to = assignedTo;
  ticket.updated_at = new Date().toISOString();
  return ticket;
}

export function addDemoComment(input: {
  ticketId: string;
  authorId: string | null;
  content: string;
  isInternal: boolean;
}): TicketComment {
  const store = getStore();
  const comment: TicketComment = {
    id: `demo-comment-${crypto.randomUUID()}`,
    ticket_id: input.ticketId,
    author_id: input.authorId,
    is_internal: input.isInternal,
    content: input.content,
    created_at: new Date().toISOString(),
  };
  store.comments.push(comment);
  const ticket = store.tickets.find((t) => t.id === input.ticketId);
  if (ticket) ticket.updated_at = comment.created_at;
  return comment;
}

export function createDemoTicket(input: {
  subject: string;
  description: string;
  senderEmail: string;
  senderName: string | null;
  messageId?: string | null;
  threadIndex?: string | null;
  threadTopic?: string | null;
  emailReferences?: string | null;
}): Ticket {
  const store = getStore();
  const now = new Date().toISOString();
  const ticket: Ticket = {
    id: `demo-ticket-${crypto.randomUUID()}`,
    ticket_number: store.nextTicketNumber++,
    subject: input.subject,
    description: input.description,
    sender_email: input.senderEmail,
    sender_name: input.senderName,
    status: "open",
    priority: "medium",
    assigned_to: null,
    created_at: now,
    updated_at: now,
    last_email_message_id: input.messageId ?? null,
    email_references: input.emailReferences ?? input.messageId ?? null,
    email_thread_index: input.threadIndex ?? null,
    email_thread_topic: input.threadTopic ?? null,
  };
  store.tickets.unshift(ticket);
  return ticket;
}

/** All demo tickets, newest first (for inbound threading). */
export function listDemoTicketsRaw(): Ticket[] {
  return [...getStore().tickets].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function findOpenDemoTicketBySender(email: string): Ticket | null {
  const store = getStore();
  const normalized = email.toLowerCase();
  return (
    store.tickets.find(
      (t) =>
        t.sender_email.toLowerCase() === normalized &&
        (t.status === "open" || t.status === "in_progress")
    ) ?? null
  );
}

export function listOpenDemoTicketsBySender(email: string): Ticket[] {
  const store = getStore();
  const normalized = email.toLowerCase();
  return store.tickets.filter(
    (t) =>
      t.sender_email.toLowerCase() === normalized &&
      (t.status === "open" || t.status === "in_progress")
  );
}

export function findDemoTicketByNumber(ticketNumber: number): Ticket | null {
  return getStore().tickets.find((t) => t.ticket_number === ticketNumber) ?? null;
}
