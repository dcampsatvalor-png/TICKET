# Despliegue gratis 24/7 (fuera de Azure)

**Decisión actual:** hosting fuera de Azure → **Vercel Hobby + Supabase Free (+ Resend Free opcional)**.  
Azure se puede plantear más adelante si hace falta (App Service / Container Apps).

Stack:

| Servicio | Plan free | Para qué |
|---|---|---|
| **Vercel** Hobby | Sí | Hosting Next.js 24/7 |
| **Supabase** Free | Sí | PostgreSQL + Auth |
| **Resend** Free | Sí (límites diarios) | Correo saliente / webhook |

El **modo demo en memoria no vale en Vercel** (serverless): cada petición puede perder los tickets. En producción hace falta Supabase.

## Checklist (≈ 15–20 min)

### 1. Repositorio en GitHub

Si el proyecto aún no tiene repo GitHub propio, en Cursor usa **Create repo** y publica el código.

### 2. Proyecto Supabase (gratis)

1. Crea cuenta/proyecto en [supabase.com](https://supabase.com).
2. SQL Editor → pega y ejecuta `supabase/migrations/001_helpdesk_schema.sql`.
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
RESEND_API_KEY=re_...          # opcional al inicio
RESEND_FROM_EMAIL=soporte@tu-dominio.com
RESEND_WEBHOOK_SECRET=whsec_... # o un secreto compartido
```

5. Deploy. URL tipo `https://mesa-de-ayuda.vercel.app`.

### 4. Auth: URL de redirección

En Supabase → Authentication → URL Configuration:

- Site URL: `https://tu-app.vercel.app`
- Redirect URLs: `https://tu-app.vercel.app/**`

### 5. Resend (cuando quieras correo real)

1. [resend.com](https://resend.com) → API key + dominio verificado (o `onboarding@resend.dev` para pruebas).
2. Webhook inbound → `https://tu-app.vercel.app/api/webhooks/resend`
3. Misma `RESEND_WEBHOOK_SECRET` que en Vercel.

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
