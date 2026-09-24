# Documentación de usuario — SOPORTE IT (tickets)

Guía para agentes IT y responsables que usan el panel.  
Sin jerga de programación.

Última actualización: 2026-09-24

Índice general: [DOCUMENTACION.md](./DOCUMENTACION.md) · Técnica: [DOCUMENTACION-TECNICA.md](./DOCUMENTACION-TECNICA.md)

---

## 1. Para qué sirve

Es el panel interno de **SOPORTE IT**. Las personas de la empresa escriben a:

**`incidencias@grupoatvalor.com`**

Eso crea (o actualiza) un ticket. Vosotros lo veis en la web, lo asignáis, cambiáis el estado y respondéis al usuario por correo desde el propio panel.

URL de producción (orientativa): `https://ticket-yuwb.vercel.app`

---

## 2. Cómo entrar

1. Abrir la URL del panel.
2. Ir a **Login** con el usuario y contraseña que os hayan creado (cuenta de agente).
3. Tras entrar veréis el menú: **Tickets** | **Informes**.

Si no podéis entrar, pedid alta al administrador del sistema (Supabase / IT).

---

## 3. Cómo llegan las incidencias

1. Alguien envía un correo a **`incidencias@grupoatvalor.com`**.
2. El sistema crea un ticket **Abierto** (o añade el mensaje a un ticket ya existente si es una respuesta al mismo hilo).
3. Vosotros lo gestionáis en **Tickets**.

### Buenas prácticas para quien abre la incidencia

- Asunto claro (ej.: «No arranca el portátil»).
- Explicar qué ocurre y desde cuándo.
- Si ya hay un ticket, **responder en el mismo hilo** de correo, no abrir uno nuevo con otro asunto.

---

## 4. Pantalla Tickets

### Actualización automática

No hace falta pulsar F5. La lista (y el detalle) se **refrescan solos** cada pocos segundos mientras tenéis la pestaña abierta. Veréis el indicador «Actualización automática» junto al título. Si llega un correo nuevo, debería aparecer sin recargar a mano.

### Listado

- Cada línea es una incidencia (`#número`, asunto, remitente, estado, asignado, fecha).
- Pulsad una línea para abrir el detalle.

### Filtros de estado

| Filtro | Significado |
|---|---|
| Todos | Todas las incidencias |
| Abierto | Pendientes de empezar / recién llegadas |
| En proceso | Alguien está trabajando en ellas |
| Resuelto | Solucionadas (aún visibles como resueltas) |
| Cerrado | Cerradas del todo |
| Anulado | Canceladas / no procede |

### Filtros de asignación

| Filtro | Significado |
|---|---|
| Todos | Con o sin agente |
| Mis tickets | Solo las asignadas a mí |
| Sin asignar | Sin agente **y que no estén anuladas** |

---

## 5. Estados — qué significa cada uno

| Estado | Color (orientativo) | Cuándo usarlo |
|---|---|---|
| **Abierto** | Azul | Recién llegada o aún no se ha empezado |
| **En proceso** | Ámbar | Estáis trabajando en ella |
| **Resuelto** | Verde / teal | Ya se solucionó; el usuario puede estar avisado |
| **Cerrado** | Gris | Cierre definitivo |
| **Anulado** | Rojo | No procede, duplicado, error, se cancela |

### Reglas importantes (negocio)

1. **Anulado ≠ pendiente**  
   Una incidencia **Anulada** **no** cuenta como “Sin asignar” ni como trabajo pendiente de asignar, aunque no tenga agente. Solo aparece en el contador / filtro de **Anulado**.

2. **Resuelto vs Cerrado**  
   - Resuelto = hecha la solución.  
   - Cerrado = archivo / cierre administrativo.

3. **Respuestas al mismo asunto**  
   Si el usuario responde al mismo correo, suele ir al **mismo ticket**. Un asunto distinto suele crear ticket nuevo.

---

## 6. Detalle del ticket — qué podéis hacer

En un ticket abierto:

1. **Cambiar estado** (Abierto → En proceso → Resuelto / Anulado / etc.).
2. **Asignar** a un agente del equipo.
3. **Responder (público):** el mensaje se guarda en el ticket **y se envía por correo** al usuario.
4. **Nota interna:** solo la ve el equipo IT; **no** se envía al usuario.

Al responder en público, el correo sale como soporte (buzón de incidencias) y, si el hilo está bien, el usuario lo ve en la **misma conversación** de Outlook.

---

## 7. Pantalla Informes

Sirve para ver, en un periodo (Hoy, 7 días, 30 días, este mes o fechas a medida):

- Cuántas incidencias se **crearon** en ese periodo.
- Cómo están **ahora** (Abierto, En proceso, Resuelto, Cerrado, Anulado), con colores.
- Cuántas de las creadas están **sin asignar** (sin contar anuladas).
- Media de altas por día.
- Tabla **por agente**: asignadas, resueltas ahora, activas.

### Cómo leer los números

- Los cuadrados de estado son el **estado actual** de las creadas en el periodo (no un histórico de “cuántas veces se cambió de estado”).
- Podéis **pulsar** un cuadrado (p. ej. Anulado) y os lleva a la lista de tickets con ese filtro.
- **Creadas** = total de altas del periodo.  
  La suma Abierto + En proceso + Resuelto + Cerrado + Anulado debe coincidir con **Creadas**.

### Ejemplo de regla en Informes

Si hay 5 anuladas sin agente:

- Entran en el KPI **Anulado**.
- **No** suman en **Sin asignar**.

---

## 8. Flujo recomendado del día a día

1. Abrir **Tickets** → filtro **Sin asignar** (o **Abierto**).
2. Asignaros la incidencia y pasar a **En proceso**.
3. Hablar con el usuario con **respuesta pública** si hace falta.
4. Al terminar → **Resuelto** (y más adelante **Cerrado** si aplica).
5. Si no procede → **Anulado** (no quedará engordando “sin asignar”).
6. Revisar **Informes** semanalmente (7 días / este mes) para carga por persona.

---

## 9. Problemas frecuentes (usuario)

| Situación | Qué hacer |
|---|---|
| No llega el ticket tras escribir a incidencias@ | Avisar a quien gestione Outlook/Resend; puede fallar la copia al sistema |
| La respuesta del agente sale como correo “nuevo” en Outlook | Tema de hilos de correo; avisar a quien mantenga el sistema |
| Al responder desde el panel aparecía otro ticket | Corregido: el sistema ignora el eco del correo enviado desde `incidencias@` |
| No veo un ticket anulado en Sin asignar | Es normal: las anuladas no cuentan ahí |
| No puedo iniciar sesión | Pedir reset de contraseña / alta de usuario agente |

---

## 10. Historial de cambios (vista usuario)

| Fecha | Cambio visible |
|---|---|
| 2026-09-24 | Al responder desde el panel **ya no se crea un ticket duplicado** (se ignora el eco del correo de soporte) |
| 2026-09-24 | Tickets e detalle se actualizan solos (sin F5) |
| 2026-09-23 | Documentación de usuario separada de la técnica |
| 2026-09-23 | Anuladas dejan de contar en Sin asignar |
| 2026-09-22 | Informes con KPIs de estado actual y colores; paneles clicables |
| 2026-09-18 | Estado **Anulado** (rojo) |
| 2026-09 | Buzón central `incidencias@grupoatvalor.com` |
