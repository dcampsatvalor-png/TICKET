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
3. Tras entrar veréis el menú: **Incidencias** | **Desarrollos** | **Reportes** (y **Usuarios** si sois administrador).

Si no podéis entrar, pedid alta al administrador del sistema (Supabase / IT).

---

## 3. Cómo llegan las incidencias

1. Alguien envía un correo a **`incidencias@grupoatvalor.com`**.
2. El sistema crea un ticket **Abierto** (o añade el mensaje a un ticket ya existente si es una respuesta al mismo hilo, aunque escriba **otra persona** del mismo correo — p. ej. un compañero en copia).
3. Vosotros lo gestionáis en **Incidencias**.

### Buenas prácticas para quien abre la incidencia

- Asunto claro (ej.: «No arranca el portátil»).
- Explicar qué ocurre y desde cuándo.
- Si ya hay un ticket, **responder en el mismo hilo** de correo, no abrir uno nuevo con otro asunto.

---

## 4. Pantalla Incidencias

### Actualización automática

No hace falta pulsar F5. La lista (y el detalle) se **refrescan solos** cada pocos segundos mientras tenéis la pestaña abierta. Veréis el indicador «Actualización automática» junto al título. Si llega un correo nuevo, debería aparecer sin recargar a mano.

### Listado

- Cada línea es una incidencia (`#número`, asunto, remitente, estado, asignado, fecha).
- Pulsad una línea para abrir el detalle.

### Búsqueda

Caja en la parte superior del listado: busca por **número** (#1001), **asunto**, **correo**, nombre o texto de la descripción.

### Prioridad

Cada incidencia tiene prioridad **Baja**, **Media** o **Alta** (por defecto Media al llegar por correo). Se ve en el listado, se puede filtrar y cambiarse en el detalle.

### Observaciones

En el detalle hay un bloque **Observaciones** solo para el equipo (no se envían al cliente). Sirven para dejar apuntes del caso; son distintas de la respuesta por correo y de la nota interna del hilo.

### Filtros de periodo

Mismos que en Informes: **Todo**, **Hoy**, **7 días**, **30 días**, **Este mes**, **Personalizado**.

Filtran por fecha de **creación** del ticket. Si entráis desde Informes pulsando un cuadrado (p. ej. Anulado + Hoy), llegáis a Tickets **con el mismo periodo y estado** ya aplicados.

### Filtros de estado

| Filtro | Significado |
|---|---|
| Todos | Todas excepto **Anulado** (las anuladas solo con el filtro Anulado) |
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
   Una incidencia **Anulada** **no** cuenta como “Sin asignar” ni como trabajo pendiente de asignar, aunque no tenga agente. **No aparece en el listado Todos**; solo si filtráis por **Anulado** (también en Reportes).

2. **Resuelto vs Cerrado**  
   - Resuelto = hecha la solución.  
   - Cerrado = archivo / cierre administrativo.

3. **Respuestas al mismo asunto**  
   Si alguien responde al mismo correo (`Re:` / mismo hilo), suele ir al **mismo ticket** aunque el remitente sea otro. Un asunto distinto (sin `Re:`) suele crear ticket nuevo.

---

## 6. Detalle del ticket — qué podéis hacer

En un ticket abierto:

1. **Cambiar estado** (Abierto → En proceso → Resuelto / Anulado / etc.).
2. **Asignar** a un agente del equipo.
3. **Responder (público):** el mensaje se guarda en el ticket **y se envía por correo** al usuario.
4. **Nota interna:** solo la ve el equipo IT; **no** se envía al usuario.

Al responder en público, el correo sale como soporte (buzón de incidencias) y, si el hilo está bien, el usuario lo ve en la **misma conversación** de Outlook.

---

## 7. Pantalla Reportes

Sirve para ver, en un periodo (Hoy, 7 días, 30 días, este mes o fechas a medida), con **pestañas** (sin hacer scroll entre reportes):

1. Pestaña **Incidencias** (soporte IT)
2. Pestaña **Desarrollos** (peticiones a desarrollos@)

El periodo se comparte al cambiar de pestaña. En cada vista:

- Cuántas se **crearon** en ese periodo.
- Cómo están **ahora** (Abierto, En progreso, Resuelto, Cerrado, Anulado), con colores.
- Cuántas de las creadas están **sin asignar** (sin contar anuladas).
- Media de altas por día.
- Tabla **por agente**: asignadas, resueltas ahora, activas. **Solo aparecen usuarios con rol Empleado**; los **Administradores no salen** en ese desglose (sí cuentan en los totales y por estado si tienen tickets asignados).

### Cómo leer los números

- Los cuadrados de estado son el **estado actual** de las creadas en el periodo (no un histórico de “cuántas veces se cambió de estado”).
- Podéis **pulsar** un cuadrado (p. ej. Anulado) y os lleva al listado correspondiente (**Incidencias** o **Desarrollos**) con ese filtro y el mismo periodo.
- **Creadas** = total de altas del periodo.  
  La suma Abierto + En progreso + Resuelto + Cerrado + Anulado debe coincidir con **Creadas**.

### Ejemplo de regla

Si hay 5 anuladas sin agente:

- Entran en el KPI **Anulado**.
- **No** suman en **Sin asignar**.

## 8. Pantalla Desarrollos

Espacio **independiente** de las incidencias de soporte IT.

### Cómo llegan las peticiones

1. Alguien envía un correo a **`desarrollos@tasacioneshipotecarias.com`** (no a incidencias@).
   **Solo se aceptan** correos enviados desde **`dcamps@grupoatvalor.com`** o **`d.camps@tasacioneshipotecarias.com`**. Cualquier otro remitente se ignora y no crea petición.
2. El sistema crea una petición **D#número** (Abierta) o añade el mensaje al mismo hilo si es una respuesta.
3. Las gestionáis en **Desarrollos** del menú.

En Outlook debe existir una regla similar a la de incidencias (copia al inbound de Resend) para ese buzón. Si el correo solo llega a Resend sin conservar el destinatario original, puede acabar en Incidencias; el administrador debe asegurar que en los encabezados figure `desarrollos@…`.

### Uso del panel

- Listado con filtros por **periodo** y **estado** (mismos estados: Abierto, En progreso, Resuelto, Cerrado, Anulado).
- Detalle con cronología, asignación, notas internas y **respuesta pública** al solicitante.
- Las respuestas salen desde **desarrollos@…** con `[Desarrollo #N]` en el asunto para mantener el hilo.
- **Actualización automática** igual que en Incidencias.
- Pantalla de carga (overlay) al filtrar, abrir una petición, cambiar estado/asignación, responder o volver al listado — igual que en Incidencias.

### Diferencia con Incidencias

| | Incidencias (IT) | Desarrollos |
|---|---|---|
| Buzón | incidencias@grupoatvalor.com | desarrollos@tasacioneshipotecarias.com |
| Numeración | #1001… | D#2001… |
| Reportes BI | Bloque Incidencias | Bloque Desarrollos (misma pantalla Reportes) |

---

## 9. Flujo recomendado del día a día

1. Abrir **Incidencias** → filtro **Sin asignar** (o **Abierto**).
2. Asignaros la incidencia y pasar a **En proceso**.
3. Hablar con el usuario con **respuesta pública** si hace falta.
4. Al terminar → **Resuelto** (y más adelante **Cerrado** si aplica).
5. Si no procede → **Anulado** (no quedará engordando “sin asignar”).
6. Revisar **Reportes** semanalmente (7 días / este mes) para carga por persona (incidencias y desarrollos).
7. Peticiones de producto / nuevas funcionalidades → buzón **desarrollos@** y pantalla **Desarrollos**.

---

## 10. Problemas frecuentes (usuario)

| Situación | Qué hacer |
|---|---|
| No llega el ticket tras escribir a incidencias@ | Avisar a quien gestione Outlook/Resend; puede fallar la copia al sistema |
| La respuesta del agente sale como correo “nuevo” en Outlook | Tema de hilos de correo; avisar a quien mantenga el sistema |
| Al responder desde el panel aparecía otro ticket | Corregido: el sistema ignora el eco del correo enviado desde `incidencias@` |
| Respuesta de otro correo del mismo hilo abría ticket nuevo | Corregido: se une por hilo Outlook / asunto `Re:` aunque cambie el remitente |
| No veo un ticket anulado en Sin asignar | Es normal: las anuladas no cuentan ahí |
| No puedo iniciar sesión | Pedir reset de contraseña / alta de usuario agente |
| Mi petición de desarrollo no aparece | Comprobar que el correo fue a **desarrollos@**, que el **From** es dcamps@… o d.camps@…, y que Outlook copia a Resend |

---

## 11. Usuarios y roles

Hay dos roles en el panel:

| Rol | Qué puede hacer |
|---|---|
| **Empleado** | Incidencias, Desarrollos y Reportes; aparece en la tabla **Por agente** de Reportes |
| **Administrador** | Lo mismo + pantalla **Usuarios** (crear cuentas y cambiar roles); **no** aparece en Por agente de Reportes |

Solo un administrador puede crear usuarios (correo, contraseña temporal y rol) y **reiniciar la contraseña** de cualquier usuario desde la tabla. La primera vez hay que ejecutar en Supabase la migración de roles (`006_user_roles.sql`); si nadie queda como admin, un técnico puede hacer:

`update public.profiles set role = 'admin' where email = 'tu@correo.com';`

---

## 12. Historial de cambios (vista usuario)

| Fecha | Cambio visible |
|---|---|
| 2026-10-02 | Respuestas del mismo hilo (aunque sea otro remitente) ya no crean ticket duplicado |
| 2026-09-30 | Desarrollos: pantalla de carga al navegar y al guardar cambios (como Incidencias) |
| 2026-09-30 | En Reportes, la tabla Por agente solo muestra empleados (no administradores) |
| 2026-09-30 | Búsqueda, prioridad (Baja/Media/Alta) y observaciones en Incidencias |
| 2026-09-30 | En Incidencias, Todos ya no muestra anuladas (solo filtro Anulado) |
| 2026-09-30 | Administrador puede reiniciar contraseña desde Usuarios |
| 2026-09-30 | Roles Administrador / Empleado y pantalla Usuarios |
| 2026-09-30 | Logo de Tasaciones Hipotecarias en cabecera y login |
| 2026-09-29 | Desarrollos: solo remitentes dcamps@grupoatvalor.com y d.camps@tasacioneshipotecarias.com |
| 2026-09-29 | Orden menú Incidencias → Desarrollos → Reportes; Reportes con pestañas |
| 2026-09-29 | Menú renombrado a **Incidencias** y **Reportes**; Reportes incluye métricas de Desarrollos |
| 2026-09-29 | Nueva pantalla **Desarrollos** para peticiones a desarrollos@tasacioneshipotecarias.com |
| 2026-09-24 | Periodo (Hoy/7d/…) también en Tickets; sincronizado con Informes al pulsar los KPIs |
| 2026-09-24 | Al responder desde el panel **ya no se crea un ticket duplicado** (se ignora el eco del correo de soporte) |
| 2026-09-24 | Tickets e detalle se actualizan solos (sin F5) |
| 2026-09-23 | Documentación de usuario separada de la técnica |
| 2026-09-23 | Anuladas dejan de contar en Sin asignar |
| 2026-09-22 | Informes con KPIs de estado actual y colores; paneles clicables |
| 2026-09-18 | Estado **Anulado** (rojo) |
| 2026-09 | Buzón central `incidencias@grupoatvalor.com` |
