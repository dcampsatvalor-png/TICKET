# Documentación — Sistema de tickets (SOPORTE IT)

Documentación viva del helpdesk. Hay **dos guías**:

| Documento | Audiencia |
|---|---|
| **[DOCUMENTACION-USUARIO.md](./DOCUMENTACION-USUARIO.md)** | Agentes IT y uso diario del panel (estados, filtros, Informes, reglas de negocio en lenguaje claro) |
| **[DOCUMENTACION-TECNICA.md](./DOCUMENTACION-TECNICA.md)** | Desarrollo, arquitectura, correo, BD, variables, historial de commits |

Última actualización: 2026-09-29

---

## Reglas de negocio destacadas (resumen)

- Buzón de entrada de usuarios: **`incidencias@grupoatvalor.com`**.
- Buzón de **nuevos desarrollos**: **`desarrollos@tasacioneshipotecarias.com`** → pantalla **Desarrollos** (no mezcla con incidencias IT). **Solo** se ingieren correos From `dcamps@grupoatvalor.com` o `d.camps@tasacioneshipotecarias.com`.
- Estados: Abierto, En proceso, Resuelto, Cerrado, **Anulado**.
- **Las incidencias Anuladas no cuentan como “Sin asignar”** (ni en Informes ni en el filtro de tickets), aunque no tengan agente.
- Informes muestran el **estado actual** de las creadas en el periodo (no un histórico de cambios de estado).
- La pantalla **Tickets** (y el detalle) se **actualiza sola**; no hace falta F5.
- Responder desde el panel **no debe crear otro ticket** (se ignora el eco del correo de `incidencias@`).
- Periodo de Informes y Tickets **sincronizado** (Hoy, 7 días, etc. al pulsar un KPI).
- Roles: **Administrador** (gestiona usuarios) y **Empleado** (operativa del panel).

Detalle para usuarios → [DOCUMENTACION-USUARIO.md](./DOCUMENTACION-USUARIO.md)  
Detalle técnico → [DOCUMENTACION-TECNICA.md](./DOCUMENTACION-TECNICA.md)  
Despliegue → [DEPLOY.md](./DEPLOY.md)

---

## Política de actualización (obligatoria)

En cada cambio del sistema, actualizar **las guías afectadas** + este índice (fecha e historial), sin que el usuario lo pida.

- Regla Cursor: `.cursor/rules/documentacion.mdc` (`alwaysApply: true`)
- Refuerzo: `AGENTS.md` (bloque project-agent-rules)

### Historial breve del índice

| Fecha | Cambio |
|---|---|
| 2026-09-30 | Incidencias: búsqueda, prioridad y observaciones |
| 2026-09-30 | Listado Todos oculta incidencias Anuladas |
| 2026-09-30 | Admin: reiniciar contraseña de usuarios |
| 2026-09-30 | Roles admin/empleado + pantalla Usuarios |
| 2026-09-30 | Logo Tasaciones Hipotecarias en header, login e icono |
| 2026-09-29 | Desarrollos: allowlist remitentes (dcamps@ / d.camps@) |
| 2026-09-29 | Menú: Incidencias → Desarrollos → Reportes; Reportes con pestañas Incidencias/Desarrollos |
| 2026-09-29 | Menú: **Incidencias** / **Reportes** / Desarrollos; Reportes incluye bloque Desarrollos |
| 2026-09-29 | Nueva sección **Desarrollos** + enrutamiento inbound por buzón |
| 2026-09-24 | Periodo sincronizado Informes ↔ Tickets |
| 2026-09-24 | Fix: respuesta del agente ya no abre ticket duplicado |
| 2026-09-24 | Actualización automática de Tickets (sin F5) |
| 2026-09-23 | Separación en documentación de **usuario** y **técnica** |
| 2026-09-23 | Alta de docs + regla alwaysApply |
| 2026-09-23 | Anuladas excluidas de Sin asignar |
| 2026-09-22 | Informes por estado actual |
| 2026-09-18 | Estado Anulado |
