# DOCUMENTACIÓN — Sistema de tickets (SOPORTE IT)

Documento vivo del helpdesk interno. **Actualizar este archivo en cada cambio de código** (funciones, lógica, pantallas, correo, BD o despliegue), sin esperar a que el usuario lo pida.

Última actualización: 2026-09-23

---

## 1. Qué es

Panel web para el equipo IT de **Tasaciones Hipotecarias / Grupo AT Valor**.

- Los usuarios envían incidencias a **`incidencias@grupoatvalor.com`**.
- Una copia llega a Resend (`tickets@….resend.app`) → webhook → ticket.
- Los agentes gestionan tickets en la web: estado, asignación, respuestas públicas y notas internas.
- Hay una vista **Informes** (BI simple) con KPIs del periodo.

Producción típica: [https://ticket-yuwb.vercel.app](https://ticket-yuwb.vercel.app)  
Repo GitHub: `dcampsatvalor-png/TICKET`

---

## 2. Stack

| Pieza | Uso |
|---|---|
| Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | App |
| Supabase (Auth + Postgres) | Usuarios agentes + datos |
| Resend | Envío de respuestas + recepción (inbound) |
| Vercel | Hosting |

Modo **demo** (sin Supabase): datos en memoria (`src/lib/demo/store.ts`).

---

## 3. Estructura relevante

```
src/
  app/
    login/                 # Login agentes
    tickets/               # Listado + detalle /tickets/[id]
    informes/              # BI / KPIs
    api/webhooks/resend/   # POST inbound email
    actions/               # Server Actions (auth, tickets)
  components/
    analytics/             # UI Informes
    tickets/               # Listado, detalle, badges
    layout/                # Cabecera + nav Tickets | Informes
  lib/
    analytics/             # Periodos + métricas
    tickets/service.ts     # CRUD / listados (demo | Supabase)
    email/                 # Resend, threading, Thread-Index
    demo/store.ts          # Store demo
    supabase/              # Clientes SSR
  types/database.ts        # Tipos + filtros de estado
supabase/migrations/       # SQL schema + evoluciones
DEPLOY.md                  # Guía de despliegue / correo
DOCUMENTACION.md           # Este archivo
```

---

## 4. Estados de ticket

Valores en BD / código (`TicketStatus`):

| Valor | Etiqueta UI | Color badge |
|---|---|---|
| `open` | Abierto | sky |
| `in_progress` | En proceso | amber |
| `resolved` | Resuelto | teal |
| `closed` | Cerrado | slate |
| `cancelled` | Anulado | red |

Migración: `004_cancelled_status.sql` (`alter type … add value 'cancelled'`).

Filtros de listado (`StatusFilter`):

- Estados individuales + `all`
- Compuestos internos (desde Informes / URLs): `active` = open\|in_progress, `done` = resolved\|closed  
  **No** se muestran como chips duplicados en la UI de tickets (solo Abierto, En proceso, Resuelto, Cerrado, Anulado).

**Sin asignar:** excluye tickets `cancelled` (KPI Informes + filtro `/tickets?assignment=unassigned`).

---

## 5. Pantallas

### `/login`
Auth Supabase email/password (o entrada demo).

### `/tickets`
- Filtros por estado y asignación (Todos / Mis tickets / Sin asignar).
- Lista ordenada por `updated_at`.
- Detalle `/tickets/[id]`: cambiar estado, asignar, responder (público → email) o nota interna.

### `/informes`
BI simple sobre tickets **creados en el periodo** (Hoy / 7d / 30d / Este mes / Personalizado).

**KPIs (estado actual, no histórico de cambios):**

- Creadas (total del periodo)
- Abierto / En proceso / Resuelto / Cerrado / Anulado (conteo actual + color de estado; clic → tickets filtrados)
- Sin asignar (creadas sin agente y **no** anuladas)
- Media / día

**Por agente:** de las creadas en el periodo → asignadas, resueltas ahora (resolved\|closed), activas (open\|in_progress).

Se eliminó el gráfico de evolución y el bloque duplicado “Estado actual (creadas)”.

---

## 6. Correo (Resend + Outlook)

### Flujo deseado

```
Cliente → incidencias@grupoatvalor.com (Outlook)
              │  regla: Redirigir / Copia (no Reenviar)
              ▼
     tickets@….resend.app → webhook → ticket
              │
Agente responde en la web
              ▼
Resend From: incidencias@… (o SOPORTE IT <…>)
Cliente responde al mismo buzón → misma regla → mismo ticket
```

**No** activar Receiving de Resend en el dominio raíz (rompería el MX de Outlook).

Política Microsoft: el tenant puede bloquear reenvío externo (`550 5.7.520`). Hace falta admin o regla de copia aprobada.

### Threading

- Asunto saliente: `Re: {tema}` (sin `[Ticket #N]` en asunto; el nº va en el pie).
- Cabeceras: `In-Reply-To`, `References`, `Thread-Topic`, `Thread-Index` **extendido** (`src/lib/email/thread-index.ts`).
- Entrada: match por `[Ticket #N]`, Message-ID / References, o mismo remitente + asunto normalizado.

Archivos clave: `src/lib/email/resend.ts`, `headers.ts`, `threading.ts`, `thread-index.ts`, `app/api/webhooks/resend/route.ts`.

Variables: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO` (opcional), `RESEND_INBOUND_EMAIL`, `RESEND_WEBHOOK_SECRET`.

---

## 7. Lógica de negocio principal

### Crear / enriquecer ticket (`ingestInboundEmail`)

1. Asunto con `[Ticket #N]` → mismo ticket  
2. `In-Reply-To` / `References` coinciden con Message-IDs guardados → mismo ticket  
3. Mismo remitente + mismo asunto normalizado + ticket abierto/en proceso → mismo ticket  
4. Si no → ticket nuevo `open`

### Respuesta pública (`replyAction`)

- Guarda comentario, envía email, actualiza `last_email_message_id`, `email_references`, `email_thread_index`.

### Auth

- Middleware/proxy: rutas privadas redirigen a `/login` si no hay sesión (salvo demo y webhook).

---

## 8. Base de datos (Supabase)

Migraciones:

| Archivo | Contenido |
|---|---|
| `001_helpdesk_schema.sql` | profiles, tickets, comments, RLS, enums |
| `002_email_threading.sql` | `last_email_message_id`, `email_references` |
| `003_outlook_thread_headers.sql` | `email_thread_index`, `email_thread_topic` |
| `004_cancelled_status.sql` | enum `cancelled` |

---

## 9. Variables de entorno (resumen)

Ver `.env.local.example`.

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `HELP_DESK_DEMO_MODE=true|false`
- Resend: ver sección 6

---

## 10. Historial de cambios recientes (resumen)

| Fecha / commit | Cambio |
|---|---|
| 2026-09-23 | Creación de `DOCUMENTACION.md` (este archivo) + política de actualización continua |
| `23aff6e` | Anuladas no cuentan en KPI/filtro Sin asignar |
| `c990cf8` | Informes: KPIs = estado actual coloreado; se quita bloque duplicado e histórico |
| `c675a07` | Se eliminan chips duplicados Abiertas/Resueltas en tickets |
| `7fa81b2` | KPIs Informes clicables → tickets filtrados |
| `c8ecab7` / siguientes | Vista Informes; se quita gráfico evolución |
| `a47cbc3` | Estado Anulado (rojo) |
| `0b4824f` / `066a42e` | Threading Outlook (Thread-Index extendido, Re: limpio) |
| `03120c1` | Flujo documentado vía `incidencias@grupoatvalor.com` |

---

## 11. Política de mantenimiento de esta documentación

Al modificar el sistema de tickets, el agente / desarrollador debe:

1. Editar **este** `DOCUMENTACION.md` en el mismo cambio (o commit siguiente inmediato).
2. Actualizar la fecha de “Última actualización”.
3. Añadir una fila al historial (sección 10) y ajustar las secciones afectadas (estados, pantallas, correo, BD, etc.).
4. No esperar a que el usuario lo solicite.

---

## 12. Cómo ejecutar

```bash
npm install
npm run dev          # http://127.0.0.1:3456
npm run build && npm run start
```

Despliegue: ver `DEPLOY.md` y `README.md`.
