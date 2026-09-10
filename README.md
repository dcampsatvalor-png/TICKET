# Mesa de Ayuda

Panel interno de helpdesk para un equipo IT pequeño (2 técnicos). Los usuarios envían incidencias por correo; los agentes las gestionan en la web: estado, asignación, respuestas públicas y notas internas.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **shadcn/ui**
- **Supabase** (PostgreSQL + Auth) — opcional en local
- **Resend** (correo saliente + webhook entrante) — opcional en local

## Modo demo (sin secretos)

Si no configuras `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o usas los placeholders del ejemplo), la app arranca en **modo demo**:

- Datos de tickets en memoria (seed con 3 incidencias)
- Sesión fija como Ana Ruiz
- Los correos de respuesta se registran en la consola del servidor (no se llama a Resend)
- El webhook `/api/webhooks/resend` acepta peticiones sin firma

```bash
npm install
npm run dev
```

Abre [http://127.0.0.1:3456](http://127.0.0.1:3456) — redirige a `/tickets`.

Forzar demo: `HELP_DESK_DEMO_MODE=true`  
Forzar producción: `HELP_DESK_DEMO_MODE=false` + credenciales reales.

## Estructura

```
src/
  app/
    login/                 # Auth email/password (o entrada demo)
    tickets/               # Listado + detalle
    api/webhooks/resend/   # Inbound email webhook
    actions/               # Server Actions (auth, tickets)
  components/
    layout/                # Cabecera
    tickets/               # Listado, detalle, badges
    ui/                    # shadcn
  lib/
    demo/store.ts          # Store en memoria
    supabase/              # browser + server + middleware helpers
    tickets/service.ts     # Acceso a datos (demo | Supabase)
    email/resend.ts        # Envío de respuestas
  types/database.ts
supabase/migrations/
  001_helpdesk_schema.sql  # Schema + RLS + triggers
```

## Variables de entorno

Copia `.env.local.example` → `.env.local`:

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook / escrituras privilegiadas |
| `RESEND_API_KEY` | Envío de respuestas |
| `RESEND_FROM_EMAIL` | Remitente verificado en Resend |
| `RESEND_WEBHOOK_SECRET` | `whsec_…` (Svix) o secreto compartido |
| `HELP_DESK_DEMO_MODE` | `true` / `false` (opcional) |

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/migrations/001_helpdesk_schema.sql` en el SQL Editor.
3. Crea usuarios agentes en Authentication (email/password). El trigger crea filas en `profiles`.
4. Rellena las variables de entorno y reinicia `npm run dev`.

El schema incluye:

- `profiles`, `tickets` (números desde ~1001), `ticket_comments`
- Índices, RLS para `authenticated`, trigger `updated_at`, auto-perfil al signup

## Configurar Resend (inbound + outbound)

### Saliente

Las respuestas públicas usan Resend con asunto `[Ticket #1001] …`.

### Entrante (webhook)

Endpoint: `POST /api/webhooks/resend`

Seguridad (cualquiera de estas):

1. **Svix** — cabeceras `svix-id`, `svix-timestamp`, `svix-signature` + `RESEND_WEBHOOK_SECRET=whsec_…`
2. **Secreto compartido** — cabecera `x-webhook-secret` igual a `RESEND_WEBHOOK_SECRET`
3. **Demo** — sin secreto configurado, se acepta el payload

Lógica:

- Si el asunto contiene `[Ticket #N]` → añade comentario público a ese ticket
- Si no, y el remitente tiene un ticket `open`/`in_progress` → añade comentario
- Si no → crea ticket nuevo `open`

Ejemplo local:

```bash
curl -s http://127.0.0.1:3456/api/webhooks/resend \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "Usuario Demo <usuario@ejemplo.com>",
    "subject": "No funciona el Wi‑Fi",
    "text": "Hola, desde esta mañana no tengo red en la planta 1."
  }'
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Dev server en puerto **3456** |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |

## UI (español)

- `/login` — acceso agentes
- `/tickets` — filtros por estado (Abierto / En proceso / Resuelto) y asignación (Mis tickets / Sin asignar / Todos)
- `/tickets/[id]` — cronología, cambio de estado/asignación, responder al cliente o nota interna
