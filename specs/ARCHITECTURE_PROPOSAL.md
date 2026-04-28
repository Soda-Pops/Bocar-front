# Propuesta de Arquitectura Frontend - Sistema de Cotizaciones BOCAR

## 1. Resumen Ejecutivo

Este documento define la arquitectura del frontend para el **Sistema de Predicción de Cotizaciones** de Grupo Bocar. El sistema gestiona el flujo completo de RFQs (Request for Quote) entre tres tipos de usuarios: **Industrialización**, **Compras** y **Proveedores**, con roles adicionales de **Super Usuario** para Industrialización y Compras.

La arquitectura propuesta está diseñada para:
- Escalar a 20+ features sin degradación de mantenibilidad
- Soportar 5 roles de usuario con pantallas y permisos diferenciados
- Integrar con backend Django via REST API
- Usar Active Directory como directorio de usuarios internos y JWT/sesión propia para proveedores externos

---

## 2. Análisis de Roles y Permisos

### 2.0 Alcance actual de autenticación interna

Por ahora, el proyecto asume que **Active Directory clásico se usará solamente como directorio de usuarios internos de BOCAR**. Esto significa que AD será la fuente corporativa para validar y consultar cuentas de Industrialización y Compras, pero **no se asume todavía SSO con Kerberos, ADFS ni Microsoft Entra ID** hasta que BOCAR confirme su infraestructura exacta.

En esta fase, el backend será responsable de:

- Validar usuarios internos contra Active Directory mediante un mecanismo seguro definido con IT, preferentemente LDAPS si se usa usuario/contraseña.
- Consultar atributos básicos del usuario interno: nombre, correo, departamento, identificador corporativo y grupos AD.
- Mapear grupos AD a roles del sistema: `industrializacion`, `industrializacion_admin`, `compras` y `compras_admin`.
- Convertir esos roles en permisos de aplicación usando la matriz definida en este documento.
- Crear una sesión propia del sistema o emitir un token propio después de validar la identidad contra AD.
- No almacenar contraseñas corporativas en la base de datos del sistema.

Los proveedores externos **no pertenecen al Active Directory interno**. Su acceso se manejará por un portal público con autenticación separada, usando JWT o cookie de sesión propia del backend, y siempre restringiendo la visibilidad a sus RFQs y cotizaciones asignadas.

Si BOCAR confirma más adelante que cuenta con Kerberos, ADFS o Microsoft Entra ID, esta capa de autenticación interna podrá evolucionar sin cambiar el modelo de roles, permisos ni pantallas del producto.

### 2.1 Matriz de Roles

| Rol | Tipo | Autenticación | Nivel de Acceso |
|-----|------|---------------|-----------------|
| **Industrialización** | Interno | AD como directorio de usuarios | Operativo |
| **Industrialización Admin** | Interno | AD como directorio de usuarios | Administrativo |
| **Compras** | Interno | AD como directorio de usuarios | Operativo |
| **Compras Admin** | Interno | AD como directorio de usuarios | Administrativo |
| **Proveedor** | Externo | JWT | Restringido |

### 2.2 Funcionalidades por Rol

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INDUSTRIALIZACIÓN                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Operativo:                                                                   │
│ • Crear/Editar RFQs (RF-03, RF-04, RF-05)                                   │
│ • Adjuntar documentación técnica (PPT, STP)                                 │
│ • Ver dashboard de RFQs propias                                              │
│ • Consultar predicción de costos IA (RF-22)                                 │
│ • Ver KPIs de proveedores (RF-21)                                           │
│ • Exportar benchmark a Excel (RF-19)                                        │
│                                                                              │
│ Admin / Super Usuario (adicional):                                           │
│ • ÚNICA acción exclusiva: Cancelar RFQs en CUALQUIER estado (RF-24)          │
│ • Ve exactamente lo mismo que el Usuario Base, sin bandeja de aprobaciones   │
│ • NO aprueba, NO rechaza, NO edita-y-aprueba                                 │
│ • Cancelación tardía (post-QUOTING) requiere notificar a proveedores y      │
│   generar una nueva RFQ de reemplazo                                         │
│ • Panel de métricas departamentales                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              COMPRAS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Operativo:                                                                   │
│ • Seleccionar proveedores para RFQ (RF-07)                                  │
│ • Ver sugerencias de proveedores Benchmark (RF-08)                          │
│ • Revisar cotizaciones recibidas                                            │
│ • Ver/Exportar benchmark (RF-18, RF-19)                                     │
│ • Dashboard de KPIs y tendencias (RF-20, RF-21)                             │
│ • Solicitar desbloqueo de cotización (RF-15)                                │
│                                                                              │
│ Admin / Super Usuario (adicional):                                           │
│ • ÚNICA acción exclusiva: Cancelar RFQs en CUALQUIER estado (RF-24)          │
│ • Ve exactamente lo mismo que el Usuario Base, sin bandeja de aprobaciones   │
│ • NO aprueba, NO rechaza, NO edita-y-aprueba asignaciones                    │
│ • Cancelación tardía (post-QUOTING) requiere notificar a proveedores y      │
│   generar una nueva RFQ de reemplazo                                         │
│ • Aprobar/Rechazar desbloqueos de cotización por parte de proveedores                            │
│ • Gestionar catálogo de proveedores                                          │
│ • Configurar alertas y notificaciones                                        │
│ • Panel de métricas departamentales y globales                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                             PROVEEDOR                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Ver RFQs asignadas                                                         │
│ • Descargar documentación técnica (RF-10)                                   │
│ • Completar campos de cotización (RF-11)                                    │
│ • Adjuntar PDF oficial (RF-12)                                              │
│ • Enviar cotización                                                          │
│ • Ver historial de cotizaciones propias                                      │
│ • Solicitar desbloqueo de cotización enviada                                │
│                                                                              │
│ RESTRICCIONES:                                                               │
│ ✗ NO acceso a benchmark comparativo                                          │
│ ✗ NO acceso a dashboards internos                                            │
│ ✗ NO visualización de otras cotizaciones                                     │
│ ✗ Bloqueo automático tras 10 días hábiles (RF-17)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Ciclo de Vida de RFQs: Estados, Transiciones y Acciones

> **NOTA**: Esta sección es el punto central de referencia para el flujo de negocio.
> Modificar esta sección cuando cambien los requisitos de estados o permisos.

### 3.1 Diagrama de Estados de RFQ

> **Cambio importante (vigente):** se eliminaron los estados intermedios
> `PENDING_INTERNAL_APPROVAL` y `PENDING_PURCHASING_APPROVAL`. Los Super Usuarios
> de Industrialización y de Compras **ya no aprueban ni rechazan** solicitudes;
> su única acción exclusiva es **cancelar** una RFQ en cualquier estado del ciclo.
> Como contraparte, la cancelación deja de tener "punto de no retorno": ahora se
> permite incluso después de notificar a proveedores, con consecuencias adicionales
> (ver sección 3.4 y 3.5).

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CICLO DE VIDA COMPLETO DE UNA RFQ                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │   INICIO    │
                                    └──────┬──────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │              BORRADOR (DRAFT)                 │
                    │  ─────────────────────────────────────────── │
                    │  • RFQ creada pero no enviada                │
                    │  • Editable SOLO por el creador              │
                    │    (sin importar tipo de usuario)            │
                    │  • No visible para Compras ni Proveedores    │
                    │  • Eliminar: Solo el creador                 │
                    │  • Cancelar: Solo Super Usuario              │
                    └──────────────────────┬───────────────────────┘
                                           │
                              [Usuario envía RFQ]
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │        PENDIENTE ASIGNACIÓN (PENDING)        │
                    │  ─────────────────────────────────────────── │
                    │  • RFQ enviada directamente sin aprobación   │
                    │    intermedia (cualquier rol Indust.)        │
                    │  • Esperando que Compras asigne proveedores  │
                    │  • 📧 Notificación enviada a Compras         │
                    │  • Visible para Industrialización + Compras  │
                    │  • Cancelable por Super Usuarios (con razón) │
                    │  • ✏️ Creador puede solicitar edición        │
                    │    → requiere aprobación de Compras          │
                    │    → ver estado PENDING_EDIT_REQUEST         │
                    └──────────────────────┬───────────────────────┘
                                           │
                              [Compras asigna proveedores]
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │          EN COTIZACIÓN (QUOTING)             │
                    │  ─────────────────────────────────────────── │
                    │  • Asignación directa, sin aprobación        │
                    │    intermedia (cualquier rol Compras)        │
                    │  • Proveedores notificados por email         │
                    │  • Plazo: 10 días hábiles para cotizar       │
                    │  • Timer activo                              │
                    │  • Proveedores pueden ver/descargar docs     │
                    │                                              │
                    │  ⚠️ Cancelación en este estado y posteriores │
                    │     SOLO la pueden ejecutar Super Usuarios y │
                    │     dispara protocolo especial: notifica a   │
                    │     proveedores y posteriormente generar una RFQ nueva       │
                    │     (ver sección 3.5).                       │
                    └─────────────┬────────────────┬───────────────┘
                                  │                │
                    ┌─────────────┘                └─────────────┐
                    │                                            │
                    ▼                                            ▼
    ┌───────────────────────────────┐          ┌───────────────────────────────┐
    │   COTIZADA PARCIALMENTE       │          │         VENCIDA               │
    │      (PARTIALLY_QUOTED)       │          │        (EXPIRED)              │
    │  ─────────────────────────── │          │  ─────────────────────────── │
    │  • Al menos 1 cotización     │          │  • Ningún proveedor cotizó    │
    │  • Algunos proveedores       │          │  • Todos los plazos vencidos  │
    │    aún tienen tiempo         │          │  • Super Usuario puede:       │
    │                               │          │    → Cerrar RFQ               │
    │  ⚠️ Cancelable solo por      │          │    → Extender plazo (nuevo    │
    │     Super Usuarios con       │          │      ciclo de cotización)     │
    │     notificación a proveedor │          │    → Cancelar con protocolo   │
    │     y nueva RFQ              │          │      especial                 │
    └───────────────┬───────────────┘          └───────────────┬───────────────┘
                    │                                          │
        [4+ cotizaciones recibidas]                            │
                    │                                          │
                    ▼                                          │
    ┌───────────────────────────────────────────────────────────────┐
    │              BENCHMARK DISPONIBLE (BENCHMARK_READY)           │
    │  ───────────────────────────────────────────────────────────  │
    │  • Mínimo 4 cotizaciones recibidas                           │
    │  • Comparativo automático generado                           │
    │  • Exportable a Excel                                        │
    │  • Compras e Industrialización pueden analizar               │
    │  • Super Usuario puede:                                      │
    │    → Cerrar RFQ (finalizar proceso)                          │
    │    → Reenviar a otros proveedores (nuevo ciclo)              │
    │    → Cancelar con protocolo especial                         │
    └───────────────────────────────┬───────────────────────────────┘
                                    │
                    [Super Usuario cierra RFQ]
                                    │
                                    ▼
                    ┌───────────────────────────────────────┐
                    │           CERRADA (CLOSED)            │
                    │  ─────────────────────────────────── │
                    │  • Proceso de cotización finalizado  │
                    │  • Solo lectura para todos           │
                    │  • Datos preservados para histórico  │
                    └───────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                           ESTADOS ESPECIALES
═══════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────┐
    │          CANCELADA (CANCELLED)              │
    │  ─────────────────────────────────────────  │
    │  • Puede ocurrir desde CUALQUIER estado     │
    │    no terminal: DRAFT, PENDING, QUOTING,    │
    │    PARTIALLY_QUOTED, BENCHMARK_READY,       │
    │    EXPIRED.                                 │
    │  • ❌ NUNCA desde CLOSED.                   │
    │  • Solo Super Usuarios (Indust. o Compras)  │
    │  • Requiere motivo de cancelación           │
    │  • Soft delete (datos preservados)          │
    │  • Notifica a todos los involucrados        │
    │                                             │
    │  Cancelación temprana (antes de QUOTING):   │
    │  • No hay proveedores notificados aún       │
    │  • Solo se notifica al equipo interno       │
    │                                             │
    │  Cancelación tardía (QUOTING en adelante):  │
    │  • 📧 Notifica a TODOS los proveedores      │
    │    asignados explicando el cierre del ciclo │
    │  • Las cotizaciones ya enviadas se          │
    │    archivan junto con el motivo             │
    │  • 🆕 El sistema crea automáticamente una   │
    │    RFQ NUEVA (de reemplazo) que hereda los  │
    │    datos técnicos y queda en DRAFT, lista   │
    │    para que el equipo interno ajuste y      │
    │    reenvíe a proveedores                    │
    └─────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────┐
    │  SOLICITANDO EDICIÓN (PENDING_EDIT_REQUEST) │
    │  ─────────────────────────────────────────  │
    │  • Substate transitorio de PENDING           │
    │  • Solo el CREADOR original puede iniciarlo  │
    │  • Una sola solicitud activa por RFQ a vez   │
    │  • 📧 Notificación automática a Compras      │
    │  • Asignación de proveedores BLOQUEADA       │
    │    mientras la solicitud esté pendiente      │
    │                                              │
    │  Compras APRUEBA → RFQ regresa a DRAFT:      │
    │  • Solo el creador puede verla/editarla      │
    │  • Debe volver a enviarla cuando termine     │
    │                                              │
    │  Compras RECHAZA → RFQ permanece en PENDING: │
    │  • Requiere motivo del rechazo               │
    │  • 📧 Notifica al creador con el motivo      │
    │  • Compras puede retomar la asignación       │
    └─────────────────────────────────────────────┘

```

### 3.2 Definición de Estados

| Estado | Código | Descripción | Quién Actúa | Siguiente Estado |
|--------|--------|-------------|-------------|------------------|
| **Borrador** | `DRAFT` | RFQ creada, editable SOLO por el creador | Creador (cualquier tipo) | `PENDING`, `CANCELLED` |
| **Pendiente Asignación** | `PENDING` | RFQ enviada, esperando asignación de proveedores | Compras (Base o Admin) | `QUOTING`, `CANCELLED`, `PENDING_EDIT_REQUEST` |
| **Solicitando Edición** | `PENDING_EDIT_REQUEST` | Creador solicitó editar la RFQ; Compras debe aprobar o rechazar. Asignación bloqueada. | Compras (Base o Admin) | `DRAFT` (aprobado), `PENDING` (rechazado) |
| **En Cotización** | `QUOTING` | Proveedores trabajando. Cancelable solo por Super Usuario con protocolo especial. | Sistema + Proveedores | `PARTIALLY_QUOTED`, `EXPIRED`, `CANCELLED` |
| **Cotizada Parcialmente** | `PARTIALLY_QUOTED` | 1+ cotizaciones, proveedores aún trabajando. Cancelable solo por Super Usuario con protocolo especial. | Sistema + Proveedores | `BENCHMARK_READY`, `EXPIRED`, `CANCELLED` |
| **Benchmark Disponible** | `BENCHMARK_READY` | 4+ cotizaciones, comparativo listo. Puede reenviar o cancelarse con protocolo especial. | Super Usuarios | `CLOSED`, `QUOTING` (reenvío), `CANCELLED` |
| **Vencida** | `EXPIRED` | Plazo vencido. Puede extender, cerrar o cancelarse. | Super Usuarios | `CLOSED`, `QUOTING` (extensión), `CANCELLED` |
| **Cerrada** | `CLOSED` | Proceso finalizado, solo lectura | Nadie | - (estado final) |
| **Cancelada** | `CANCELLED` | Cancelada por Super Usuario en cualquier estado no terminal. Cancelaciones tardías generan una RFQ nueva. | Nadie | - (estado final) |

> Nota: los estados `PENDING_INTERNAL_APPROVAL` y `PENDING_PURCHASING_APPROVAL`
> fueron eliminados. Cualquier referencia residual en código existente debe
> migrarse al flujo directo descrito arriba.

### 3.3 Flujo de Cancelación por Super Usuario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│   ÚNICA ACCIÓN EXCLUSIVA DEL SUPER USUARIO: CANCELAR LA RFQ                  │
│   (No aprueba ni rechaza ni edita-y-aprueba: el flujo no tiene aprobación)   │
└─────────────────────────────────────────────────────────────────────────────┘

Modalidad A — Cancelación TEMPRANA (DRAFT, PENDING)
─────────────────────────────────────────────────────────────────────────────

  🗑️ CANCELAR (soft delete)
     • RFQ inválida, duplicada o errónea, sin proveedores notificados
     • REQUIERE: Motivo de cancelación (>= 10 caracteres)
     • RFQ pasa a CANCELLED
     • Se notifica al creador y, si aplica, al equipo de Compras
     • NO se genera RFQ de reemplazo


Modalidad B — Cancelación TARDÍA (QUOTING, PARTIALLY_QUOTED, BENCHMARK_READY,
                                  EXPIRED)
─────────────────────────────────────────────────────────────────────────────

  🗑️ CANCELAR CON PROTOCOLO ESPECIAL
     • Permitida porque puede haber cambios técnicos, errores graves o
       dependencias externas que obliguen a reemplazar la RFQ entera
     • REQUIERE: Motivo de cancelación (>= 10 caracteres)
     • La UI debe presentar una confirmación reforzada que comunique el
       impacto antes de ejecutar la acción
     • Al confirmar el sistema ejecuta, en orden:
       1. Marca la RFQ original como CANCELLED y archiva sus cotizaciones,
          benchmark y eventos de timeline
       2. 📧 Envía notificación a TODOS los proveedores asignados explicando
          el cierre del ciclo y citando el motivo
       3. 🆕 Crea automáticamente una RFQ de reemplazo en estado DRAFT que
          hereda los datos técnicos, archivos PPT/STP y referencia a la
          RFQ original (campo `replacedRfqId`)
       4. Notifica al creador interno y al equipo de Compras de que la nueva
          RFQ está disponible para revisión y reenvío


Reglas comunes a ambas modalidades
─────────────────────────────────────────────────────────────────────────────

  • Solo `industrializacion_admin` o `compras_admin` pueden ejecutarla.
  • Toda cancelación deja audit trail con autor, timestamp, motivo y, si
    aplica, identificador de la RFQ de reemplazo.
  • La UI debe diferenciar visualmente las dos modalidades para evitar
    cancelaciones tardías accidentales.
```

### 3.4 Matriz de Acciones por Estado y Rol

#### Leyenda
- ✅ = Puede ejecutar la acción
- ❌ = No puede ejecutar la acción
- 👁️ = Solo puede ver (lectura)
- ⚡ = Acción automática del sistema
- 🔒 = Bloqueado por política de negocio
- 👤 = Solo el creador original

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ACCIONES EN ESTADO: BORRADOR (DRAFT)                                  │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acción                          │ Indust. │ Indust. Admin │ Compras │ Compras Admin │ Proveedor │       │
├─────────────────────────────────┼─────────┼───────────────┼─────────┼───────────────┼───────────┤       │
│ Ver RFQ                         │  👤 ✅   │     👤 ✅      │   ❌    │      ❌       │    ❌     │       │
│ Editar campos técnicos          │  👤 ✅   │     👤 ✅      │   ❌    │      ❌       │    ❌     │       │
│ Subir archivos (PPT, STP)       │  👤 ✅   │     👤 ✅      │   ❌    │      ❌       │    ❌     │       │
│ Guardar borrador                │  👤 ✅   │     👤 ✅      │   ❌    │      ❌       │    ❌     │       │
│ Enviar RFQ                      │  👤 ✅   │     👤 ✅      │   ❌    │      ❌       │    ❌     │       │
│ Eliminar borrador               │  👤 ✅   │     👤 ✅      │   ❌    │      ❌       │    ❌     │       │
│                                 │         │               │         │               │           │       │
│ 👤 = Solo el creador puede realizar estas acciones, sin importar su rol                          │       │
└─────────────────────────────────┴─────────┴───────────────┴─────────┴───────────────┴───────────┴───────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              ACCIONES EN ESTADO: PENDIENTE ASIGNACIÓN (PENDING)                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acción                          │ Indust. │ Indust. Admin │ Compras │ Compras Admin │ Proveedor │       │
├─────────────────────────────────┼─────────┼───────────────┼─────────┼───────────────┼───────────┤       │
│ Ver RFQ                         │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Descargar documentos            │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Asignar proveedores             │   ❌    │      ❌       │   ✅    │      ✅       │    ❌     │       │
│ Ver sugerencias IA              │   ❌    │      ❌       │   ✅    │      ✅       │    ❌     │       │
│ Solicitar edición de RFQ        │  👤 ✅  │    👤 ✅      │   ❌    │      ❌       │    ❌     │       │
│ Cancelar (cancelación TEMPRANA) │   ❌    │      ✅       │   ❌    │      ✅       │    ❌     │       │
│                                 │         │               │         │               │           │       │
│ 👤 = Solo el creador original puede solicitar edición                                           │       │
│ ⚠️ Cualquier rol de Compras (base o admin) que asigne → pasa directo a QUOTING                  │       │
│ ⚠️ La cancelación es la ÚNICA acción exclusiva de los Super Usuarios en este estado             │       │
└─────────────────────────────────┴─────────┴───────────────┴─────────┴───────────────┴───────────┴───────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                        ACCIONES EN ESTADO: SOLICITANDO EDICIÓN (PENDING_EDIT_REQUEST)                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acción                          │ Indust. │ Indust. Admin │ Compras │ Compras Admin │ Proveedor │       │
├─────────────────────────────────┼─────────┼───────────────┼─────────┼───────────────┼───────────┤       │
│ Ver RFQ                         │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Descargar documentos            │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Aprobar solicitud de edición    │   ❌    │      ❌       │   ✅    │      ✅       │    ❌     │       │
│ Rechazar solicitud de edición   │   ❌    │      ❌       │   ✅    │      ✅       │    ❌     │       │
│ Asignar proveedores             │   ❌    │      ❌       │   ❌    │      ❌       │    ❌     │       │
│ Cancelar (cancelación TEMPRANA) │   ❌    │      ✅       │   ❌    │      ✅       │    ❌     │       │
│ Editar campos de la RFQ         │   ❌    │      ❌       │   ❌    │      ❌       │    ❌     │       │
│                                 │         │               │         │               │           │       │
│ ⚠️ Asignación de proveedores BLOQUEADA hasta que Compras resuelva la solicitud                  │       │
│ ⚠️ Aprobación → RFQ pasa a DRAFT (solo creador puede ver/editar)                               │       │
│ ⚠️ Rechazo → RFQ regresa a PENDING (requiere motivo; Compras retoma asignación)                │       │
└─────────────────────────────────┴─────────┴───────────────┴─────────┴───────────────┴───────────┴───────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ACCIONES EN ESTADO: EN COTIZACIÓN (QUOTING)                              │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acción                          │ Indust. │ Indust. Admin │ Compras │ Compras Admin │ Proveedor │       │
├─────────────────────────────────┼─────────┼───────────────┼─────────┼───────────────┼───────────┤       │
│ Ver RFQ                         │   ✅    │      ✅       │   ✅    │      ✅       │    ✅     │       │
│ Descargar documentos            │   ✅    │      ✅       │   ✅    │      ✅       │    ✅     │       │
│ Ver proveedores asignados       │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Ver estado cotizaciones         │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Crear cotización                │   ❌    │      ❌       │   ❌    │      ❌       │    ✅     │       │
│ Ver días restantes              │   ✅    │      ✅       │   ✅    │      ✅       │    ✅     │       │
│ Cancelar (cancelación TARDÍA)   │   ❌    │      ✅       │   ❌    │      ✅       │    ❌     │       │
│ Excluir proveedor (vencimiento) │   ⚡    │      ⚡       │   ⚡    │      ⚡       │    ⚡     │ Auto  │
│                                 │         │               │         │               │           │       │
│ ⚠️ Cancelación TARDÍA: Solo Super Usuarios. Notifica a TODOS los proveedores asignados y       │       │
│    genera automáticamente una RFQ de reemplazo en DRAFT (ver sección 3.3 / 3.5).               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          ACCIONES EN ESTADO: COTIZADA PARCIALMENTE (PARTIALLY_QUOTED)                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acción                          │ Indust. │ Indust. Admin │ Compras │ Compras Admin │ Proveedor │       │
├─────────────────────────────────┼─────────┼───────────────┼─────────┼───────────────┼───────────┤       │
│ Ver RFQ                         │   ✅    │      ✅       │   ✅    │      ✅       │   👁️     │       │
│ Ver cotizaciones recibidas      │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Ver comparativo parcial         │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Crear cotización (si tiene plazo)│   ❌    │      ❌       │   ❌    │      ❌       │    ✅     │       │
│ Aprobar desbloqueo cotización   │   ❌    │      ❌       │   ❌    │      ✅       │    ❌     │       │
│ Cancelar (cancelación TARDÍA)   │   ❌    │      ✅       │   ❌    │      ✅       │    ❌     │       │
│                                 │         │               │         │               │           │       │
│ ⚠️ Cancelación TARDÍA: Solo Super Usuarios. Notifica a proveedores y genera RFQ de reemplazo.   │       │
└─────────────────────────────────┴─────────┴───────────────┴─────────┴───────────────┴───────────┴───────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           ACCIONES EN ESTADO: BENCHMARK DISPONIBLE (BENCHMARK_READY)                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acción                          │ Indust. │ Indust. Admin │ Compras │ Compras Admin │ Proveedor │       │
├─────────────────────────────────┼─────────┼───────────────┼─────────┼───────────────┼───────────┤       │
│ Ver RFQ                         │   ✅    │      ✅       │   ✅    │      ✅       │   👁️     │       │
│ Ver benchmark completo          │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Exportar benchmark a Excel      │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Ver todas las cotizaciones      │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Ver KPIs de proveedores         │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Cerrar RFQ                      │   ❌    │      ✅       │   ❌    │      ✅       │    ❌     │       │
│ Reenviar a otros proveedores    │   ❌    │      ❌       │   ❌    │      ✅       │    ❌     │       │
│ Cancelar (cancelación TARDÍA)   │   ❌    │      ✅       │   ❌    │      ✅       │    ❌     │       │
│                                 │         │               │         │               │           │       │
│ ⚠️ Cancelación TARDÍA: Solo Super Usuarios. Notifica a proveedores y genera RFQ de reemplazo.   │       │
└─────────────────────────────────┴─────────┴───────────────┴─────────┴───────────────┴───────────┴───────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ACCIONES EN ESTADO: VENCIDA (EXPIRED)                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acción                          │ Indust. │ Indust. Admin │ Compras │ Compras Admin │ Proveedor │       │
├─────────────────────────────────┼─────────┼───────────────┼─────────┼───────────────┼───────────┤       │
│ Ver RFQ                         │   ✅    │      ✅       │   ✅    │      ✅       │   👁️     │       │
│ Ver cotizaciones recibidas      │   ✅    │      ✅       │   ✅    │      ✅       │    ❌     │       │
│ Cerrar RFQ                      │   ❌    │      ✅       │   ❌    │      ✅       │    ❌     │       │
│ Extender plazo (nuevo ciclo)    │   ❌    │      ❌       │   ❌    │      ✅       │    ❌     │       │
│ Cancelar (cancelación TARDÍA)   │   ❌    │      ✅       │   ❌    │      ✅       │    ❌     │       │
│                                 │         │               │         │               │           │       │
│ ⚠️ Cancelación TARDÍA: Solo Super Usuarios. Notifica a proveedores y genera RFQ de reemplazo.   │       │
└─────────────────────────────────┴─────────┴───────────────┴─────────┴───────────────┴───────────┴───────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                ACCIONES EN ESTADO: CERRADA (CLOSED)                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acción                          │ Indust. │ Indust. Admin │ Compras │ Compras Admin │ Proveedor │       │
├─────────────────────────────────┼─────────┼───────────────┼─────────┼───────────────┼───────────┤       │
│ Ver RFQ (histórico)             │   ❌    │      ✅       │   ❌    │      ✅       │   👁️ Suyas     │       │
│ Ver benchmark                   │   ❌    │      ✅       │   ❌    │      ✅       │    ❌     │       │
│ Exportar datos                  │   ❌    │      ✅       │   ❌    │      ✅       │    ❌     │       │
│ Cualquier modificación          │   ❌    │      ❌       │   ❌    │      ❌       │    ❌     │       │
└─────────────────────────────────┴─────────┴───────────────┴─────────┴───────────────┴───────────┴───────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              ACCIONES EN ESTADO: CANCELADA (CANCELLED)                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acción                          │ Indust. │ Indust. Admin │ Compras │ Compras Admin │ Proveedor │       │
├─────────────────────────────────┼─────────┼───────────────┼─────────┼───────────────┼───────────┤       │
│ Ver RFQ (histórico)             │   ✅    │      ✅       │   ✅    │      ✅       │   👁️     │       │
│ Ver motivo de cancelación       │   ✅    │      ✅       │   ✅    │      ✅       │    ✅     │       │
│ Cualquier modificación          │   ❌    │      ❌       │   ❌    │      ❌       │    ❌     │       │
└─────────────────────────────────┴─────────┴───────────────┴─────────┴───────────────┴───────────┴───────┘
```

### 3.5 Transiciones de Estado (TypeScript State Machine)

```typescript
// Configuración de transiciones válidas
// Ubicación: features/rfq/constants/rfqStateMachine.ts
// Nota: el flujo NO tiene aprobaciones intermedias. Los Super Usuarios solo
// cancelan; cualquier otra transición la dispara el creador, Compras o el sistema.

export const RFQStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PENDING_EDIT_REQUEST: 'PENDING_EDIT_REQUEST',
  QUOTING: 'QUOTING',
  PARTIALLY_QUOTED: 'PARTIALLY_QUOTED',
  BENCHMARK_READY: 'BENCHMARK_READY',
  EXPIRED: 'EXPIRED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export const RFQ_STATE_TRANSITIONS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 1: CREACIÓN (Solo el creador puede actuar)
  // ═══════════════════════════════════════════════════════════════════════════
  DRAFT: {
    description: 'RFQ en borrador, solo visible y editable por el creador',
    allowedTransitions: ['PENDING', 'CANCELLED'],
    triggers: {
      // Cualquier usuario de Industrialización envía directo (sin aprobación)
      PENDING: {
        action: 'SUBMIT_DIRECT',
        requiredRole: ['industrializacion', 'industrializacion_admin'],
        description: 'El creador envía la RFQ directamente a Compras'
      },
      // Cancelación: borrar borrador propio o cancelación temprana por Super Usuario
      CANCELLED: {
        action: 'CANCEL_EARLY',
        requiredRole: ['creator_only', 'industrializacion_admin', 'compras_admin'],
        requiresComment: true,
        description: 'El creador elimina su borrador o un Super Usuario lo cancela'
      },
    },
    ownershipRule: 'CREATOR_ONLY', // Solo el creador puede ver/editar
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 2: ASIGNACIÓN DE PROVEEDORES (Departamento de Compras)
  // ═══════════════════════════════════════════════════════════════════════════
  PENDING: {
    description: 'RFQ enviada, esperando asignación de proveedores por Compras',
    allowedTransitions: ['QUOTING', 'CANCELLED', 'PENDING_EDIT_REQUEST'],
    triggers: {
      // Cualquier usuario de Compras asigna y notifica directamente
      QUOTING: {
        action: 'ASSIGN_SUPPLIERS_DIRECT',
        requiredRole: ['compras', 'compras_admin'],
        description: 'Compras asigna proveedores y notifica directamente'
      },
      // Cancelación temprana (todavía no hay proveedores notificados)
      CANCELLED: {
        action: 'CANCEL_EARLY',
        requiredRole: ['industrializacion_admin', 'compras_admin'],
        requiresComment: true,
        description: 'Super Usuario cancela antes de notificar proveedores'
      },
      // El creador solicita retirar la RFQ para corregir datos
      PENDING_EDIT_REQUEST: {
        action: 'REQUEST_EDIT',
        requiredRole: ['creator_only'],
        requiresComment: true,
        description: 'El creador solicita editar la RFQ; Compras debe aprobar o rechazar'
      },
    },
    notifyOnEntry: ['compras', 'compras_admin'],
    visibleTo: ['industrializacion', 'industrializacion_admin', 'compras', 'compras_admin'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 2-ALT: SOLICITUD DE EDICIÓN (substate transitorio de PENDING)
  // ═══════════════════════════════════════════════════════════════════════════
  PENDING_EDIT_REQUEST: {
    description: 'Creador solicitó editar la RFQ; Compras debe aprobar o rechazar. Asignación bloqueada.',
    allowedTransitions: ['DRAFT', 'PENDING', 'CANCELLED'],
    triggers: {
      // Compras aprueba: la RFQ regresa a borrador para que el creador la edite
      DRAFT: {
        action: 'APPROVE_EDIT_REQUEST',
        requiredRole: ['compras', 'compras_admin'],
        description: 'Compras aprueba la solicitud; RFQ regresa a DRAFT (solo creador puede ver/editar)'
      },
      // Compras rechaza: la RFQ permanece en PENDING y Compras retoma la asignación
      PENDING: {
        action: 'REJECT_EDIT_REQUEST',
        requiredRole: ['compras', 'compras_admin'],
        requiresComment: true,
        description: 'Compras rechaza la solicitud con motivo; RFQ permanece en PENDING'
      },
      // Cancelación temprana aún es posible durante este substate
      CANCELLED: {
        action: 'CANCEL_EARLY',
        requiredRole: ['industrializacion_admin', 'compras_admin'],
        requiresComment: true,
        description: 'Super Usuario cancela la RFQ mientras la solicitud de edición está pendiente'
      },
    },
    notifyOnEntry: ['compras', 'compras_admin'],
    visibleTo: ['industrializacion', 'industrializacion_admin', 'compras', 'compras_admin'],
    ownershipRule: 'CREATOR_ONLY_ON_APPROVAL', // Al aprobarse, vuelve a ser solo visible por el creador
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 3: EN COTIZACIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  QUOTING: {
    description: 'Proveedores notificados, plazo corriendo. Cancelable solo por Super Usuario con protocolo especial.',
    allowedTransitions: ['PARTIALLY_QUOTED', 'EXPIRED', 'CANCELLED'],
    triggers: {
      PARTIALLY_QUOTED: {
        action: 'QUOTATION_RECEIVED',
        requiredRole: ['system'],
        description: 'Sistema detecta primera cotización recibida'
      },
      EXPIRED: {
        action: 'DEADLINE_PASSED',
        requiredRole: ['system'],
        description: 'Sistema detecta que venció el plazo de 10 días'
      },
      CANCELLED: {
        action: 'CANCEL_LATE',
        requiredRole: ['industrializacion_admin', 'compras_admin'],
        requiresComment: true,
        sideEffects: ['NOTIFY_ALL_SUPPLIERS', 'CREATE_REPLACEMENT_RFQ'],
        description: 'Super Usuario cancela post-notificación: notifica proveedores y genera RFQ nueva'
      },
    },
    cancellationPolicy: {
      allowed: true,
      requiredRole: ['industrializacion_admin', 'compras_admin'],
      protocol: 'LATE_CANCELLATION',
    },
    notifyOnEntry: ['proveedor_assigned'],
    visibleTo: ['all'],
    deadlineConfig: {
      duration: 10,
      unit: 'days',
      autoTransitionOnExpiry: 'EXPIRED',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 4: COTIZACIÓN PARCIAL
  // ═══════════════════════════════════════════════════════════════════════════
  PARTIALLY_QUOTED: {
    description: 'Al menos 1 cotización recibida, esperando más o vencimiento. Cancelable solo por Super Usuario con protocolo especial.',
    allowedTransitions: ['BENCHMARK_READY', 'EXPIRED', 'CANCELLED'],
    triggers: {
      BENCHMARK_READY: {
        action: 'MIN_QUOTATIONS_REACHED',
        requiredRole: ['system'],
        minQuotations: 4,
        description: 'Sistema detecta que se alcanzaron 4 cotizaciones válidas'
      },
      EXPIRED: {
        action: 'DEADLINE_PASSED',
        requiredRole: ['system'],
        description: 'Sistema detecta que venció el plazo general'
      },
      CANCELLED: {
        action: 'CANCEL_LATE',
        requiredRole: ['industrializacion_admin', 'compras_admin'],
        requiresComment: true,
        sideEffects: ['NOTIFY_ALL_SUPPLIERS', 'CREATE_REPLACEMENT_RFQ'],
        description: 'Super Usuario cancela: notifica proveedores y genera RFQ nueva'
      },
    },
    cancellationPolicy: {
      allowed: true,
      requiredRole: ['industrializacion_admin', 'compras_admin'],
      protocol: 'LATE_CANCELLATION',
    },
    visibleTo: ['industrializacion', 'industrializacion_admin', 'compras', 'compras_admin', 'proveedor_assigned'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 5: BENCHMARK LISTO
  // ═══════════════════════════════════════════════════════════════════════════
  BENCHMARK_READY: {
    description: 'Benchmark generado con 4+ cotizaciones, listo para análisis',
    allowedTransitions: ['CLOSED', 'QUOTING', 'CANCELLED'],
    triggers: {
      CLOSED: {
        action: 'CLOSE_RFQ',
        requiredRole: ['industrializacion_admin', 'compras_admin'],
        description: 'Super Usuario cierra la RFQ definitivamente'
      },
      QUOTING: {
        action: 'RESEND_TO_MORE_SUPPLIERS',
        requiredRole: ['compras_admin'],
        description: 'Super Usuario Compras envía a proveedores adicionales',
      },
      CANCELLED: {
        action: 'CANCEL_LATE',
        requiredRole: ['industrializacion_admin', 'compras_admin'],
        requiresComment: true,
        sideEffects: ['NOTIFY_ALL_SUPPLIERS', 'CREATE_REPLACEMENT_RFQ'],
        description: 'Super Usuario cancela: notifica proveedores y genera RFQ nueva'
      },
    },
    cancellationPolicy: {
      allowed: true,
      requiredRole: ['industrializacion_admin', 'compras_admin'],
      protocol: 'LATE_CANCELLATION',
    },
    visibleTo: ['industrializacion', 'industrializacion_admin', 'compras', 'compras_admin'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 5-ALT: VENCIDA
  // ═══════════════════════════════════════════════════════════════════════════
  EXPIRED: {
    description: 'Plazo vencido, se puede extender, cerrar o cancelar con protocolo especial',
    allowedTransitions: ['CLOSED', 'QUOTING', 'CANCELLED'],
    triggers: {
      CLOSED: {
        action: 'CLOSE_RFQ',
        requiredRole: ['industrializacion_admin', 'compras_admin'],
        description: 'Super Usuario cierra la RFQ vencida'
      },
      QUOTING: {
        action: 'EXTEND_WITH_NEW_SUPPLIERS',
        requiredRole: ['compras_admin'],
        description: 'Super Usuario Compras extiende enviando a más proveedores',
      },
      CANCELLED: {
        action: 'CANCEL_LATE',
        requiredRole: ['industrializacion_admin', 'compras_admin'],
        requiresComment: true,
        sideEffects: ['NOTIFY_ALL_SUPPLIERS', 'CREATE_REPLACEMENT_RFQ'],
        description: 'Super Usuario cancela: notifica proveedores y genera RFQ nueva'
      },
    },
    cancellationPolicy: {
      allowed: true,
      requiredRole: ['industrializacion_admin', 'compras_admin'],
      protocol: 'LATE_CANCELLATION',
    },
    visibleTo: ['industrializacion', 'industrializacion_admin', 'compras', 'compras_admin'],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADOS FINALES (Sin transiciones posibles)
  // ═══════════════════════════════════════════════════════════════════════════
  CLOSED: {
    description: 'RFQ cerrada definitivamente - Solo lectura',
    allowedTransitions: [],
    triggers: {},
    finalState: true,
    visibleTo: ['all'], // Histórico visible para todos los involucrados
  },
  
  CANCELLED: {
    description: 'RFQ cancelada - Solo lectura con motivo de cancelación',
    allowedTransitions: [],
    triggers: {},
    finalState: true,
    visibleTo: ['all'], // Histórico visible para auditoría
    requiresCancellationReason: true,
  },
} as const;
```

### 3.6 Flujo Secuencial Completo

> Existe un único camino feliz; los Super Usuarios ya no aprueban ni rechazan.
> Su intervención es excepcional y siempre toma forma de cancelación, ya sea
> temprana o tardía con protocolo especial.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              FLUJO DIRECTO ÚNICO                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

Día 0
  │
  │  ┌─────────────────────────────────────┐
  │  │ 1. Usuario de Industrialización     │
  │  │    (base o admin) crea la RFQ       │
  │  │    - Llena campos técnicos          │
  │  │    - Sube PPT y STP                 │
  │  │    - Guarda como BORRADOR           │
  │  │    → Estado: DRAFT                  │
  │  │    → 👤 Solo él puede ver/editar    │
  │  └─────────────────────────────────────┘
  │
  ▼
Día 1
  │  ┌─────────────────────────────────────┐
  │  │ 2. Usuario envía la RFQ             │
  │  │    → Estado: PENDING                │
  │  │    → 📧 Email a Compras             │
  │  └─────────────────────────────────────┘
  │
  ▼
Día 2
  │  ┌─────────────────────────────────────┐
  │  │ 3. Usuario de Compras (base o admin)│
  │  │    asigna proveedores               │
  │  │    - Revisa sugerencias IA          │
  │  │    - Selecciona 6 proveedores       │
  │  │    → Estado: QUOTING                │
  │  │    → 📧 Email a 6 PROVEEDORES       │
  │  │    → ⏱️ Inicia plazo 10 días        │
  │  └─────────────────────────────────────┘
  │
  ▼
                     [... continúa con cotización, benchmark y cierre ...]


══════════════════════════════════════════════════════════════════════════════════════════
                  RAMA DE EXCEPCIÓN: CANCELACIÓN POR SUPER USUARIO
══════════════════════════════════════════════════════════════════════════════════════════

  Cualquier estado no terminal puede salir a CANCELLED por intervención del
  Super Usuario:

    DRAFT ──┐
    PENDING ┘  →  CANCEL_EARLY  → CANCELLED  (notifica solo a internos)

    QUOTING ─────┐
    PARTIALLY_QUOTED ─┐
    BENCHMARK_READY ──┤  →  CANCEL_LATE  →  CANCELLED
    EXPIRED ─────────┘                       │
                                             ├─ 📧 Notifica a TODOS los proveedores
                                             ├─ Archiva cotizaciones recibidas
                                             └─ 🆕 Genera RFQ de reemplazo en DRAFT


        [... continúa igual que el flujo normal ...]
```

#### 3.5.3 Flujo Común Post-QUOTING (Ambos caminos)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO COMÚN DESPUÉS DE QUOTING (Punto de no retorno)                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

🔒 QUOTING                                      
  │                                              
  │  ┌─────────────────────────────────────┐    
  │  │ 4. PROVEEDORES trabajan             │    
  │  │    - Descargan documentos           │    
  │  │    - Preparan cotizaciones          │    
  │  │    → ⚠️ NO SE PUEDE CANCELAR        │    
  │  └─────────────────────────────────────┘    
  │                                              
  ├───── ¿Primera cotización recibida? ─────────┤
  │                                              │
  │                               ┌─────────────────────────┐
  │                               │ → PARTIALLY_QUOTED       │
  │                               │ → 📧 Notifica cotización │
  │                               └─────────────────────────┘
  │                                              │
  ├───────── ¿4 cotizaciones? ────┬──────────────┤
  │                               │              │
  │  NO (< 4 cotizaciones)        │   SÍ (≥ 4 cotizaciones)
  │  ┌─────────────────────┐      │  ┌─────────────────────────┐
  │  │ Esperar más o       │      │  │ → BENCHMARK_READY       │
  │  │ que venza plazo     │      │  │ → 📧 "Benchmark listo"  │
  │  └─────────────────────┘      │  │ → 📊 Comparativo listo  │
  │            │                  │  └─────────────────────────┘
  │            ▼                  │              │
  │  ┌─────────────────────┐      │              │
  │  │ ¿Venció plazo?      │      │              │
  │  │ → EXPIRED           │      │              │
  │  │ → 📧 "RFQ vencida"  │      │              │
  │  └─────────────────────┘      │              │
  │            │                  │              │
  │            ▼                  │              ▼
  │  ┌─────────────────────┐      │  ┌─────────────────────────┐
  │  │ Opciones:           │      │  │ Opciones:               │
  │  │ • Cerrar            │      │  │ • Cerrar                │
  │  │ • Extender plazo    │      │  │ • Reenviar a otros      │
  │  │   (nuevos provs)    │      │  │   proveedores           │
  │  └─────────────────────┘      │  └─────────────────────────┘
  │            │                  │              │
  │            └──────────────────┴──────────────┘
  │                               │
  ▼                               ▼
  ┌─────────────────────────────────────────┐    
  │              CLOSED                      │    
  │         RFQ archivada en histórico      │    
  └─────────────────────────────────────────┘

### 3.7 Notificaciones por Transición de Estado

| Transición | Destinatarios | Contenido del Email |
|------------|---------------|---------------------|
| `DRAFT` → `PENDING` | Compras (todos) | Nueva RFQ pendiente de asignación |
| `PENDING` → `QUOTING` | Proveedores asignados | RFQ asignada, tienes 10 días para cotizar |
| `QUOTING` → `PARTIALLY_QUOTED` | Compras, Industrialización | Nueva cotización recibida de [Proveedor] |
| `PARTIALLY_QUOTED` → `BENCHMARK_READY` | Compras, Industrialización | Benchmark disponible para RFQ [ID] |
| Proveedor excluido (vencimiento) | Proveedor, Compras | Exclusión por vencimiento de plazo |
| `DRAFT` / `PENDING` → `CANCELLED` (cancelación temprana) | Creador, Compras | RFQ cancelada por Super Usuario: [Motivo] |
| `QUOTING` / `PARTIALLY_QUOTED` / `BENCHMARK_READY` / `EXPIRED` → `CANCELLED` (cancelación tardía) | Creador, Compras, **TODOS los proveedores asignados** | RFQ cancelada por Super Usuario: [Motivo]. Se generó la RFQ de reemplazo [NEW_ID]. |
| RFQ de reemplazo creada (por cancelación tardía) | Creador original, Compras | Nueva RFQ [NEW_ID] generada en DRAFT por cancelación de [OLD_ID] |
| `PENDING` → `PENDING_EDIT_REQUEST` | Compras (todos) | [Creador] solicitó editar la RFQ [ID]. Debes aprobar o rechazar la solicitud para continuar con la asignación. |
| `PENDING_EDIT_REQUEST` → `DRAFT` (aprobado) | Creador | Compras aprobó tu solicitud de edición. La RFQ [ID] está de nuevo en borrador; corrígela y vuelve a enviarla. |
| `PENDING_EDIT_REQUEST` → `PENDING` (rechazado) | Creador | Compras rechazó tu solicitud de edición de la RFQ [ID]. Motivo: [Motivo]. La RFQ continúa en espera de asignación. |

### 3.8 Reglas de Negocio Críticas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REGLAS DE NEGOCIO - RFQ                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📌 REGLA 1: Propiedad del Borrador (DRAFT)                                 │
│     - SOLO el usuario que creó la RFQ puede verla y editarla en DRAFT       │
│     - Ni siquiera los Super Usuarios pueden ver borradores ajenos           │
│     - Una vez enviada, la propiedad pasa al flujo institucional             │
│                                                                              │
│  📌 REGLA 2: Flujo de Aprobación                                            │
│     - Usuarios Base SIEMPRE requieren aprobación de Super Usuario           │
│     - Super Usuarios pueden actuar directamente sin aprobación              │
│     - Super Usuario puede: Aprobar / Rechazar / Editar+Aprobar / Cancelar   │
│     - Toda acción de edición por Super Usuario requiere audit log           │
│                                                                              │
│  📌 REGLA 3: Documentación Obligatoria                                      │
│     Una RFQ NO puede salir de DRAFT si:                                     │
│     - Falta archivo PPT (presentación)                                      │
│     - Falta archivo STP (modelo 3D)                                         │
│     - Hay campos técnicos obligatorios vacíos                               │
│                                                                              │
│  📌 REGLA 4: Punto de No Retorno (QUOTING)                                  │
│     - Una vez que la RFQ llega a QUOTING, NO SE PUEDE CANCELAR              │
│     - Los proveedores ya fueron notificados y están trabajando              │
│     - La única salida es: todos responden O vence el plazo de 10 días       │
│                                                                              │
│  📌 REGLA 5: Plazo de Cotización                                            │
│     - 10 días hábiles desde asignación                                      │
│     - Excluye fines de semana y días festivos                               │
│     - Timer individual por proveedor                                        │
│     - Exclusión automática al vencer (proveedor no responde)                │
│                                                                              │
│  📌 REGLA 6: Mínimo para Benchmark                                          │
│     - Se requieren mínimo 4 cotizaciones para benchmark completo            │
│     - Con menos de 4, se muestra comparativo parcial                        │
│     - Benchmark completo solo con 4+                                        │
│                                                                              │
│  📌 REGLA 7: Bloqueo de Cotización                                          │
│     - Cotización enviada = bloqueada inmediatamente                         │
│     - Desbloqueo requiere aprobación de Super Usuario Compras               │
│     - Se registra quién y cuándo desbloqueó (audit log)                     │
│                                                                              │
│  📌 REGLA 8: Cancelación Permitida                                          │
│     - Solo puede cancelarse en estados: DRAFT, PENDING_INTERNAL_APPROVAL,   │
│       PENDING, PENDING_PURCHASING_APPROVAL                                  │
│     - Solo Super Usuarios pueden cancelar                                   │
│     - Requiere motivo obligatorio                                           │
│     - Soft delete: la RFQ se marca CANCELLED, no se borra físicamente       │
│                                                                              │
│  📌 REGLA 9: Visibilidad de Proveedores                                     │
│     - Proveedor SOLO ve RFQs donde está asignado                            │
│     - NUNCA ve benchmark ni cotizaciones de otros                           │
│     - Solo ve su propia cotización y estado                                 │
│                                                                              │
│  📌 REGLA 10: Límites de Archivos                                           │
│     - STP: máximo 100 MB                                                    │
│     - PPT/PDF/Excel: máximo 15 MB                                           │
│     - Validación en frontend Y backend                                      │
│                                                                              │
│  📌 REGLA 11: Audit Trail                                                   │
│     - Toda acción de Super Usuario se registra: quién, cuándo, qué cambió   │
│     - Rechazos siempre tienen motivo obligatorio                            │
│     - Ediciones de Super Usuario muestran diff de cambios                   │
│                                                                              │
│  📌 REGLA 12: Solicitud de Edición en PENDING                               │
│     - Solo el CREADOR original puede solicitar edición (no otros usuarios   │
│       de Industrialización aunque tengan el mismo rol)                       │
│     - Solo aplica cuando la RFQ está en estado PENDING                      │
│     - Solo puede haber UNA solicitud activa por RFQ a la vez               │
│     - La solicitud requiere un motivo (>= 10 caracteres) del creador        │
│     - La solicitud notifica automáticamente a TODO el equipo de Compras     │
│     - Mientras existe una solicitud activa, Compras NO puede asignar        │
│       proveedores (el botón de asignación queda bloqueado en la UI)         │
│     - Compras puede: Aprobar (→ RFQ pasa a DRAFT) o Rechazar (→ PENDING)   │
│     - Rechazo requiere motivo obligatorio de Compras                        │
│     - Aprobación: RFQ pasa a DRAFT, solo visible por el creador;           │
│       el creador debe volver a enviarla cuando termine de editar            │
│     - Toda solicitud queda en audit trail: quién solicitó, quién resolvió, │
│       timestamp de solicitud, timestamp de resolución y decisión tomada      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.9 Implementación en TypeScript

```typescript
// features/rfq/types/rfqStatus.ts

export const RFQ_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_INTERNAL_APPROVAL: 'PENDING_INTERNAL_APPROVAL',
  PENDING: 'PENDING',
  PENDING_PURCHASING_APPROVAL: 'PENDING_PURCHASING_APPROVAL',
  QUOTING: 'QUOTING',
  PARTIALLY_QUOTED: 'PARTIALLY_QUOTED',
  BENCHMARK_READY: 'BENCHMARK_READY',
  EXPIRED: 'EXPIRED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export type RfqStatus = typeof RFQ_STATUS[keyof typeof RFQ_STATUS];

export const RFQ_STATUS_LABELS: Record<RfqStatus, string> = {
  DRAFT: 'Borrador',
  PENDING_INTERNAL_APPROVAL: 'Pendiente Aprobación Interna',
  PENDING: 'Pendiente Asignación',
  PENDING_PURCHASING_APPROVAL: 'Pendiente Aprobación Compras',
  QUOTING: 'En Cotización',
  PARTIALLY_QUOTED: 'Cotizada Parcialmente',
  BENCHMARK_READY: 'Benchmark Disponible',
  EXPIRED: 'Vencida',
  CLOSED: 'Cerrada',
  CANCELLED: 'Cancelada',
};

export const RFQ_STATUS_COLORS: Record<RfqStatus, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  PENDING_INTERNAL_APPROVAL: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  PENDING_PURCHASING_APPROVAL: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  QUOTING: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  PARTIALLY_QUOTED: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-400' },
  BENCHMARK_READY: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-400' },
  EXPIRED: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-600' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-600' },
};

// Estados donde la cancelación está BLOQUEADA (punto de no retorno)
export const LOCKED_STATES: RfqStatus[] = [
  'QUOTING',
  'PARTIALLY_QUOTED', 
  'BENCHMARK_READY',
  'EXPIRED',
  'CLOSED',
  'CANCELLED',
];

// Estados donde se permite cancelación
export const CANCELLABLE_STATES: RfqStatus[] = [
  'DRAFT',
  'PENDING_INTERNAL_APPROVAL',
  'PENDING',
  'PENDING_PURCHASING_APPROVAL',
];
```

```typescript
// features/rfq/hooks/useRfqActions.ts

import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { RfqStatus, CANCELLABLE_STATES, LOCKED_STATES } from '../types/rfqStatus';

interface RfqActionContext {
  rfqStatus: RfqStatus;
  rfqCreatorId: string;
  rfqAssignedById?: string; // Usuario que asignó proveedores
}

export function useRfqActions({ rfqStatus, rfqCreatorId, rfqAssignedById }: RfqActionContext) {
  const { can, isAdmin } = usePermissions();
  const { user } = useAuth();
  
  const isCreator = user?.id === rfqCreatorId;
  const isAssigner = user?.id === rfqAssignedById;
  const isLocked = LOCKED_STATES.includes(rfqStatus);
  
  const actions = {
    // === ACCIONES EN DRAFT ===
    // Solo el creador puede ver/editar su borrador
    canViewDraft: rfqStatus === 'DRAFT' && isCreator,
    canEditDraft: rfqStatus === 'DRAFT' && isCreator,
    canDeleteDraft: rfqStatus === 'DRAFT' && isCreator,
    canSubmitDraft: rfqStatus === 'DRAFT' && isCreator,
    
    // === ACCIONES DE APROBACIÓN INTERNA ===
    canApproveInternal: rfqStatus === 'PENDING_INTERNAL_APPROVAL' && isAdmin('industrializacion'),
    canRejectInternal: rfqStatus === 'PENDING_INTERNAL_APPROVAL' && isAdmin('industrializacion'),
    canEditAndApproveInternal: rfqStatus === 'PENDING_INTERNAL_APPROVAL' && isAdmin('industrializacion'),
    
    // === ACCIONES DE ASIGNACIÓN ===
    canAssignSuppliers: rfqStatus === 'PENDING' && can('supplier:select'),
    
    // === ACCIONES DE APROBACIÓN DE COMPRAS ===
    canApprovePurchasing: rfqStatus === 'PENDING_PURCHASING_APPROVAL' && isAdmin('compras'),
    canRejectPurchasing: rfqStatus === 'PENDING_PURCHASING_APPROVAL' && isAdmin('compras'),
    canEditAndApprovePurchasing: rfqStatus === 'PENDING_PURCHASING_APPROVAL' && isAdmin('compras'),
    
    // === ACCIONES POST-QUOTING ===
    canViewQuotations: ['QUOTING', 'PARTIALLY_QUOTED', 'BENCHMARK_READY', 'CLOSED'].includes(rfqStatus),
    canViewBenchmark: ['BENCHMARK_READY', 'CLOSED'].includes(rfqStatus) && can('benchmark:view'),
    canExportBenchmark: ['BENCHMARK_READY', 'CLOSED'].includes(rfqStatus) && can('benchmark:export'),
    canCloseRfq: ['BENCHMARK_READY', 'EXPIRED'].includes(rfqStatus) && (isAdmin('industrializacion') || isAdmin('compras')),
    canExtendDeadline: rfqStatus === 'EXPIRED' && isAdmin('compras'),
    canResendToSuppliers: rfqStatus === 'BENCHMARK_READY' && isAdmin('compras'),
    
    // === CANCELACIÓN ===
    // Solo permitida en estados iniciales y solo por Super Usuarios
    canCancel: CANCELLABLE_STATES.includes(rfqStatus) && (isAdmin('industrializacion') || isAdmin('compras')),
    
    // === INFO ===
    isLocked, // El estado actual está bloqueado para cancelación
    isCreator,
    isAssigner,
  };
  
  return actions;
}
```

```typescript
// features/rfq/hooks/useRfqApprovalFlow.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rfqApi } from '../api/rfqApi';

interface ApprovalAction {
  rfqId: string;
  action: 'approve' | 'reject' | 'edit_and_approve' | 'cancel';
  comment?: string; // Obligatorio para reject
  changes?: Record<string, unknown>; // Para edit_and_approve
}

export function useRfqApprovalFlow() {
  const queryClient = useQueryClient();
  
  const internalApproval = useMutation({
    mutationFn: (action: ApprovalAction) => rfqApi.processInternalApproval(action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfq', variables.rfqId] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    },
  });
  
  const purchasingApproval = useMutation({
    mutationFn: (action: ApprovalAction) => rfqApi.processPurchasingApproval(action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfq', variables.rfqId] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    },
  });
  
  return {
    // Para Super Usuario Industrialización
    approveInternal: (rfqId: string) => internalApproval.mutate({ rfqId, action: 'approve' }),
    rejectInternal: (rfqId: string, comment: string) => 
      internalApproval.mutate({ rfqId, action: 'reject', comment }),
    editAndApproveInternal: (rfqId: string, changes: Record<string, unknown>) => 
      internalApproval.mutate({ rfqId, action: 'edit_and_approve', changes }),
    cancelFromInternal: (rfqId: string, comment: string) => 
      internalApproval.mutate({ rfqId, action: 'cancel', comment }),
    
    // Para Super Usuario Compras
    approvePurchasing: (rfqId: string) => purchasingApproval.mutate({ rfqId, action: 'approve' }),
    rejectPurchasing: (rfqId: string, comment: string) => 
      purchasingApproval.mutate({ rfqId, action: 'reject', comment }),
    editAndApprovePurchasing: (rfqId: string, changes: Record<string, unknown>) => 
      purchasingApproval.mutate({ rfqId, action: 'edit_and_approve', changes }),
    cancelFromPurchasing: (rfqId: string, comment: string) => 
      purchasingApproval.mutate({ rfqId, action: 'cancel', comment }),
    
    // Estados de las mutaciones
    isProcessingInternal: internalApproval.isPending,
    isProcessingPurchasing: purchasingApproval.isPending,
    internalError: internalApproval.error,
    purchasingError: purchasingApproval.error,
  };
}
```

---

## 4. Estructura de Carpetas Propuesta

```
src/
├── app/                          # Bootstrap y configuración global
│   ├── App.tsx                   # Componente raíz con providers
│   ├── Router.tsx                # Configuración de rutas
│   ├── providers/                # Context providers globales
│   │   ├── AuthProvider.tsx      # Estado de autenticación
│   │   ├── NotificationProvider.tsx
│   │   └── ThemeProvider.tsx
│   └── config/                   # Configuración de la app
│       ├── env.ts                # Variables de entorno tipadas
│       ├── routes.ts             # Constantes de rutas
│       └── permissions.ts        # Matriz de permisos por rol
│
├── features/                     # Módulos por dominio de negocio
│   │
│   ├── auth/                     # Autenticación y autorización
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SSOCallback.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── usePermissions.ts
│   │   │   └── useRole.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── rfq/                      # Gestión de RFQs (core del sistema)
│   │   ├── components/
│   │   │   ├── RfqForm/
│   │   │   │   ├── RfqForm.tsx
│   │   │   │   ├── TechnicalFieldsSection.tsx
│   │   │   │   ├── FileUploadSection.tsx
│   │   │   │   └── ValidationSummary.tsx
│   │   │   ├── RfqList/
│   │   │   │   ├── RfqTable.tsx
│   │   │   │   ├── RfqFilters.tsx
│   │   │   │   └── RfqStatusBadge.tsx
│   │   │   ├── RfqDetail/
│   │   │   │   ├── RfqDetailView.tsx
│   │   │   │   └── RfqTimeline.tsx
│   │   │   └── RfqActions/
│   │   │       ├── CancelRfqModal.tsx
│   │   │       └── AssignSuppliersModal.tsx
│   │   ├── hooks/
│   │   │   ├── useRfqList.ts
│   │   │   ├── useRfqDetail.ts
│   │   │   ├── useRfqMutations.ts
│   │   │   └── useRfqValidation.ts
│   │   ├── services/
│   │   │   └── rfqService.ts
│   │   ├── schemas/
│   │   │   ├── rfqFormSchema.ts    # Zod validation
│   │   │   └── rfqFiltersSchema.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── index.ts
│   │
│   ├── quotation/                # Cotizaciones de proveedores
│   │   ├── components/
│   │   │   ├── QuotationForm/
│   │   │   │   ├── QuotationForm.tsx
│   │   │   │   ├── PricingSection.tsx
│   │   │   │   ├── DimensionsSection.tsx
│   │   │   │   ├── DeliverySection.tsx
│   │   │   │   └── PdfUploadSection.tsx
│   │   │   ├── QuotationList/
│   │   │   │   ├── QuotationTable.tsx
│   │   │   │   └── QuotationStatusBadge.tsx
│   │   │   └── QuotationDetail/
│   │   │       ├── QuotationDetailView.tsx
│   │   │       └── UnlockRequestModal.tsx
│   │   ├── hooks/
│   │   │   ├── useQuotationForm.ts
│   │   │   ├── useQuotationList.ts
│   │   │   └── useQuotationSubmit.ts
│   │   ├── services/
│   │   │   └── quotationService.ts
│   │   ├── schemas/
│   │   │   └── quotationFormSchema.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── benchmark/                # Comparativo de cotizaciones
│   │   ├── components/
│   │   │   ├── BenchmarkTable.tsx
│   │   │   ├── BenchmarkExportButton.tsx
│   │   │   └── BenchmarkComparison.tsx
│   │   ├── hooks/
│   │   │   ├── useBenchmark.ts
│   │   │   └── useBenchmarkExport.ts
│   │   ├── services/
│   │   │   └── benchmarkService.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── analytics/                # Dashboards y KPIs
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── KpiCards/
│   │   │   │   ├── SupplierKpiCard.tsx
│   │   │   │   ├── ResponseRateCard.tsx
│   │   │   │   └── DeliveryRateCard.tsx
│   │   │   ├── Charts/
│   │   │   │   ├── PriceTrendChart.tsx
│   │   │   │   ├── RegionChart.tsx
│   │   │   │   └── SupplierPerformanceChart.tsx
│   │   │   └── Filters/
│   │   │       ├── DateRangeFilter.tsx
│   │   │       ├── RegionFilter.tsx
│   │   │       └── MachineTypeFilter.tsx
│   │   ├── hooks/
│   │   │   ├── useKpis.ts
│   │   │   ├── usePriceTrends.ts
│   │   │   └── useSupplierMetrics.ts
│   │   ├── services/
│   │   │   └── analyticsService.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   │
│   ├── suppliers/                # Gestión de proveedores
│   │   ├── components/
│   │   │   ├── SupplierList.tsx
│   │   │   ├── SupplierCard.tsx
│   │   │   ├── SupplierSelector.tsx
│   │   │   └── SupplierSuggestions.tsx  # Sugerencias IA
│   │   ├── hooks/
│   │   │   ├── useSuppliers.ts
│   │   │   └── useSupplierSuggestions.ts
│   │   ├── services/
│   │   │   └── supplierService.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── notifications/            # Sistema de notificaciones
│   │   ├── components/
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── NotificationList.tsx
│   │   │   └── NotificationItem.tsx
│   │   ├── hooks/
│   │   │   └── useNotifications.ts
│   │   ├── services/
│   │   │   └── notificationService.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── admin/                    # Funciones administrativas (Super Usuario)
│       ├── components/
│       │   ├── AdminDashboard.tsx
│       │   ├── UnlockRequestsPanel.tsx
│       │   ├── PendingCancellationsPanel.tsx
│       │   └── SystemMetricsPanel.tsx
│       ├── hooks/
│       │   ├── useAdminRequests.ts
│       │   └── useSystemMetrics.ts
│       ├── services/
│       │   └── adminService.ts
│       ├── types.ts
│       └── index.ts
│
├── pages/                        # Páginas (route-mapped)
│   │
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── SSOCallbackPage.tsx
│   │
│   ├── industrializacion/        # Páginas rol Industrialización
│   │   ├── DashboardPage.tsx
│   │   ├── RfqListPage.tsx
│   │   ├── RfqCreatePage.tsx
│   │   ├── RfqDetailPage.tsx
│   │   ├── PredictionPage.tsx
│   │   └── admin/                # Solo Super Usuario
│   │       ├── AdminDashboardPage.tsx
│   │       └── RequestsManagementPage.tsx
│   │
│   ├── compras/                  # Páginas rol Compras
│   │   ├── DashboardPage.tsx
│   │   ├── RfqListPage.tsx
│   │   ├── RfqDetailPage.tsx
│   │   ├── SupplierSelectionPage.tsx
│   │   ├── BenchmarkPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   └── admin/                # Solo Super Usuario
│   │       ├── AdminDashboardPage.tsx
│   │       ├── SupplierManagementPage.tsx
│   │       └── UnlockRequestsPage.tsx
│   │
│   ├── proveedor/                # Páginas rol Proveedor
│   │   ├── DashboardPage.tsx
│   │   ├── AssignedRfqListPage.tsx
│   │   ├── QuotationFormPage.tsx
│   │   ├── QuotationHistoryPage.tsx
│   │   └── QuotationDetailPage.tsx
│   │
│   └── shared/                   # Páginas compartidas
│       ├── NotFoundPage.tsx
│       ├── UnauthorizedPage.tsx
│       └── ErrorPage.tsx
│
├── shared/                       # Componentes y utilidades compartidas
│   │
│   ├── components/               # UI Components reutilizables
│   │   ├── ui/                   # Primitivos de UI
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── index.ts
│   │   ├── forms/                # Componentes de formulario
│   │   │   ├── FormField.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   └── index.ts
│   │   ├── feedback/             # Componentes de feedback
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LoadingOverlay.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── index.ts
│   │   └── data-display/         # Visualización de datos
│   │       ├── DataTable.tsx
│   │       ├── StatusIndicator.tsx
│   │       ├── Timeline.tsx
│   │       └── index.ts
│   │
│   ├── hooks/                    # Hooks globales
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useMediaQuery.ts
│   │   ├── usePagination.ts
│   │   └── index.ts
│   │
│   ├── services/                 # Servicios base
│   │   ├── apiClient.ts          # Axios/fetch wrapper
│   │   ├── queryClient.ts        # TanStack Query config
│   │   └── index.ts
│   │
│   ├── schemas/                  # Schemas compartidos
│   │   ├── commonSchemas.ts      # Validaciones comunes
│   │   └── index.ts
│   │
│   ├── types/                    # Tipos globales
│   │   ├── api.ts                # Tipos de respuesta API
│   │   ├── common.ts             # Tipos comunes
│   │   ├── roles.ts              # Enum/tipos de roles
│   │   └── index.ts
│   │
│   ├── utils/                    # Funciones utilitarias
│   │   ├── formatters.ts         # Formateo de fechas, números, etc
│   │   ├── validators.ts         # Validaciones helper
│   │   ├── fileHelpers.ts        # Manejo de archivos
│   │   ├── permissions.ts        # Helpers de permisos
│   │   └── index.ts
│   │
│   └── constants/                # Constantes globales
│       ├── api.ts                # Endpoints base
│       ├── statusCodes.ts        # Estados del sistema
│       ├── fileTypes.ts          # Tipos de archivo permitidos
│       └── index.ts
│
├── layouts/                      # Layouts de página
│   ├── MainLayout.tsx            # Layout principal con sidebar
│   ├── AuthLayout.tsx            # Layout de autenticación
│   ├── AdminLayout.tsx           # Layout para paneles admin
│   └── components/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── Footer.tsx
│       └── Breadcrumb.tsx
│
├── styles/                       # Estilos globales
│   ├── index.css                 # Entry point Tailwind
│   └── themes/                   # Temas personalizados
│       └── bocar.css             # Colores brand Bocar
│
├── assets/                       # Assets estáticos
│   ├── images/
│   │   └── Logo-Bocar.png
│   ├── icons/
│   └── fonts/
│
└── main.tsx                      # Entry point
```

---

## 5. Arquitectura de Rutas

### 4.1 Estructura de Rutas por Rol

```typescript
// app/config/routes.ts

export const ROUTES = {
  // Públicas
  AUTH: {
    LOGIN: '/login',
    SSO_CALLBACK: '/auth/callback',
  },
  
  // Industrialización
  INDUSTRIALIZACION: {
    ROOT: '/industrializacion',
    DASHBOARD: '/industrializacion/dashboard',
    RFQ: {
      LIST: '/industrializacion/rfq',
      CREATE: '/industrializacion/rfq/crear',
      DETAIL: '/industrializacion/rfq/:id',
      EDIT: '/industrializacion/rfq/:id/editar',
    },
    PREDICTION: '/industrializacion/prediccion',
    ANALYTICS: '/industrializacion/analytics',
    // Admin routes
    ADMIN: {
      DASHBOARD: '/industrializacion/admin',
      REQUESTS: '/industrializacion/admin/solicitudes',
    },
  },
  
  // Compras
  COMPRAS: {
    ROOT: '/compras',
    DASHBOARD: '/compras/dashboard',
    RFQ: {
      LIST: '/compras/rfq',
      DETAIL: '/compras/rfq/:id',
      ASSIGN_SUPPLIERS: '/compras/rfq/:id/asignar',
    },
    BENCHMARK: '/compras/benchmark/:rfqId',
    ANALYTICS: '/compras/analytics',
    SUPPLIERS: '/compras/proveedores',
    // Admin routes
    ADMIN: {
      DASHBOARD: '/compras/admin',
      SUPPLIERS_MANAGEMENT: '/compras/admin/proveedores',
      UNLOCK_REQUESTS: '/compras/admin/desbloqueos',
    },
  },
  
  // Proveedor
  PROVEEDOR: {
    ROOT: '/proveedor',
    DASHBOARD: '/proveedor/dashboard',
    RFQ: {
      LIST: '/proveedor/rfq',
      DETAIL: '/proveedor/rfq/:id',
    },
    QUOTATION: {
      FORM: '/proveedor/rfq/:rfqId/cotizar',
      HISTORY: '/proveedor/cotizaciones',
      DETAIL: '/proveedor/cotizaciones/:id',
    },
  },
  
  // Errores
  ERROR: {
    NOT_FOUND: '/404',
    UNAUTHORIZED: '/401',
    SERVER_ERROR: '/500',
  },
} as const;
```

### 4.2 Redirección por Rol (RF-02)

```typescript
// features/auth/hooks/useRoleRedirect.ts

export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  'industrializacion': ROUTES.INDUSTRIALIZACION.DASHBOARD,
  'industrializacion_admin': ROUTES.INDUSTRIALIZACION.ADMIN.DASHBOARD,
  'compras': ROUTES.COMPRAS.DASHBOARD,
  'compras_admin': ROUTES.COMPRAS.ADMIN.DASHBOARD,
  'proveedor': ROUTES.PROVEEDOR.DASHBOARD,
};
```

---

## 6. Sistema de Permisos

### 5.1 Definición de Permisos

```typescript
// app/config/permissions.ts

export const PERMISSIONS = {
  // RFQ
  RFQ_CREATE: 'rfq:create',
  RFQ_EDIT: 'rfq:edit',
  RFQ_VIEW: 'rfq:view',
  RFQ_CANCEL: 'rfq:cancel',
  
  // Quotation
  QUOTATION_CREATE: 'quotation:create',
  QUOTATION_VIEW: 'quotation:view',
  QUOTATION_UNLOCK: 'quotation:unlock',
  QUOTATION_UNLOCK_APPROVE: 'quotation:unlock_approve',
  
  // Suppliers
  SUPPLIER_SELECT: 'supplier:select',
  SUPPLIER_MANAGE: 'supplier:manage',
  SUPPLIER_VIEW_SUGGESTIONS: 'supplier:view_suggestions',
  
  // Benchmark
  BENCHMARK_VIEW: 'benchmark:view',
  BENCHMARK_EXPORT: 'benchmark:export',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // Prediction
  PREDICTION_USE: 'prediction:use',
  
  // Admin
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_MANAGE_REQUESTS: 'admin:manage_requests',
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  industrializacion: [
    'rfq:create', 'rfq:edit', 'rfq:view',
    'benchmark:view', 'benchmark:export',
    'analytics:view',
    'prediction:use',
  ],
  
  industrializacion_admin: [
    // Todos los de industrializacion +
    'rfq:cancel',
    'admin:dashboard', 'admin:manage_requests',
  ],
  
  compras: [
    'rfq:view',
    'quotation:view', 'quotation:unlock',
    'supplier:select', 'supplier:view_suggestions',
    'benchmark:view', 'benchmark:export',
    'analytics:view', 'analytics:export',
  ],
  
  compras_admin: [
    // Todos los de compras +
    'rfq:cancel',
    'quotation:unlock_approve',
    'supplier:manage',
    'admin:dashboard', 'admin:manage_requests',
  ],
  
  proveedor: [
    'rfq:view',
    'quotation:create', 'quotation:view',
  ],
};
```

### 5.2 Hook de Permisos

```typescript
// features/auth/hooks/usePermissions.ts

export function usePermissions() {
  const { user } = useAuth();
  
  const can = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    const rolePermissions = ROLE_PERMISSIONS[user.role];
    return rolePermissions.includes(permission);
  }, [user]);
  
  const canAny = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(can);
  }, [can]);
  
  const canAll = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(can);
  }, [can]);
  
  return { can, canAny, canAll };
}
```

---

## 7. Integración con Backend

### 6.0 Integración con Active Directory como directorio de usuarios

El frontend no se conectará directamente a Active Directory. La integración con AD pertenece al backend, porque ahí deben vivir las credenciales de servicio, la conexión segura al directorio y la lógica de autorización.

Para usuarios internos, el flujo objetivo de esta fase es:

1. El usuario entra al login interno desde el portal.
2. El frontend envía las credenciales internas o inicia el flujo definido por IT hacia el backend.
3. El backend valida la identidad contra Active Directory.
4. El backend consulta atributos y grupos AD del usuario.
5. El backend mapea grupos AD a roles de la aplicación.
6. El backend calcula permisos efectivos.
7. El backend crea una sesión propia o token propio del sistema.
8. El frontend consume `/auth/me` para recibir usuario, rol, permisos y ruta default.

Ejemplo de mapeo inicial:

```txt
BOCAR_RFQ_INDUSTRIALIZACION       -> industrializacion
BOCAR_RFQ_INDUSTRIALIZACION_ADMIN -> industrializacion_admin
BOCAR_RFQ_COMPRAS                 -> compras
BOCAR_RFQ_COMPRAS_ADMIN           -> compras_admin
```

Endpoints sugeridos para documentar esta primera etapa:

```http
POST /api/auth/internal/login
GET /api/auth/me
POST /api/auth/logout
GET /api/auth/me/permissions
GET /api/auth/me/navigation
```

`POST /api/auth/internal/login` representa el login interno basado en AD como directorio. Si BOCAR confirma SSO más adelante, este endpoint puede convivir con un flujo adicional como `/api/auth/sso/login`, pero no debe asumirse desde esta fase.

Para proveedores externos, el flujo queda separado:

```http
POST /api/supplier-auth/login
GET /api/supplier-auth/me
POST /api/supplier-auth/logout
POST /api/supplier-auth/refresh
```

Reglas de seguridad de esta integración:

- No guardar contraseñas de AD en la base de datos.
- No exponer conexión LDAP/LDAPS desde el frontend.
- Usar conexión segura hacia AD cuando aplique, preferentemente LDAPS.
- Usar cuenta de servicio con permisos mínimos para leer usuarios y grupos.
- Validar permisos en backend en cada endpoint sensible.
- Mantener proveedores externos fuera del directorio interno de AD.

### 6.1 API Client

```typescript
// shared/services/apiClient.ts

import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tokens
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

export { apiClient };
```

### 6.2 Query Client (TanStack Query)

```typescript
// shared/services/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 6.3 Estructura de Servicios

```typescript
// Ejemplo: features/rfq/services/rfqService.ts

import { apiClient } from '@/shared/services/apiClient';
import type { Rfq, CreateRfqDto, RfqFilters } from '../types';

export const rfqService = {
  getAll: async (filters?: RfqFilters): Promise<Rfq[]> => {
    const { data } = await apiClient.get('/rfqs', { params: filters });
    return data;
  },
  
  getById: async (id: string): Promise<Rfq> => {
    const { data } = await apiClient.get(`/rfqs/${id}`);
    return data;
  },
  
  create: async (dto: CreateRfqDto): Promise<Rfq> => {
    const { data } = await apiClient.post('/rfqs', dto);
    return data;
  },
  
  update: async (id: string, dto: Partial<CreateRfqDto>): Promise<Rfq> => {
    const { data } = await apiClient.patch(`/rfqs/${id}`, dto);
    return data;
  },
  
  cancel: async (id: string, reason: string): Promise<void> => {
    await apiClient.post(`/rfqs/${id}/cancel`, { reason });
  },
  
  uploadFile: async (id: string, file: File, type: 'ppt' | 'stp'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const { data } = await apiClient.post(`/rfqs/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
};
```

---

## 8. Patrones de Componentes

### 7.1 Feature Component Pattern

```typescript
// features/rfq/components/RfqForm/RfqForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rfqFormSchema, type RfqFormData } from '../../schemas/rfqFormSchema';
import { useRfqMutations } from '../../hooks/useRfqMutations';
import { TechnicalFieldsSection } from './TechnicalFieldsSection';
import { FileUploadSection } from './FileUploadSection';
import { ValidationSummary } from './ValidationSummary';
import { Button, Card } from '@/shared/components/ui';

type RfqFormProps = {
  initialData?: Partial<RfqFormData>;
  onSuccess?: (rfq: Rfq) => void;
};

export function RfqForm({ initialData, onSuccess }: RfqFormProps) {
  const { createRfq, isCreating } = useRfqMutations();
  
  const form = useForm<RfqFormData>({
    resolver: zodResolver(rfqFormSchema),
    defaultValues: initialData,
  });
  
  const handleSubmit = form.handleSubmit(async (data) => {
    const rfq = await createRfq(data);
    onSuccess?.(rfq);
  });
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <TechnicalFieldsSection form={form} />
        <FileUploadSection form={form} />
        <ValidationSummary errors={form.formState.errors} />
        
        <Button type="submit" loading={isCreating}>
          Crear RFQ
        </Button>
      </Card>
    </form>
  );
}
```

### 7.2 Protected Route Pattern

```typescript
// features/auth/components/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import type { Permission } from '@/app/config/permissions';
import { ROUTES } from '@/app/config/routes';

type ProtectedRouteProps = {
  requiredPermissions?: Permission[];
  allowedRoles?: UserRole[];
  redirectTo?: string;
};

export function ProtectedRoute({
  requiredPermissions = [],
  allowedRoles,
  redirectTo = ROUTES.AUTH.LOGIN,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { canAll } = usePermissions();
  
  if (isLoading) {
    return <LoadingOverlay />;
  }
  
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.ERROR.UNAUTHORIZED} replace />;
  }
  
  if (requiredPermissions.length > 0 && !canAll(requiredPermissions)) {
    return <Navigate to={ROUTES.ERROR.UNAUTHORIZED} replace />;
  }
  
  return <Outlet />;
}
```

---

## 9. Validación con Zod

### 8.1 Schema de RFQ

```typescript
// features/rfq/schemas/rfqFormSchema.ts

import { z } from 'zod';

const MAX_STP_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_PPT_SIZE = 15 * 1024 * 1024;  // 15 MB

export const rfqFormSchema = z.object({
  // Campos técnicos obligatorios (azules)
  projectName: z.string().min(1, 'Nombre del proyecto requerido'),
  partNumber: z.string().min(1, 'Número de parte requerido'),
  description: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  
  // Especificaciones técnicas
  material: z.string().min(1, 'Material requerido'),
  estimatedVolume: z.number().positive('Volumen debe ser positivo'),
  machineType: z.string().min(1, 'Tipo de máquina requerido'),
  region: z.string().min(1, 'Región requerida'),
  country: z.string().min(1, 'País requerido'),
  
  // Archivos obligatorios
  stpFile: z.object({
    name: z.string(),
    size: z.number().max(MAX_STP_SIZE, 'Archivo STP no debe exceder 100MB'),
    type: z.literal('application/step'),
  }),
  pptFile: z.object({
    name: z.string(),
    size: z.number().max(MAX_PPT_SIZE, 'Archivo PPT no debe exceder 15MB'),
    type: z.string().regex(/powerpoint|presentation/),
  }),
  
  // Fechas
  requiredDate: z.date().min(new Date(), 'Fecha debe ser futura'),
});

export type RfqFormData = z.infer<typeof rfqFormSchema>;
```

### 8.2 Schema de Cotización

```typescript
// features/quotation/schemas/quotationFormSchema.ts

import { z } from 'zod';

export const quotationFormSchema = z.object({
  // Precios (campos amarillos)
  priceM1: z.number().positive('Precio M1 requerido'),
  priceT1: z.number().positive('Precio T1 requerido'),
  cavitiesPrice: z.number().positive('Precio cavidades requerido'),
  refactionsPrice: z.number().nonnegative('Precio refacciones no puede ser negativo'),
  
  // Dimensiones del molde
  holderWidth: z.number().positive(),
  holderHeight: z.number().positive(),
  holderDepth: z.number().positive(),
  cavityWidth: z.number().positive(),
  cavityHeight: z.number().positive(),
  cavityDepth: z.number().positive(),
  
  // Tiempos de entrega
  deliveryWeeks: z.number().int().positive().max(52, 'Máximo 52 semanas'),
  
  // PDF obligatorio
  officialPdf: z.object({
    name: z.string().min(1, 'PDF oficial requerido'),
    size: z.number().max(15 * 1024 * 1024, 'PDF no debe exceder 15MB'),
    type: z.literal('application/pdf'),
  }),
});

export type QuotationFormData = z.infer<typeof quotationFormSchema>;
```

---

## 10. Manejo de Estado

### 9.1 Estado Global (Zustand)

```typescript
// app/providers/stores/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/shared/types/roles';

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  setUser: (user: User, token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setUser: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
      }),
      
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'bocar-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
```

### 9.2 Estado del Servidor (TanStack Query)

```typescript
// features/rfq/hooks/useRfqList.ts

import { useQuery } from '@tanstack/react-query';
import { rfqService } from '../services/rfqService';
import type { RfqFilters } from '../types';

export function useRfqList(filters?: RfqFilters) {
  return useQuery({
    queryKey: ['rfqs', filters],
    queryFn: () => rfqService.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// features/rfq/hooks/useRfqMutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rfqService } from '../services/rfqService';
import type { CreateRfqDto } from '../types';

export function useRfqMutations() {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: (dto: CreateRfqDto) => rfqService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
  
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rfqService.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfq', id] });
    },
  });
  
  return {
    createRfq: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    cancelRfq: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
}
```

---

## 11. Componentes UI Base

### 10.1 Sistema de Diseño

```typescript
// shared/components/ui/Button.tsx

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { Spinner } from './Spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-[#163d72] text-white hover:bg-[#12345f] focus:ring-[#163d72]',
        secondary: 'bg-[#f5f7fb] text-[#163d72] hover:bg-[#e8eef6] focus:ring-[#163d72]',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'bg-transparent text-[#163d72] hover:bg-[#f5f7fb]',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="mr-2 h-4 w-4" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 10.2 Colores BOCAR

```css
/* styles/themes/bocar.css */

:root {
  /* Primary Blues */
  --bocar-primary-900: #0a3570;
  --bocar-primary-800: #0f4c97;
  --bocar-primary-700: #163d72;
  --bocar-primary-600: #1e4fa4;
  --bocar-primary-500: #2563eb;
  
  /* Neutral */
  --bocar-gray-900: #15263f;
  --bocar-gray-700: #6f88a8;
  --bocar-gray-500: #7f95b2;
  --bocar-gray-300: #d9e1ec;
  --bocar-gray-100: #f5f7fb;
  
  /* Background */
  --bocar-bg-light: #f5f4f2;
  --bocar-bg-card: #fffefe;
  
  /* Status */
  --bocar-success: #10b981;
  --bocar-warning: #f59e0b;
  --bocar-error: #ef4444;
  --bocar-info: #3b82f6;
}
```

---

## 12. Testing Strategy

### 11.1 Estructura de Tests

```
src/
├── features/
│   └── rfq/
│       ├── components/
│       │   └── RfqForm/
│       │       ├── RfqForm.tsx
│       │       └── RfqForm.test.tsx    # Collocated test
│       └── hooks/
│           ├── useRfqList.ts
│           └── useRfqList.test.ts
│
└── __tests__/                          # Integration tests
    ├── integration/
    │   ├── rfq-flow.test.tsx
    │   └── quotation-flow.test.tsx
    └── e2e/                            # Playwright tests
        ├── login.spec.ts
        ├── rfq-creation.spec.ts
        └── supplier-quotation.spec.ts
```

### 11.2 Ejemplo de Test

```typescript
// features/rfq/components/RfqForm/RfqForm.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RfqForm } from './RfqForm';
import { TestProviders } from '@/test-utils/providers';

describe('RfqForm', () => {
  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <TestProviders>
        <RfqForm onSuccess={vi.fn()} />
      </TestProviders>
    );
    
    await user.click(screen.getByRole('button', { name: /crear rfq/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/nombre del proyecto requerido/i)).toBeInTheDocument();
    });
  });
  
  it('should submit form with valid data', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    
    render(
      <TestProviders>
        <RfqForm onSuccess={onSuccess} />
      </TestProviders>
    );
    
    await user.type(screen.getByLabelText(/nombre del proyecto/i), 'Test Project');
    // ... fill other fields
    
    await user.click(screen.getByRole('button', { name: /crear rfq/i }));
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

---

## 13. Dependencias Recomendadas

### 12.1 package.json (dependencies)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    
    "@tanstack/react-query": "^5.8.0",
    "@tanstack/react-query-devtools": "^5.8.0",
    
    "zustand": "^4.4.7",
    
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    
    "axios": "^1.6.2",
    
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0",
    
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tooltip": "^1.0.7",
    
    "date-fns": "^2.30.0",
    
    "recharts": "^2.10.3",
    
    "react-dropzone": "^14.2.3",
    
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@playwright/test": "^1.40.0",
    
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "eslint-plugin-react-hooks": "^4.6.0"
  }
}
```

---

## 14. Configuración de Vite

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@app': path.resolve(__dirname, './src/app'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 15. Plan de Migración

### Fase 1: Estructura Base (Semana 1-2)
1. Crear estructura de carpetas
2. Configurar aliases de Vite
3. Instalar dependencias
4. Configurar TanStack Query y Zustand
5. Crear componentes UI base

### Fase 2: Autenticación (Semana 2-3)
1. Implementar AuthProvider
2. Crear LoginPage
3. Configurar rutas protegidas
4. Implementar redirección por rol

### Fase 3: Features Core (Semana 3-7)
1. Feature RFQ completo
2. Feature Quotation completo
3. Feature Benchmark
4. Feature Analytics básico

### Fase 4: Features Admin (Semana 8-9)
1. Paneles de administración
2. Gestión de solicitudes
3. Métricas del sistema

### Fase 5: Refinamiento (Semana 10-11)
1. Testing E2E
2. Optimización de rendimiento
3. Documentación final

---

## 16. Checklist de Calidad

- [ ] ¿Estructura escala a 10+ features?
- [ ] ¿Boundaries de módulos claros?
- [ ] ¿Nuevo dev puede navegar en < 15 min?
- [ ] ¿Cero ambigüedad sobre dónde va nuevo código?
- [ ] ¿Responsabilidades claramente asignadas?
- [ ] ¿Fomenta reuso sin sobreingeniería?
- [ ] ¿Sistema de tipos fuerte?
- [ ] ¿Features testeables independientemente?
- [ ] ¿Reglas explícitas sobre qué NO va en cada carpeta?

---

## 17. Conclusión

Esta arquitectura está diseñada específicamente para el Sistema de Cotizaciones de BOCAR, considerando:

1. **Multi-rol**: 5 roles de usuario con permisos granulares
2. **Escalabilidad**: Feature-based organization que escala infinitamente
3. **Mantenibilidad**: Separación clara de concerns y módulos independientes
4. **DX**: Imports claros, tipos fuertes, convenciones consistentes
5. **Cumplimiento**: Alineada con requisitos RF y RNF del documento técnico

La estructura propuesta permite implementar todos los 24 requisitos funcionales documentados manteniendo un código limpio, testeable y fácil de mantener por un equipo de múltiples desarrolladores.
