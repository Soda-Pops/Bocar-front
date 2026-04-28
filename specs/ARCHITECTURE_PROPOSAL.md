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
│ Admin (adicional):                                                           │
│ • Cancelar RFQs (RF-24)                                                      │
│ • Gestionar solicitudes de cambio técnico                                   │
│ • Panel de métricas departamentales                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              COMPRAS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Operativo:                                                                   │
│ • Seleccionar proveedores para RFQ (RF-07)                                  │
│ • Ver sugerencias de proveedores IA (RF-08)                                 │
│ • Revisar cotizaciones recibidas                                             │
│ • Ver/Exportar benchmark (RF-18, RF-19)                                     │
│ • Dashboard de KPIs y tendencias (RF-20, RF-21)                             │
│ • Solicitar desbloqueo de cotización (RF-15)                                │
│                                                                              │
│ Admin (adicional):                                                           │
│ • Cancelar RFQs (RF-24)                                                      │
│ • Aprobar/Rechazar desbloqueos de cotización                                │
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
                    │  • Eliminar: Solo el creador o su Admin      │
                    └──────────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────┴───────────────────────┐
                    │                                              │
         [Usuario envía RFQ]                            [Usuario envía RFQ]
                    │                                              │
    ┌───────────────┴───────────────┐          ┌───────────────────┴───────────────────┐
    │  OPCIÓN A: Super Usuario      │          │  OPCIÓN B: Usuario Base               │
    │  de Industrialización         │          │  de Industrialización                 │
    │  ─────────────────────────    │          │  ─────────────────────────────────    │
    │  • Envía directamente         │          │  • Envía para aprobación interna      │
    │  • NO necesita aprobación     │          │  • Va a estado intermedio             │
    │  • Pasa directo a PENDING     │          │                                       │
    └───────────────┬───────────────┘          └───────────────────┬───────────────────┘
                    │                                              │
                    │                                              ▼
                    │              ┌──────────────────────────────────────────────┐
                    │              │   PENDIENTE APROBACIÓN INTERNA               │
                    │              │      (PENDING_INTERNAL_APPROVAL)             │
                    │              │  ─────────────────────────────────────────── │
                    │              │  • RFQ enviada por Usuario Base              │
                    │              │  • Esperando revisión de Super Usuario       │
                    │              │    de Industrialización                      │
                    │              │  • 📧 Email a Super Usuario Industrialización │
                    │              │  • Super Usuario puede:                      │
                    │              │    ✅ Aprobar → PENDING                      │
                    │              │    ↩️ Rechazar → DRAFT (con motivo)          │
                    │              │    ✏️ Editar+Aprobar (con auditoría)         │
                    │              │    🗑️ Cancelar (soft delete)                 │
                    │              └────────────────────┬──────────────────────────┘
                    │                                   │
                    └───────────────────────────────────┤
                                                        │
                                                        ▼
                    ┌──────────────────────────────────────────────┐
                    │        PENDIENTE ASIGNACIÓN (PENDING)        │
                    │  ─────────────────────────────────────────── │
                    │  • RFQ aprobada por Industrialización        │
                    │  • Esperando que Compras asigne proveedores  │
                    │  • 📧 Notificación enviada a Compras         │
                    │  • Visible para Industrialización + Compras  │
                    │  • Cancelable por Admins (con razón)         │
                    └──────────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────┴───────────────────────┐
                    │                                              │
         [Compras asigna]                               [Compras asigna]
                    │                                              │
    ┌───────────────┴───────────────┐          ┌───────────────────┴───────────────────┐
    │  OPCIÓN A: Super Usuario      │          │  OPCIÓN B: Usuario Base               │
    │  de Compras                   │          │  de Compras                           │
    │  ─────────────────────────    │          │  ─────────────────────────────────    │
    │  • Asigna proveedores         │          │  • Asigna proveedores                 │
    │  • NO necesita aprobación     │          │  • Va a estado de aprobación          │
    │  • Pasa directo a QUOTING     │          │                                       │
    └───────────────┬───────────────┘          └───────────────────┬───────────────────┘
                    │                                              │
                    │                                              ▼
                    │              ┌──────────────────────────────────────────────┐
                    │              │   PENDIENTE APROBACIÓN COMPRAS               │
                    │              │      (PENDING_PURCHASING_APPROVAL)           │
                    │              │  ─────────────────────────────────────────── │
                    │              │  • Proveedores propuestos por Usuario Base   │
                    │              │  • Esperando revisión de Super Usuario       │
                    │              │    de Compras                                │
                    │              │  • 📧 Email a Super Usuario Compras          │
                    │              │  • Super Usuario puede:                      │
                    │              │    ✅ Aprobar → QUOTING                      │
                    │              │    ↩️ Rechazar → PENDING (reasignar)         │
                    │              │    ✏️ Editar proveedores + Aprobar           │
                    │              │    🗑️ Cancelar (con auditoría)               │
                    │              └────────────────────┬──────────────────────────┘
                    │                                   │
                    └───────────────────────────────────┤
                                                        │
    ════════════════════════════════════════════════════▼════════════════════════════════════
                           🔒 PUNTO DE NO RETORNO: PROVEEDORES NOTIFICADOS 🔒
    ═════════════════════════════════════════════════════════════════════════════════════════
                                                        │
                                                        ▼
                    ┌──────────────────────────────────────────────┐
                    │          EN COTIZACIÓN (QUOTING)             │
                    │  ─────────────────────────────────────────── │
                    │  • Proveedores notificados por email         │
                    │  • Plazo: 10 días hábiles para cotizar       │
                    │  • Timer activo                              │
                    │  • Proveedores pueden ver/descargar docs     │
                    │                                              │
                    │  ⚠️ REGLAS ESTRICTAS:                        │
                    │  • ❌ NO se puede cancelar                   │
                    │  • Solo sale de este estado cuando:          │
                    │    1. Al menos 1 proveedor responde, o       │
                    │    2. Se cumplió la fecha límite (10 días)   │
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
    │    aún tienen tiempo         │          │  • Admin puede:               │
    │                               │          │    → Cerrar RFQ               │
    │  ⚠️ NO se puede cancelar      │          │    → Extender plazo (nuevo    │
    │     (proveedores trabajando)  │          │      ciclo de cotización)     │
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
    │  • Admin puede:                                              │
    │    → Cerrar RFQ (finalizar proceso)                          │
    │    → Reenviar a otros proveedores (nuevo ciclo)              │
    │      Requiere aprobación de Super Usuario Compras            │
    └───────────────────────────────┬───────────────────────────────┘
                                    │
                    [Admin cierra RFQ]
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

    ┌───────────────────────────────────────┐
    │          CANCELADA (CANCELLED)        │
    │  ─────────────────────────────────── │
    │  • Solo puede ocurrir desde:         │
    │    - DRAFT                           │
    │    - PENDING_INTERNAL_APPROVAL       │
    │    - PENDING                         │
    │    - PENDING_PURCHASING_APPROVAL     │
    │  • ❌ NUNCA desde: QUOTING,          │
    │    PARTIALLY_QUOTED, BENCHMARK_READY │
    │    EXPIRED, CLOSED                   │
    │  • Solo Admin puede cancelar         │
    │  • Requiere motivo de cancelación    │
    │  • Soft delete (datos preservados)   │
    │  • Notifica a todos los involucrados │
    └───────────────────────────────────────┘

```

### 3.2 Definición de Estados

| Estado | Código | Descripción | Quién Actúa | Siguiente Estado |
|--------|--------|-------------|-------------|------------------|
| **Borrador** | `DRAFT` | RFQ creada, editable SOLO por el creador | Creador (cualquier tipo) | `PENDING_INTERNAL_APPROVAL`, `PENDING`, `CANCELLED` |
| **Pend. Aprob. Interna** | `PENDING_INTERNAL_APPROVAL` | Usuario Base envió, esperando Super Usuario Industrialización | Super Usuario Indust. | `PENDING`, `DRAFT`, `CANCELLED` |
| **Pendiente Asignación** | `PENDING` | Aprobada, esperando asignación de proveedores | Compras (Base o Admin) | `PENDING_PURCHASING_APPROVAL`, `QUOTING`, `CANCELLED` |
| **Pend. Aprob. Compras** | `PENDING_PURCHASING_APPROVAL` | Usuario Base asignó, esperando Super Usuario Compras | Super Usuario Compras | `QUOTING`, `PENDING`, `CANCELLED` |
| **En Cotización** | `QUOTING` | ⚠️ **PUNTO DE NO RETORNO**: Proveedores trabajando. NO cancelable. | Sistema + Proveedores | `PARTIALLY_QUOTED`, `EXPIRED` |
| **Cotizada Parcialmente** | `PARTIALLY_QUOTED` | 1+ cotizaciones, proveedores aún trabajando. NO cancelable. | Sistema + Proveedores | `BENCHMARK_READY`, `EXPIRED` |
| **Benchmark Disponible** | `BENCHMARK_READY` | 4+ cotizaciones, comparativo listo. Puede reenviar. | Admins | `CLOSED`, `QUOTING` (reenvío) |
| **Vencida** | `EXPIRED` | Plazo vencido. Puede extender o cerrar. | Admins | `CLOSED`, `QUOTING` (extensión) |
| **Cerrada** | `CLOSED` | Proceso finalizado, solo lectura | Nadie | - (estado final) |
| **Cancelada** | `CANCELLED` | Cancelada por Admin (solo antes de QUOTING) | Nadie | - (estado final) |

### 3.3 Flujo de Aprobaciones Detallado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│         ACCIONES DEL SUPER USUARIO EN ESTADOS DE APROBACIÓN                  │
└─────────────────────────────────────────────────────────────────────────────┘

Estado: PENDING_INTERNAL_APPROVAL
(Super Usuario Industrialización revisando RFQ de Usuario Base)
─────────────────────────────────────────────────────────────────────────────

  ✅ APROBAR
     • RFQ pasa a PENDING
     • Se notifica al creador original
     • Se notifica a Compras para asignar proveedores

  ↩️ RECHAZAR (con motivo obligatorio)
     • RFQ regresa a DRAFT
     • Se notifica al creador con el motivo
     • Creador puede corregir y reenviar

  ✏️ EDITAR + APROBAR (con auditoría)
     • Super Usuario modifica campos de la RFQ
     • Se registra qué campos se modificaron
     • REQUIERE: Razón de cada cambio
     • RFQ pasa a PENDING con cambios aplicados

  🗑️ CANCELAR (soft delete)
     • Solo si RFQ es inválida/duplicada/errónea
     • REQUIERE: Motivo de cancelación
     • RFQ pasa a CANCELLED
     • Se notifica al creador


Estado: PENDING_PURCHASING_APPROVAL
(Super Usuario Compras revisando asignación de Usuario Base)
─────────────────────────────────────────────────────────────────────────────

  ✅ APROBAR
     • 🔒 RFQ pasa a QUOTING (PUNTO DE NO RETORNO)
     • Se envían emails a TODOS los proveedores asignados
     • Inicia contador de 10 días hábiles
     • Se notifica a Industrialización

  ↩️ RECHAZAR (con motivo obligatorio)
     • RFQ regresa a PENDING
     • Se notifica al asignador original
     • Asignador puede reasignar proveedores

  ✏️ EDITAR PROVEEDORES + APROBAR
     • Super Usuario modifica lista de proveedores
     • PUEDE: Agregar, quitar o reemplazar proveedores
     • REQUIERE: Razón del cambio en asignación
     • 🔒 RFQ pasa a QUOTING con proveedores modificados

  🗑️ CANCELAR (con auditoría)
     • REQUIERE: Motivo de cancelación
     • RFQ pasa a CANCELLED
     • Se notifica a todos los involucrados
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
│                      ACCIONES EN ESTADO: PEND. APROBACIÓN INTERNA (PENDING_INTERNAL_APPROVAL)            │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acción                          │ Indust. │ Indust. Admin │ Compras │ Compras Admin │ Proveedor │       │
├─────────────────────────────────┼─────────┼───────────────┼─────────┼───────────────┼───────────┤       │
│ Ver RFQ                         │  👤 👁️   │      ✅       │   ❌    │      ❌       │    ❌     │       │
│ Aprobar RFQ                     │   ❌    │      ✅       │   ❌    │      ❌       │    ❌     │       │
│ Rechazar RFQ (con motivo)       │   ❌    │      ✅       │   ❌    │      ❌       │    ❌     │       │
│ Editar + Aprobar (auditoría)    │   ❌    │      ✅       │   ❌    │      ❌       │    ❌     │       │
│ Cancelar (soft delete)          │   ❌    │      ✅       │   ❌    │      ❌       │    ❌     │       │
│                                 │         │               │         │               │           │       │
│ 👤 👁️ = Creador solo puede ver, esperando revisión de Super Usuario  
LOs 2 super usuarios lo unico que hacen son poder cancelar RFqs solo cancelan y ya    #Cambio                        │       │
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
│ Cancelar                        │   ❌    │      ✅       │   ❌    │      ✅       │    ❌     │       │
│                                 │         │               │         │               │           │       │
│ ⚠️ Si Usuario Base Compras asigna → pasa a PENDING_PURCHASING_APPROVAL                           │       │
│ ⚠️ Si Admin Compras asigna → pasa directo a QUOTING                                              │       │
└─────────────────────────────────┴─────────┴───────────────┴─────────┴───────────────┴───────────┴───────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                      ACCIONES EN ESTADO: PEND. APROBACIÓN COMPRAS (PENDING_PURCHASING_APPROVAL)          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Acción                          │ Indust. │ Indust. Admin │ Compras │ Compras Admin │ Proveedor │       │
├─────────────────────────────────┼─────────┼───────────────┼─────────┼───────────────┼───────────┤       │
│ Ver RFQ                         │   ✅    │      ✅       │  👤 👁️   │      ✅       │    ❌     │       │
│ Ver proveedores propuestos      │   ✅    │      ✅       │  👤 👁️   │      ✅       │    ❌     │       │
│ Aprobar asignación              │   ❌    │      ❌       │   ❌    │      ✅       │    ❌     │       │
│ Rechazar asignación (motivo)    │   ❌    │      ❌       │   ❌    │      ✅       │    ❌     │       │
│ Editar proveedores + Aprobar    │   ❌    │      ❌       │   ❌    │      ✅       │    ❌     │       │
│ Cancelar                        │   ❌    │      ❌       │   ❌    │      ✅       │    ❌     │       │
│                                 │         │               │         │               │           │       │
│ 👤 👁️ = Usuario Base que asignó solo puede ver, esperando aprobación                             │       │
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
│ Cancelar                        │   ❌    │      ❌       │   ❌    │      ❌       │    ❌     │ 🔒    │
│ Excluir proveedor (vencimiento) │   ⚡    │      ⚡       │   ⚡    │      ⚡       │    ⚡     │ Auto  │
│                                 │         │               │         │               │           │       │
│ ⚠️ PUNTO DE NO RETORNO: NO se puede cancelar. Solo sale cuando todos responden o vence plazo 
Aqui para cancelar la Rfq se tiene que notificar al proveedor y mandar una nueva   #Cambio       │
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
│ Cancelar                        │   ❌    │      ❌       │   ❌    │      ❌       │    ❌     │ 🔒    │
│                                 │         │               │         │               │           │       │
│ ⚠️ NO SE PUEDE CANCELAR: Proveedores trabajando, proceso debe concluir naturalmente               │       │
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
│ Cancelar                        │   ❌    │      ❌       │   ❌    │      ❌       │    ❌     │ 🔒    │
│                                 │         │               │         │               │           │       │
│ ⚠️ NO SE PUEDE CANCELAR: Proceso completado. Puede reenviar a otros proveedores si necesario     │       │
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
│ Cancelar                        │   ❌    │      ❌       │   ❌    │      ❌       │    ❌     │ 🔒    │
│                                 │         │               │         │               │           │       │
│ ⚠️ NO SE PUEDE CANCELAR: Proceso vencido. Puede extender plazo o cerrar.                         │       │
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
// Configuración de transiciones válidas con flujo de aprobación
// Ubicación: features/rfq/constants/rfqStateMachine.ts

export const RFQStatus = {
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

export const RFQ_STATE_TRANSITIONS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 1: CREACIÓN (Solo el creador puede actuar)
  // ═══════════════════════════════════════════════════════════════════════════
  DRAFT: {
    description: 'RFQ en borrador, solo visible y editable por el creador',
    allowedTransitions: ['PENDING_INTERNAL_APPROVAL', 'PENDING', 'CANCELLED'],
    triggers: {
      // Usuario Base Industrialización envía → necesita aprobación
      PENDING_INTERNAL_APPROVAL: { 
        action: 'SUBMIT_FOR_INTERNAL_APPROVAL', 
        requiredRole: ['industrializacion'],
        description: 'Usuario Base envía para aprobación de Super Usuario'
      },
      // Super Usuario Industrialización envía → va directo a Compras
      PENDING: { 
        action: 'SUBMIT_DIRECT', 
        requiredRole: ['industrializacion_admin'],
        description: 'Super Usuario envía directo sin necesitar aprobación'
      },
      // Solo el creador puede eliminar su propio borrador
      CANCELLED: { 
        action: 'DELETE_DRAFT', 
        requiredRole: ['creator_only'],
        description: 'Solo el creador puede eliminar su borrador'
      },
    },
    ownershipRule: 'CREATOR_ONLY', // Solo el creador puede ver/editar
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 2A: APROBACIÓN INTERNA (Super Usuario Industrialización decide)
  // ═══════════════════════════════════════════════════════════════════════════
  PENDING_INTERNAL_APPROVAL: {
    description: 'Esperando aprobación del Super Usuario de Industrialización',
    allowedTransitions: ['PENDING', 'DRAFT', 'CANCELLED'],
    triggers: {
      // Aprobar → envía a Compras
      PENDING: { 
        action: 'APPROVE_INTERNAL', 
        requiredRole: ['industrializacion_admin'],
        requiresComment: false,
        description: 'Super Usuario aprueba y envía a Compras'
      },
      // Rechazar → regresa a borrador del creador
      DRAFT: { 
        action: 'REJECT_INTERNAL', 
        requiredRole: ['industrializacion_admin'],
        requiresComment: true, // Obligatorio explicar por qué
        description: 'Super Usuario rechaza con comentarios para corrección'
      },
      // Cancelar → elimina la RFQ
      CANCELLED: { 
        action: 'CANCEL', 
        requiredRole: ['industrializacion_admin'],
        requiresComment: true,
        description: 'Super Usuario cancela definitivamente la RFQ'
      },
    },
    // Super Usuario también puede editar y luego aprobar
    specialActions: {
      EDIT_AND_APPROVE: {
        action: 'EDIT_AND_APPROVE',
        requiredRole: ['industrializacion_admin'],
        targetState: 'PENDING',
        description: 'Super Usuario edita campos y aprueba con los cambios',
        requiresAuditLog: true, // Registrar qué cambios hizo
      },
    },
    notifyOnEntry: ['industrializacion_admin'], // Notificar a Super Usuarios
    visibleTo: ['creator', 'industrializacion_admin'], // Creador solo ve, Admin actúa
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 3: ASIGNACIÓN DE PROVEEDORES (Departamento de Compras)
  // ═══════════════════════════════════════════════════════════════════════════
  PENDING: {
    description: 'RFQ aprobada, esperando asignación de proveedores por Compras',
    allowedTransitions: ['PENDING_PURCHASING_APPROVAL', 'QUOTING', 'CANCELLED'],
    triggers: {
      // Usuario Base Compras asigna → necesita aprobación de su Super Usuario
      PENDING_PURCHASING_APPROVAL: { 
        action: 'ASSIGN_SUPPLIERS_FOR_APPROVAL', 
        requiredRole: ['compras'],
        description: 'Usuario Base asigna proveedores, necesita aprobación'
      },
      // Super Usuario Compras asigna → notifica proveedores directamente
      QUOTING: { 
        action: 'ASSIGN_SUPPLIERS_DIRECT', 
        requiredRole: ['compras_admin'],
        description: 'Super Usuario asigna y notifica proveedores directamente'
      },
      // Cancelación aún permitida (no hay proveedores notificados)
      CANCELLED: { 
        action: 'CANCEL', 
        requiredRole: ['industrializacion_admin', 'compras_admin'],
        requiresComment: true,
        description: 'Super Usuario puede cancelar antes de notificar proveedores'
      },
    },
    notifyOnEntry: ['compras', 'compras_admin'],
    visibleTo: ['industrializacion', 'industrializacion_admin', 'compras', 'compras_admin'],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 3A: APROBACIÓN DE COMPRAS (Super Usuario Compras decide)
  // ═══════════════════════════════════════════════════════════════════════════
  PENDING_PURCHASING_APPROVAL: {
    description: 'Usuario Base de Compras asignó proveedores, esperando aprobación',
    allowedTransitions: ['QUOTING', 'PENDING', 'CANCELLED'],
    triggers: {
      // Aprobar → notifica proveedores e inicia plazo
      QUOTING: { 
        action: 'APPROVE_PURCHASING', 
        requiredRole: ['compras_admin'],
        requiresComment: false,
        description: 'Super Usuario aprueba y notifica a proveedores'
      },
      // Rechazar → regresa a PENDING para reasignación
      PENDING: { 
        action: 'REJECT_PURCHASING', 
        requiredRole: ['compras_admin'],
        requiresComment: true,
        description: 'Super Usuario rechaza la selección de proveedores'
      },
      // Cancelar → elimina la RFQ
      CANCELLED: { 
        action: 'CANCEL', 
        requiredRole: ['compras_admin'],
        requiresComment: true,
        description: 'Super Usuario cancela definitivamente la RFQ'
      },
    },
    specialActions: {
      EDIT_SUPPLIERS_AND_APPROVE: {
        action: 'EDIT_AND_APPROVE',
        requiredRole: ['compras_admin'],
        targetState: 'QUOTING',
        description: 'Super Usuario modifica proveedores y aprueba',
        requiresAuditLog: true,
      },
    },
    notifyOnEntry: ['compras_admin'],
    visibleTo: ['industrializacion_admin', 'compras', 'compras_admin'],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 4: EN COTIZACIÓN - 🔒 PUNTO DE NO RETORNO
  // ═══════════════════════════════════════════════════════════════════════════
  QUOTING: {
    description: '🔒 PUNTO DE NO RETORNO - Proveedores notificados, plazo corriendo',
    allowedTransitions: ['PARTIALLY_QUOTED', 'EXPIRED'], // 🚫 SIN CANCELLED
    triggers: {
      // Transición automática cuando llega primera cotización
      PARTIALLY_QUOTED: { 
        action: 'QUOTATION_RECEIVED', 
        requiredRole: ['system'],
        description: 'Sistema detecta primera cotización recibida'
      },
      // Transición automática cuando vence el plazo sin 4 cotizaciones
      EXPIRED: { 
        action: 'DEADLINE_PASSED', 
        requiredRole: ['system'],
        description: 'Sistema detecta que venció el plazo de 10 días'
      },
    },
    // ⚠️ NO HAY ACCIÓN DE CANCELAR - Es el punto de no retorno
    cancellationPolicy: {
      allowed: false,
      reason: 'Proveedores ya fueron notificados y están trabajando en cotizaciones',
      exitConditions: [
        'Todos los proveedores responden (o vence su plazo individual)',
        'Vence el plazo general de la RFQ (10 días)',
      ],
    },
    notifyOnEntry: ['proveedor_assigned'], // Notifica a proveedores asignados
    visibleTo: ['all'], // Todos pueden ver, proveedores solo su parte
    deadlineConfig: {
      duration: 10, // días
      unit: 'days',
      autoTransitionOnExpiry: 'EXPIRED',
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 5: COTIZACIÓN PARCIAL - 🔒 AÚN EN PUNTO DE NO RETORNO
  // ═══════════════════════════════════════════════════════════════════════════
  PARTIALLY_QUOTED: {
    description: '🔒 Al menos 1 cotización recibida, esperando más o vencimiento',
    allowedTransitions: ['BENCHMARK_READY', 'EXPIRED'], // 🚫 SIN CANCELLED
    triggers: {
      // Transición automática cuando llegan 4 cotizaciones
      BENCHMARK_READY: { 
        action: 'MIN_QUOTATIONS_REACHED', 
        requiredRole: ['system'], 
        minQuotations: 4,
        description: 'Sistema detecta que se alcanzaron 4 cotizaciones válidas'
      },
      // Transición automática cuando vence el plazo
      EXPIRED: { 
        action: 'DEADLINE_PASSED', 
        requiredRole: ['system'],
        description: 'Sistema detecta que venció el plazo general'
      },
    },
    cancellationPolicy: {
      allowed: false,
      reason: 'Proveedores ya enviaron cotizaciones, proceso debe concluir',
    },
    visibleTo: ['industrializacion', 'industrializacion_admin', 'compras', 'compras_admin', 'proveedor_assigned'],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 6: BENCHMARK LISTO - Proceso completado exitosamente
  // ═══════════════════════════════════════════════════════════════════════════
  BENCHMARK_READY: {
    description: 'Benchmark generado con 4+ cotizaciones, listo para análisis',
    allowedTransitions: ['CLOSED', 'QUOTING'], // Puede reenviar o cerrar
    triggers: {
      CLOSED: { 
        action: 'CLOSE_RFQ', 
        requiredRole: ['industrializacion_admin', 'compras_admin'],
        description: 'Super Usuario cierra la RFQ definitivamente'
      },
      // Opción de reenviar a otros proveedores si se necesitan más cotizaciones
      QUOTING: {
        action: 'RESEND_TO_MORE_SUPPLIERS',
        requiredRole: ['compras_admin'],
        description: 'Super Usuario Compras envía a proveedores adicionales',
      },
    },
    cancellationPolicy: {
      allowed: false,
      reason: 'Proceso completado con cotizaciones válidas',
    },
    visibleTo: ['industrializacion', 'industrializacion_admin', 'compras', 'compras_admin'],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 6-ALT: VENCIDA - Plazo expiró sin suficientes cotizaciones
  // ═══════════════════════════════════════════════════════════════════════════
  EXPIRED: {
    description: 'Plazo vencido, se puede extender o cerrar',
    allowedTransitions: ['CLOSED', 'QUOTING'],
    triggers: {
      CLOSED: { 
        action: 'CLOSE_RFQ', 
        requiredRole: ['industrializacion_admin', 'compras_admin'],
        description: 'Super Usuario cierra la RFQ vencida'
      },
      // Extender plazo enviando a nuevos proveedores
      QUOTING: {
        action: 'EXTEND_WITH_NEW_SUPPLIERS',
        requiredRole: ['compras_admin'],
        description: 'Super Usuario Compras extiende enviando a más proveedores',
      },
    },
    cancellationPolicy: {
      allowed: false,
      reason: 'Proceso ya vencido, solo puede cerrar o extender',
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

#### 3.5.1 Camino A: Usuario Base (Requiere aprobaciones)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                 FLUJO COMPLETO - USUARIO BASE (Con aprobaciones)                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

Día 0                                           
  │                                              
  │  ┌─────────────────────────────────────┐    
  │  │ 1. Usuario Base Indust. crea RFQ    │    
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
  │  │ 2. Usuario Base envía para aprobar  │    
  │  │    → Estado: PENDING_INTERNAL_APPR. │    
  │  │    → 📧 Email a Super Usuario Ind.  │    
  │  └─────────────────────────────────────┘    
  │                                              
  ├───────────────── ¿Aprobado? ─────────────────┤
  │                                              │
  │  NO (Rechazado)                      SÍ (Aprobado)
  │  ┌─────────────────────┐       ┌─────────────────────┐
  │  │ → DRAFT (con        │       │ → PENDING           │
  │  │   comentarios)      │       │ → 📧 Email Compras  │
  │  │ → Usuario corrige   │       └─────────────────────┘
  │  │ → Vuelve a enviar   │              │
  │  └─────────────────────┘              │
  │            ↑                          │
  │            └──── loop ────────────────┤
  │                                       │
  ▼                                       ▼
Día 2                                           
  │  ┌─────────────────────────────────────┐    
  │  │ 3. Usuario Base Compras asigna      │    
  │  │    - Revisa sugerencias IA          │    
  │  │    - Selecciona 6 proveedores       │    
  │  │    → Estado: PEND_PURCHASING_APPR.  │    
  │  │    → 📧 Email a Super Usuario Comp. │    
  │  └─────────────────────────────────────┘    
  │                                              
  ├───────────────── ¿Aprobado? ─────────────────┤
  │                                              │
  │  NO (Rechazado)                      SÍ (Aprobado)
  │  ┌─────────────────────┐       ┌─────────────────────────┐
  │  │ → PENDING (para     │       │ → QUOTING               │
  │  │   reasignar)        │       │ → 📧 Email 6 PROVEEDORES│
  │  └─────────────────────┘       │ → ⏱️ Inicia plazo 10 días│
  │            ↑                   │ → 🔒 PUNTO DE NO RETORNO │
  │            └─ loop ────────────└─────────────────────────┘
  │                                       │
  ▼                                       ▼
                     [... continúa igual que el flujo normal ...]
```

#### 3.5.2 Camino B: Super Usuario (Sin aprobaciones)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DIRECTO - SUPER USUARIO (Sin aprobaciones)                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

Día 0                                           
  │                                              
  │  ┌─────────────────────────────────────┐    
  │  │ 1. Super Usuario Indust. crea RFQ   │    
  │  │    - Llena campos técnicos          │    
  │  │    - Sube PPT y STP                 │    
  │  │    - Guarda como BORRADOR           │    
  │  │    → Estado: DRAFT                  │    
  │  └─────────────────────────────────────┘    
  │                                              
  ▼                                              
Día 1                                           
  │  ┌─────────────────────────────────────┐    
  │  │ 2. Super Usuario envía DIRECTO      │    
  │  │    → Estado: PENDING                │  ← ¡Salta aprobación interna!
  │  │    → 📧 Email a COMPRAS             │    
  │  └─────────────────────────────────────┘    
  │                                              
  ▼                                              
Día 2                                           
  │  ┌─────────────────────────────────────┐    
  │  │ 3. Super Usuario Compras asigna     │    
  │  │    - Revisa sugerencias IA          │    
  │  │    - Selecciona 6 proveedores       │    
  │  │    → Estado: QUOTING                │  ← ¡Salta aprobación de compras!
  │  │    → 📧 Email a 6 PROVEEDORES       │    
  │  │    → ⏱️ Inicia plazo 10 días        │    
  │  │    → 🔒 PUNTO DE NO RETORNO         │    
  │  └─────────────────────────────────────┘    
  │                                              
  ▼                                              
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
| `DRAFT` → `PENDING_INTERNAL_APPROVAL` | Super Usuario Industrialización | Nueva RFQ pendiente de tu aprobación |
| `PENDING_INTERNAL_APPROVAL` → `DRAFT` (Rechazada) | Creador original | Tu RFQ fue rechazada: [Motivo]. Por favor corrige. |
| `PENDING_INTERNAL_APPROVAL` → `PENDING` (Aprobada) | Compras (todos) | Nueva RFQ aprobada, pendiente de asignación |
| `DRAFT` → `PENDING` (Super Usuario directo) | Compras (todos) | Nueva RFQ pendiente de asignación |
| `PENDING` → `PENDING_PURCHASING_APPROVAL` | Super Usuario Compras | Asignación de proveedores pendiente de tu aprobación |
| `PENDING_PURCHASING_APPROVAL` → `PENDING` (Rechazada) | Usuario que asignó | Asignación rechazada: [Motivo]. Reasigna proveedores. |
| `PENDING` / `PEND_PURCH_APPR` → `QUOTING` | Proveedores asignados | RFQ asignada, tienes 10 días para cotizar |
| `QUOTING` → `PARTIALLY_QUOTED` | Compras, Industrialización | Nueva cotización recibida de [Proveedor] |
| `PARTIALLY_QUOTED` → `BENCHMARK_READY` | Compras, Industrialización | Benchmark disponible para RFQ [ID] |
| Proveedor excluido (vencimiento) | Proveedor, Compras | Exclusión por vencimiento de plazo |
| `*` → `CANCELLED` | Todos los involucrados | RFQ cancelada: [Motivo] |

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
