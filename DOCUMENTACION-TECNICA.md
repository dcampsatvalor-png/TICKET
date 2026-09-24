# Documentación técnica — SOPORTE IT (tickets)

Referencia para desarrollo, despliegue y mantenimiento del código.

Última actualización: 2026-09-24

Índice: [DOCUMENTACION.md](./DOCUMENTACION.md) · Usuario: [DOCUMENTACION-USUARIO.md](./DOCUMENTACION-USUARIO.md)

---

## 1. Stack y despliegue

| Pieza | Uso |
|---|---|
| Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | App |
| Supabase (Auth + Postgres) | Agentes + datos |
| Resend | Outbound + inbound webhook |
| Vercel | Hosting |

- Guía operativa: `DEPLOY.md`, `README.md`
- Repo GitHub: `dcampsatvalor-png/TICKET`
- Producción orientativa: `https://ticket-yuwb.vercel.app`

Demo sin secretos: `HELP_DESK_DEMO_MODE` / ausencia de vars Supabase → `src/lib/demo/store.ts`.

---

## 2. Estructura del código

```
src/
  app/
    login/
    tickets/               # listado + [id]
    informes/              # BI
    api/webhooks/resend/   # inbound
    actions/               # auth, tickets
  components/
    live-refresh.tsx       # auto refresh listado/detalle
    analytics/reports-view.tsx
    tickets/               # list, detail, status-badge
    layout/app-header.tsx
  lib/
    analytics/             # period.ts, service.ts
    tickets/service.ts
    email/                 # resend, threading, thread-index, headers
    demo/store.ts
    supabase/
  types/database.ts
  proxy.ts                 # session gate
supabase/migrations/
.cursor/rules/documentacion.mdc
```

---

## 3. Modelo de datos y estados

### `TicketStatus`

`open` | `in_progress` | `resolved` | `closed` | `cancelled`

Migraciones:

| Archivo | Contenido |
|---|---|
| `001_helpdesk_schema.sql` | profiles, tickets, comments, RLS, enum base |
| `002_email_threading.sql` | `last_email_message_id`, `email_references` |
| `003_outlook_thread_headers.sql` | `email_thread_index`, `email_thread_topic` |
| `004_cancelled_status.sql` | `cancelled` en enum |

### `StatusFilter`

- Estados + `all`
- Compuestos URL: `active` = open\|in_progress, `done` = resolved\|closed  
  (útiles desde Informes; **no** se exponen como chips duplicados en la UI)

Helper: `ticketMatchesStatusFilter` en `types/database.ts`.

### Regla: anuladas y “sin asignar”

En analytics y listados:

- `assignment=unassigned` → `assigned_to IS NULL` **AND** `status <> 'cancelled'`
- KPI Informes `unassignedCreated` igual
- Tabla por agente: tickets cancelados sin assignee **no** inflan la fila «Sin asignar»

Implementación: `lib/analytics/service.ts`, `lib/tickets/service.ts`, `lib/demo/store.ts`.

---

## 4. Rutas y UI

| Ruta | Rol |
|---|---|
| `/login` | Auth |
| `/tickets` | Listado + filtros (periodo + estado + asignación) + **LiveRefresh** |
| `/tickets/[id]` | Detalle + **LiveRefresh** |
| `/informes` | KPIs periodo + tabla agentes |
| `POST /api/webhooks/resend` | Inbound |

Query compartida periodo↔tickets: `lib/tickets/query.ts` (`buildTicketsHref`). Los KPI de Informes pasan `periodo`/`desde`/`hasta` al listado. `listTickets` filtra por `created_at` cuando hay rango (`resolveOptionalDateRange`).

### Actualización en vivo (`components/live-refresh.tsx`)

- Polling: `router.refresh()` cada ~8 s si la pestaña está visible (+ al volver a ella).
- Opcional: Supabase Realtime en tablas `tickets` y `ticket_comments` cuando no es demo.
- Para que Realtime funcione en el proyecto Supabase: Database → Replication / Publication `supabase_realtime` debe incluir esas tablas (si no, el polling sigue bastando).

Informes (`lib/analytics`):

- Periodo: hoy / 7d / 30d / mes / custom (`period.ts`, TZ Europe/Madrid para claves de día).
- KPIs = **estado actual** de tickets con `created_at` en rango (no contadores por `updated_at` de transiciones).
- Cards de estado usan `STATUS_STYLES` de `status-badge.tsx`.
- Clic → `/tickets?status=…` o `assignment=unassigned`.

---

## 5. Correo (Resend + Outlook)

### Flujo

```
incidencias@grupoatvalor.com (Outlook)
    → regla Copia/Redirect (no Forward) → tickets@….resend.app
    → webhook → ingestInboundEmail
Agente replyAction → Resend send (From incidencias@…)
```

No activar Receiving Resend en el dominio raíz (MX Outlook).  
Tenant M365 puede bloquear forward externo (`550 5.7.520`).

### Threading outbound (`lib/email/resend.ts`)

- Subject: `Re: {topic} [Ticket #N]` (`Thread-Topic` sigue limpio sin el tag).
- Headers: `In-Reply-To`, `References`, `Thread-Topic`, `Thread-Index` vía `extendThreadIndex`.
- Pie del cuerpo: `Ticket #N` (fallback de matching).
- `RESEND_REPLY_TO` opcional; no usar inbound Resend como Reply-To por defecto.

### Eco de respuestas del agente (importante)

La regla de Outlook puede copiar a Resend también el correo **saliente** desde `incidencias@…`. Ese eco **no** debe crear ticket: el comentario ya se guardó en `replyAction`.

- `lib/email/system-addresses.ts` + webhook: si `From` es dirección del helpdesk → `{ ignored: "helpdesk_outbound_echo" }`.
- Lista: `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`, `RESEND_INBOUND_EMAIL`, `HELP_DESK_IGNORE_FROM`, más `incidencias@` / `soporte@` / inbound Resend.

### Threading inbound (`ingestInboundEmail`)

1. `[Ticket #N]` / `Ticket #N` en asunto **o cuerpo**
2. Message-ID match normalizado (`In-Reply-To` / `References`)
3. Mismo sender + subject normalizado + open/in_progress
4. Else → ticket nuevo

Archivos: `email/resend.ts`, `thread-index.ts`, `threading.ts`, `headers.ts`, `system-addresses.ts`, `api/webhooks/resend/route.ts`.

Env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`, `RESEND_INBOUND_EMAIL`, `RESEND_WEBHOOK_SECRET`.

---

## 6. Server actions y servicios

- `replyAction`: comentario + email si no interno + `updateTicketEmailThread`.
- `updateStatusAction` / `updateAssigneeAction`.
- `listTickets`: filtros status/assignment (unassigned excluye cancelled).
- Webhook: Svix `whsec_…` o header `x-webhook-secret`; en demo sin secreto.

Auth: `proxy.ts` + `lib/supabase/middleware.ts` (salvo demo, `/login`, webhook).

---

## 7. Variables de entorno

Ver `.env.local.example`.

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `HELP_DESK_DEMO_MODE`
- Resend: sección 5

---

## 8. Scripts

```bash
npm install
npm run dev      # :3456
npm run build && npm run start
npm run typecheck
```

---

## 9. Historial técnico

| Fecha / commit | Cambio |
|---|---|
| 2026-09-24 | Filtro de periodo en Tickets sincronizado con Informes KPI deep-links |
| 2026-09-24 | Ignorar ecos outbound del helpdesk; `[Ticket #N]` en asunto/cuerpo; Message-ID normalizado |
| 2026-09-24 | `LiveRefresh`: polling + Realtime opcional en `/tickets` y detalle |
| 2026-09-23 | Docs partidas: `DOCUMENTACION-USUARIO.md` + `DOCUMENTACION-TECNICA.md`; índice en `DOCUMENTACION.md` |
| 2026-09-23 | Regla `.cursor/rules/documentacion.mdc` + `AGENTS.md` |
| `23aff6e` | Unassigned excluye `cancelled` (KPI + query + demo) |
| `c990cf8` | Informes KPIs = estado actual coloreado; sin bloque duplicado |
| `c675a07` | Sin chips Abiertas/Resueltas en UI tickets |
| `7fa81b2` | KPIs → deep links filtros |
| `c8ecab7`+ | Vista Informes; sin chart evolución |
| `a47cbc3` | Estado `cancelled` |
| `0b4824f` / `066a42e` | Thread-Index extendido, asunto Re: limpio |
| `03120c1` | Flujo incidencias@ documentado |

---

## 10. Mantenimiento de documentación

Ante cualquier cambio de producto/código:

1. Actualizar **`DOCUMENTACION-USUARIO.md`** si cambia comportamiento visible o reglas de negocio.
2. Actualizar **`DOCUMENTACION-TECNICA.md`** si cambia implementación, APIs, schema, env o rutas.
3. Actualizar el índice **`DOCUMENTACION.md`** (fecha + historial breve).
4. No esperar a que el usuario lo pida.

Reglas del repo: `.cursor/rules/documentacion.mdc`, bloque en `AGENTS.md`.
