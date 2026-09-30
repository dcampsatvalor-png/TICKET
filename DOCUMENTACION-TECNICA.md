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
    desarrollos/           # peticiones de nuevo desarrollo
    informes/              # BI
    api/webhooks/resend/   # inbound (soporte + desarrollos)
    actions/               # auth, tickets, desarrollos
  components/
    live-refresh.tsx       # auto refresh listado/detalle
    analytics/reports-view.tsx
    tickets/               # list, detail, status-badge
    developments/          # list, detail (desarrollos)
    layout/app-header.tsx
    brand/logo.tsx           # BrandLogo (mark / full)
  lib/
    analytics/             # period.ts, service.ts
    tickets/service.ts
    users/service.ts           # createUser / setRole / resetPassword (service role)
    auth/roles.ts
    developments/service.ts
    email/                 # resend, threading, mailbox-routing, system-addresses
    demo/store.ts
    demo/developments-store.ts
    supabase/
  types/database.ts
  proxy.ts                 # session gate
supabase/migrations/
public/
  logo-th.png              # logo completo (fondo transparente)
  logo-th-mark.png         # solo marca gráfica
src/app/icon.png           # favicon generado desde la marca
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
| `005_development_requests.sql` | `development_requests`, `development_request_comments` |
| `006_user_roles.sql` | `profiles.role` (`admin`\|`employee`), trigger `handle_new_user` |

### Desarrollos (tablas separadas)

- `development_requests` — misma semántica de estados que tickets; numeración `request_number` desde **2001** (`D#2001` en UI).
- `development_request_comments` — cronología (cliente / agente / interna).
- Columnas de hilo de correo igual que tickets (`last_email_message_id`, etc.).

Inbound: si el destinatario detectado incluye `desarrollos@tasacioneshipotecarias.com` (env `RESEND_DEVELOPMENT_INBOUND_EMAIL`), el webhook usa `ingestDevelopmentInboundEmail` en lugar de tickets.

**Allowlist de remitentes** (solo Desarrollos): `isAllowedDevelopmentSender` en `mailbox-routing.ts`. Por defecto `dcamps@grupoatvalor.com` y `d.camps@tasacioneshipotecarias.com` (`RESEND_DEVELOPMENT_ALLOWED_FROM`). Otros From → `{ ignored: "development_sender_not_allowed" }` (no crea petición).

Outbound: `sendDevelopmentReplyEmail` (`RESEND_DEVELOPMENT_FROM_EMAIL`, Reply-To desarrollos@).

Routing: `lib/email/mailbox-routing.ts` (`collectInboundRecipients`, `classifyInboundMailbox`, `isAllowedDevelopmentSender`).

Tag de hilo en asunto: `[Desarrollo #N]` — `lib/email/development-threading.ts`.

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
| `/tickets` | UI **Incidencias** — listado + filtros + **LiveRefresh** |
| `/tickets/[id]` | Detalle incidencia + **LiveRefresh** |
| `/admin` | UI **Usuarios** (solo `role=admin`): alta y cambio de rol |
| `/informes` | UI **Reportes** — pestañas `vista=incidencias\|desarrollos` + periodo + KPIs |
| `/desarrollos` | Listado peticiones desarrollo + filtros periodo/estado + **LiveRefresh** |
| `/desarrollos/[id]` | Detalle + **LiveRefresh** |
| `POST /api/webhooks/resend` | Inbound (JSON incluye `mailbox`: `support` \| `development`) |

Query compartida: `lib/tickets/query.ts` (`buildTicketsHref`) y `lib/developments/query.ts` (`buildDesarrollosHref`). Los KPI de Reportes pasan `periodo`/`desde`/`hasta` al listado. Analytics: `getTicketAnalytics` + `getDevelopmentAnalytics` en `lib/analytics/service.ts`.

### Actualización en vivo (`components/live-refresh.tsx`)

- Polling: `router.refresh()` cada ~8 s si la pestaña está visible (+ al volver a ella).
- Opcional: Supabase Realtime en tablas `tickets`, `ticket_comments` y, en Desarrollos, `development_requests` / `development_request_comments` (`extraTables` en `LiveRefresh`).
- Para que Realtime funcione en el proyecto Supabase: Database → Replication / Publication `supabase_realtime` debe incluir esas tablas (si no, el polling sigue bastando).

Reportes (`lib/analytics` + `reports-view.tsx`):

- Periodo: hoy / 7d / 30d / mes / custom (`period.ts`, TZ Europe/Madrid para claves de día).
- Pestañas Incidencias / Desarrollos (misma lógica de KPIs; query `vista`).
- KPIs = **estado actual** de ítems con `created_at` en rango.
- Cards de estado usan `STATUS_STYLES` de `status-badge.tsx`.
- Clic → `/tickets?…` o `/desarrollos?…` con status/assignment/periodo.

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
- Lista: `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`, `RESEND_INBOUND_EMAIL`, `RESEND_DEVELOPMENT_*`, `HELP_DESK_IGNORE_FROM`, más `incidencias@` / `desarrollos@` / inbound Resend.

### Threading inbound (`ingestInboundEmail`)

1. `[Ticket #N]` / `Ticket #N` en asunto **o cuerpo**
2. Message-ID match normalizado (`In-Reply-To` / `References`)
3. Mismo sender + subject normalizado + open/in_progress
4. Else → ticket nuevo

Archivos: `email/resend.ts`, `thread-index.ts`, `threading.ts`, `headers.ts`, `system-addresses.ts`, `api/webhooks/resend/route.ts`.

Env: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`, `RESEND_INBOUND_EMAIL`, `RESEND_DEVELOPMENT_INBOUND_EMAIL`, `RESEND_DEVELOPMENT_FROM_EMAIL`, `RESEND_DEVELOPMENT_REPLY_TO`, `RESEND_DEVELOPMENT_ALLOWED_FROM`, `RESEND_WEBHOOK_SECRET`.

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
