# Planes E2E RFQ — Indice y protocolo para agentes

Este paquete de archivos describe los flujos que deben probarse desde el frontend para validar el ciclo de vida general de una RFQ con backend real. Esta pensado para repartir trabajo entre agentes de IA: cada agente toma un flujo, lo ejecuta en navegador, revisa la red, documenta hallazgos y genera un reporte `.md`.

Archivo de referencia de estilo: `Bocar-front/specs/VERIFICACION_FLUJO_RFQ_NAVEGADOR.md`.

---

## Entorno base

1. Backend Django en `http://localhost:8000`.
   ```bash
   cd backend-bocar-2026
   .venv/Scripts/activate
   python manage.py runserver
   ```
2. Frontend Vite en `http://localhost:5173`.
   ```bash
   cd Bocar-front
   npm run dev
   ```
3. Frontend con `VITE_API_BASE_URL=http://localhost:8000`.
4. Probar desde navegador real o Playwright. Abrir Network antes de ejecutar acciones.
5. Cambiar de usuario con logout desde el menu del avatar, o limpiar cookies/incognito.

---

## Usuarios de prueba sugeridos

| Rol | Email | Password | Ruta esperada |
|-----|-------|----------|---------------|
| Industrializacion base | `ind_base@bocar.com` | `IndBase2026!` | `/industrializacion/dashboard` |
| Comercializacion base | `com_base@bocar.com` | `ComBase2026!` | `/compras/dashboard` |
| Proveedor | `test_pro@bocar.com` | `TestPro2026!` | `/proveedor/dashboard` |

Si un agente usa usuarios admin (`test_ind`, `test_com` u otros), debe reportarlo explicitamente porque puede caer en dashboards distintos.

---

## Flujos a repartir

| Archivo | Flujo | Resultado esperado |
|---------|-------|--------------------|
| `01_FLUJO_MOLD_COMPLETO_CIERRE.md` | Mold completo, un proveedor | `DRAFT -> PENDING -> QUOTING -> CLOSED` |
| `02_FLUJO_TRIMMING_COMPLETO_CIERRE.md` | Trimming completo, un proveedor | `DRAFT -> PENDING -> QUOTING -> CLOSED` |
| `03_FLUJO_BORRADOR_EDICION_RFQ.md` | Edicion de draft antes de enviar | PATCH de RFQ, archivos adjuntos, dashboard actualizado |
| `04_FLUJO_SOLICITUD_EDICION_APROBACION_RECHAZO.md` | Solicitud de edicion despues de enviar a Compras | Pendiente de aprobacion, aprobar/rechazar si UI lo expone |
| `05_FLUJO_ASIGNACION_MULTIPROVEEDOR_PROGRESO.md` | Varios proveedores, avance parcial y cierre | `0/N`, `X/N`, cierre al completar |
| `06_FLUJO_COTIZACION_PROVEEDOR_BORRADOR_ENVIO.md` | Ciclo del proveedor: detalle, borrador, actualizar, enviar | POST inicial sin 404, PATCH posterior, submit final |
| `07_FLUJO_DASHBOARDS_PERMISOS_Y_ESTADOS.md` | Dashboards por rol, permisos y estados | Acceso correcto, datos reales, CTAs correctas |

---

## Reglas obligatorias para todos los agentes

1. Ejecutar el flujo desde el frontend, no solo con API directa.
2. Revisar Network por cada accion relevante.
3. Anotar IDs reales: RFQ id, assignment id, tipo, proveedor, fechas usadas.
4. Distinguir entre:
   - **Bug bloqueante**: impide terminar el flujo.
   - **Bug funcional**: accion responde pero dato/estado queda mal.
   - **Ruido/observacion**: warning, 404 tolerado, texto confuso, loading raro.
   - **Gap conocido**: comportamiento no implementado aun o solo parcial.
5. Si se reconoce cualquier bug o falla durante la prueba E2E, reportarlo con evidencia: ruta, paso, request, status, payload/respuesta resumida, captura o descripcion visual.
6. Cada agente debe generar un reporte `.md` de sus hallazgos, aunque no encuentre bugs.

---

## Convencion para reportes generados por agentes

Guardar reportes en:

```text
Bocar-front/specs/e2e-rfq-flujos/reportes/
```

Nombre sugerido:

```text
REPORTE_<NN>_<FLUJO>_<AGENTE>_<YYYY-MM-DD>.md
```

Ejemplos:

```text
REPORTE_01_MOLD_COMPLETO_AGENT_A_2026-06-04.md
REPORTE_06_COTIZACION_PROVEEDOR_AGENT_B_2026-06-04.md
```

---

## Plantilla obligatoria del reporte

```md
# Reporte E2E — <nombre del flujo>

## Resumen
- Agente:
- Fecha:
- Ambiente:
- Frontend URL:
- Backend URL:
- Resultado: PASS / PASS CON OBSERVACIONES / FAIL

## Datos usados
- Usuario Industrializacion:
- Usuario Comercializacion:
- Usuario Proveedor:
- Tipo RFQ:
- RFQ id:
- Assignment id(s):
- Proveedor(es):
- Fechas usadas:

## Pasos ejecutados
| Paso | Resultado UI | Network esperado | Network observado | Estado |
|------|--------------|------------------|-------------------|--------|
| 1 | | | | PASS/FAIL |

## Bugs y fallas encontradas
| Severidad | Titulo | Paso | Evidencia | Reproducibilidad |
|-----------|--------|------|-----------|------------------|
| Bloqueante/Funcional/Ruido/Gap | | | | Siempre/Intermitente/Una vez |

## Capturas o evidencia adicional
- Screenshot:
- Logs relevantes:
- Requests relevantes:

## Decision final
- El flujo queda validado: Si/No
- Riesgo residual:
- Recomendacion siguiente:
```

