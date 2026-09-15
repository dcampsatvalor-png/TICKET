# Despliegue gratis 24/7 (fuera de Azure)

**Decisión actual:** hosting fuera de Azure → **Vercel Hobby + Supabase Free (+ Resend Free)**.  
Azure se puede plantear más adelante si hace falta (App Service / Container Apps).

## Flujo de correo (buzón de incidencias)

Objetivo: todo lo que llega a **`incidencias@grupoatvalor.com`** crea o actualiza un ticket.

```
Cliente → incidencias@grupoatvalor.com (Outlook / Microsoft 365)
                │
                │  regla: Redirigir o BCC (NO Reenviar)
                ▼
         tickets@pelioluu.resend.app  →  webhook → panel de tickets
                │
Agente responde en la web
                │
                ▼
Resend envía como: SOPORTE IT <incidencias@grupoatvalor.com>
                │
                ▼
Cliente ve la respuesta en la misma conversación y responde a incidencias@
                │
                └──► otra vez la regla → Resend → mismo ticket
```

**No actives “Enable Receiving” de Resend en `grupoatvalor.com`:** eso cambiaría el MX de Outlook. El correo sigue viviendo en Microsoft; Resend solo recibe una **copia** vía la regla.

### Checklist del buzón `incidencias@`

1. Crea el buzón / usuario `incidencias@grupoatvalor.com` en Microsoft 365 (ya hecho).
2. En ese buzón (o en el Centro de admin de Exchange), crea una regla:
   - **Condición:** todos los mensajes que llegan a la bandeja.
   - **Acción:** **Redirigir** o **CCO / copiar** a `tickets@pelioluu.resend.app`.
   - **No uses Reenviar (Forward):** inventa un Message-ID nuevo y rompe el hilo en Outlook.
3. En Resend, el dominio `grupoatvalor.com` debe poder **enviar** (DKIM/SPF del subdominio `send` como ya tenéis).
4. En Vercel, variables:

```
RESEND_FROM_EMAIL=SOPORTE IT <incidencias@grupoatvalor.com>
# Opcional: si no pones RESEND_REPLY_TO, el cliente responde a incidencias@ (recomendado)
# RESEND_REPLY_TO=incidencias@grupoatvalor.com
RESEND_INBOUND_EMAIL=tickets@pelioluu.resend.app
```

5. Prueba: envía un correo a `incidencias@grupoatvalor.com` → debe aparecer ticket en el panel.

Stack:

| Servicio | Plan free | Para qué |
|---|---|---|
| **Vercel** Hobby | Sí | Hosting Next.js 24/7 |
| **Supabase** Free | Sí | PostgreSQL + Auth |
| **Resend** Free | Sí (límites diarios) | Correo saliente / webhook |

El **modo demo en memoria no vale en Vercel** (serverless): cada petición puede perder los tickets. En producción hace falta Supabase.

## Checklist despliegue app

### 1. Repositorio en GitHub

Si el proyecto aún no tiene repo GitHub propio, en Cursor usa **Create repo** y publica el código.

### 2. Proyecto Supabase (gratis)

1. Crea cuenta/proyecto en [supabase.com](https://supabase.com).
2. SQL Editor → pega y ejecuta `supabase/migrations/001_helpdesk_schema.sql` (y `002` / `003` si aún no).
3. Authentication → Providers → Email habilitado.
4. Crea **2 usuarios** (los informáticos) en Authentication → Users.
5. Settings → API: copia
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; no la expongas)

### 3. Desplegar en Vercel (gratis)

1. Entra en [vercel.com](https://vercel.com) con GitHub.
2. **Add New Project** → importa este repositorio.
3. Framework: Next.js (auto).
4. Environment Variables (Production):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
HELP_DESK_DEMO_MODE=false
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=SOPORTE IT <incidencias@grupoatvalor.com>
RESEND_INBOUND_EMAIL=tickets@pelioluu.resend.app
RESEND_WEBHOOK_SECRET=whsec_...
```

5. Deploy. URL tipo `https://ticket-yuwb.vercel.app`.
6. Tras cambiar variables o código: **Redeploy** y confirma el último commit de GitHub.

### 4. Auth: URL de redirección

En Supabase → Authentication → URL Configuration:

- Site URL: `https://tu-app.vercel.app`
- Redirect URLs: `https://tu-app.vercel.app/**`

### 5. Resend

1. [resend.com](https://resend.com) → API key + dominio verificado para **envío**.
2. Webhook `email.received` → `https://tu-app.vercel.app/api/webhooks/resend`
3. Misma `RESEND_WEBHOOK_SECRET` que en Vercel.
4. La bandeja Resend (`tickets@….resend.app`) solo recibe la copia desde Outlook.

### 6. Login de los 2 agentes

Usa el email/password de los usuarios creados en Supabase Auth. Entran en `/login`.

## Límites free (orientativos)

- Vercel Hobby: suficiente para un equipo IT pequeño interno.
- Supabase Free: DB + Auth con cuota; ideal para 2 agentes y volumen moderado de tickets.
- Resend Free: cupo diario de emails; sube de plan si crece.

## Comprobar localmente en modo “prod”

```bash
cp .env.local.example .env.local
# rellena claves reales
HELP_DESK_DEMO_MODE=false
npm run build && npm run start
```
