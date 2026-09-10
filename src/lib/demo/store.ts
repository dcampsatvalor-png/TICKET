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

const DEMO_AGENTS: Profile[] = [
  {
    id: "demo-agent-1",
    full_name: "Ana Ruiz",
    email: "ana.ruiz@empresa.local",
    created_at: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "demo-agent-2",
    full_name: "Carlos Méndez",
    email: "carlos.mendez@empresa.local",
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
  nextTicketNumber: number;
};

declare global {
  // eslint-disable-next-line no-var
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
      assigned_to: "demo-agent-2",
      created_at: hoursAgo(72),
      updated_at: hoursAgo(12),
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

  return {
    profiles: DEMO_AGENTS,
    tickets,
    comments,
    nextTicketNumber: 1004,
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

export function getDemoCurrentUser(): Profile {
  return getStore().profiles[0];
}

export function listDemoTickets(filters: {
  status: StatusFilter;
  assignment: AssignmentFilter;
  currentUserId: string;
}): TicketListItem[] {
  const store = getStore();
  return store.tickets
    .filter((t) => (filters.status === "all" ? true : t.status === filters.status))
    .filter((t) => {
      if (filters.assignment === "mine") return t.assigned_to === filters.currentUserId;
      if (filters.assignment === "unassigned") return t.assigned_to === null;
      return true;
    })
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .map((ticket) => ({
      ...ticket,
      assignee: store.profiles.find((p) => p.id === ticket.assigned_to) ?? null,
    }));
}

export function getDemoTicket(id: string): TicketWithRelations | null {
  const store = getStore();
  const ticket = store.tickets.find((t) => t.id === id);
  if (!ticket) return null;
  return {
    ...ticket,
    assignee: store.profiles.find((p) => p.id === ticket.assigned_to) ?? null,
    comments: store.comments
      .filter((c) => c.ticket_id === id)
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
      .map((c) => ({
        ...c,
        author: store.profiles.find((p) => p.id === c.author_id) ?? null,
      })),
  };
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
    assigned_to: null,
    created_at: now,
    updated_at: now,
  };
  store.tickets.unshift(ticket);
  return ticket;
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

export function findDemoTicketByNumber(ticketNumber: number): Ticket | null {
  return getStore().tickets.find((t) => t.ticket_number === ticketNumber) ?? null;
}
