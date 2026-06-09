# Reporte Tecnico del Frontend

## Resumen

El frontend del sistema BOCAR es una aplicacion web desarrollada con React, TypeScript y Vite. Su funcion principal es servir como interfaz de operacion para los roles de Industrializacion, Compras y Proveedor dentro del flujo de RFQs. La aplicacion permite iniciar sesion, redirigir al usuario segun su rol, crear y editar RFQs, consultar dashboards, asignar proveedores, revisar detalles de RFQs y responder cotizaciones.

El desarrollo del frontend se organizo por dominios funcionales, separando autenticacion, RFQs, dashboards, compras, proveedor, layouts, componentes compartidos, servicios HTTP y utilidades. Esta estructura facilita la mantenibilidad, la reutilizacion de componentes y la integracion con los endpoints del backend.

## Introduccion

El sistema requiere una interfaz clara para administrar el ciclo de vida de una RFQ desde su creacion hasta su cotizacion y seguimiento. El frontend cumple ese papel conectando las acciones del usuario con los servicios del backend mediante peticiones HTTP autenticadas.

La aplicacion esta orientada a usuarios internos y externos. Por ello, el frontend incorpora control de acceso por rol, rutas protegidas, formularios estructurados, tablas operativas, estados visuales, carga de archivos y validaciones de datos antes de enviar informacion al servidor.

## Objetivos del Sistema

- Proporcionar una interfaz web para gestionar RFQs de moldes y trimming.
- Permitir que Industrializacion cree, edite, consulte y envie RFQs.
- Permitir que Compras visualice RFQs enviadas, asigne proveedores y revise el avance de cotizaciones.
- Permitir que Proveedores consulten RFQs asignadas y respondan cotizaciones.
- Proteger las rutas segun rol y permisos administrativos.
- Consumir datos reales del backend mediante servicios HTTP tipados.
- Mantener una experiencia visual consistente con la identidad BOCAR.
- Reducir errores de captura mediante formularios, validaciones y estados visuales.

## Requisitos del Sistema

### Requisitos Funcionales

- Inicio de sesion con email y password.
- Redireccion automatica al dashboard correspondiente segun rol.
- Proteccion de rutas para usuarios no autenticados.
- Restriccion de pantallas por rol: Industrializacion, Compras y Proveedor.
- Creacion de RFQs de tipo Mold y Trimming.
- Edicion y visualizacion de RFQs.
- Carga de archivos asociados a RFQs.
- Envio de RFQs de Industrializacion a Compras.
- Listado de RFQs en dashboards operativos.
- Visualizacion de metricas y grafica mensual de RFQs.
- Asignacion de proveedores desde Compras.
- Visualizacion de detalle completo de RFQs.
- Respuesta de cotizaciones por parte de proveedores.
- Manejo de estados de carga, error y exito en consultas al backend.

### Requisitos No Funcionales

- La aplicacion debe ser mantenible y modular.
- El codigo debe estar tipado con TypeScript.
- Las respuestas del backend deben validarse con esquemas.
- La interfaz debe ser responsiva para vistas desktop y mobile.
- Los componentes deben reutilizarse cuando compartan comportamiento.
- Las peticiones HTTP deben enviar credenciales de sesion.
- La aplicacion debe compilar correctamente antes de desplegarse.
- El sistema visual debe conservar consistencia de colores, tipografias, tablas, botones y tarjetas.

### Requisitos Tecnicos

- Node.js y npm para instalar dependencias y ejecutar scripts.
- React 18 como libreria principal de UI.
- TypeScript para tipado estatico.
- Vite como herramienta de desarrollo y build.
- React Router DOM para enrutamiento.
- React Hook Form para formularios.
- Zod para validacion de esquemas y DTOs.
- Tailwind CSS para estilos utilitarios.
- Playwright como apoyo para validacion visual y flujos en navegador.

## Arquitectura del Sistema

El frontend sigue una arquitectura modular basada en carpetas por responsabilidad. La aplicacion inicia en `src/main.tsx`, monta el componente `App` y envuelve el arbol con proveedores globales en `AppProviders`.

La arquitectura principal se divide asi:

- `app`: configuracion general, rutas, providers, permisos y variables de entorno.
- `features`: modulos funcionales del sistema, como autenticacion, RFQ, compras, proveedor y analytics.
- `pages`: pantallas completas que componen layouts, hooks y componentes de dominio.
- `layouts`: estructura visual comun, encabezados, sidebar y menu de usuario.
- `shared`: componentes, hooks, cliente HTTP, errores y utilidades reutilizables.
- `styles`: estilos globales y tema BOCAR.
- `assets`: imagenes y recursos visuales.

El flujo general es:

1. El usuario abre la aplicacion.
2. `AuthProvider` consulta la sesion actual.
3. `Router` decide si muestra login, dashboard o pagina no autorizada.
4. La pantalla consume hooks de dominio.
5. Los hooks llaman servicios HTTP.
6. Los servicios validan DTOs con Zod y mapean datos a modelos de UI.
7. Los componentes renderizan tablas, formularios, graficas y estados de interaccion.

## Diseno de los Modulos

### Modulo de Autenticacion

Ubicacion principal: `src/features/auth`.

Responsabilidades:

- Validar formulario de login.
- Consumir endpoints de login, logout, refresh y usuario actual.
- Guardar estado autenticado, anonimo o inicializando.
- Mapear el rol del backend al rol usado por el frontend.
- Redirigir al usuario a su home correspondiente.
- Proteger rutas mediante `ProtectedRoute`.

### Modulo de RFQ

Ubicacion principal: `src/features/rfq`.

Responsabilidades:

- Definir formularios de RFQ para Mold y Trimming.
- Convertir valores de formulario a `FormData`.
- Consultar listados y detalles de RFQs.
- Mapear DTOs del backend a estructuras visuales.
- Manejar estados de RFQ como Draft, Pending, Quoting, Closed o Cancelled.
- Renderizar detalle, acciones, banners, status badges y workspace de formulario.

### Modulo de Compras

Ubicacion principal: `src/features/purchasing` y `src/pages/purchasing`.

Responsabilidades:

- Consultar RFQs visibles para Compras.
- Mostrar dashboard operativo de asignacion.
- Filtrar por tipo, fecha limite, creador y busqueda.
- Asignar proveedores a RFQs.
- Mostrar solicitudes, benchmark y vistas administrativas.
- Evitar renderizar borradores de Industrializacion en el dashboard de Compras.

### Modulo de Proveedor

Ubicacion principal: `src/features/supplier` y `src/pages/proveedor`.

Responsabilidades:

- Consultar asignaciones del proveedor.
- Mostrar dashboard del proveedor.
- Permitir responder cotizaciones.
- Mapear datos de asignaciones y formularios de cotizacion.

### Modulo de Analytics

Ubicacion principal: `src/features/analytics`.

Responsabilidades:

- Renderizar metricas de dashboard.
- Renderizar grafica mensual de RFQs.
- Transformar el histograma del backend en puntos de grafica.
- Proveer filtros, buscadores, tarjetas KPI y componentes compartidos de dashboard.

### Modulo Compartido

Ubicacion principal: `src/shared`.

Responsabilidades:

- Cliente HTTP centralizado.
- Manejo de errores HTTP, red y parseo.
- Hooks genericos como `useResource` y `useMutation`.
- Componentes reutilizables como botones, upload de archivos, paginacion y menus de accion.
- Utilidades para fechas, deadlines e IDs de RFQ.

## Diseno de Interfaces y Algoritmos

### Interfaces de Usuario

El frontend usa interfaces enfocadas en operacion diaria:

- Login con formulario simple y validacion.
- Dashboard de Industrializacion con metricas, grafica mensual, filtros y tabla de RFQs.
- Dashboard de Compras con tarjetas KPI, grafica mensual, filtros, tabla de RFQs y acciones.
- Dashboard de Proveedor con RFQs asignadas y accesos a cotizacion.
- Formularios largos de RFQ con secciones, carga de archivos y acciones de guardado/envio.
- Vista de detalle de RFQ con informacion general, archivos, estado y acciones disponibles.

### Interfaces de Datos

Las respuestas del backend se validan mediante DTOs con Zod. Esto permite detectar diferencias entre el contrato esperado por el frontend y la respuesta real del backend.

Ejemplos de interfaces logicas:

- Usuario autenticado.
- RFQ de Industrializacion.
- RFQ de Comercializacion.
- Detalle de RFQ.
- Datos de dashboard.
- Histograma mensual.
- Asignaciones de proveedor.
- Formularios de RFQ y cotizacion.

### Algoritmo de Proteccion de Rutas

1. Leer estado de autenticacion.
2. Si esta inicializando, mostrar pantalla de verificacion.
3. Si el usuario es anonimo, redirigir al login.
4. Si la ruta exige rol y el usuario no lo tiene, redirigir a no autorizado.
5. Si la ruta exige admin y el usuario no es admin, redirigir a no autorizado.
6. Si cumple reglas, renderizar la pantalla.

### Algoritmo de Carga de Recursos

1. Un hook de pagina llama `useResource`.
2. `useResource` ejecuta una funcion asincrona con `AbortSignal`.
3. El servicio HTTP hace la peticion al backend.
4. La respuesta se valida con Zod.
5. Si es valida, se mapea a modelo de UI.
6. La pantalla renderiza carga, error o datos.

### Algoritmo de Mapeo de Estados RFQ

1. Leer `status`, `complete`, `logical_delete`, progreso y fecha limite.
2. Si `logical_delete` es verdadero, mostrar estado cancelado.
3. Si `complete` es verdadero, mostrar cerrado.
4. Si el backend envia `En_Ind`, mapear a Draft.
5. Si envia `En_Com`, mapear a Pending.
6. Si envia `En_Pro`, mapear a Quoting, Partially Quoted, Expired o Benchmark Ready segun progreso y deadline.

### Algoritmo de Grafica Mensual

1. Consumir el endpoint de conteo global de RFQs.
2. Leer el objeto `histograma`.
3. Ordenar meses de January a December.
4. Convertir nombres largos a etiquetas cortas: Jan, Feb, Mar, etc.
5. Generar puntos `ChartPoint`.
6. Calcular el valor maximo para escalar la linea SVG.
7. Renderizar linea, puntos y etiquetas mensuales.

## Problemas que Tuvieron y Pruebas de Software

### Problemas Identificados

- El dashboard de Compras llego a mostrar RFQs en Draft porque el endpoint de Comercializacion no filtraba por estado y devolvia tambien RFQs `En_Ind`.
- La grafica mensual estaba inicialmente hardcodeada y no usaba el histograma real del backend.
- El DTO del dashboard esperaba algunos valores como numeros planos, pero el backend respondia objetos con totales por tipo.
- Durante pruebas locales aparecieron diferencias entre `localhost` y `127.0.0.1` al trabajar con cookies de autenticacion.
- En formularios largos, la validacion de archivos y estados de submit requiere especial cuidado para no mostrar errores obsoletos despues de agregar archivos.

### Pruebas Realizadas

- Compilacion del frontend con `npm run build`.
- Validacion de rutas protegidas mediante inicio de sesion con usuarios de distintos roles.
- Pruebas visuales en navegador con Playwright para confirmar dashboards y graficas.
- Pruebas de consumo HTTP para verificar que los endpoints regresen datos esperados.
- Validacion del dashboard de Compras para asegurar que no renderice RFQs Draft.
- Validacion de la grafica mensual para confirmar que renderice datos reales del histograma.
- Revision de estados de carga, error y exito en pantallas principales.

### Resultado de Pruebas

El frontend compila correctamente y las pantallas principales renderizan datos reales desde el backend. Se corrigieron inconsistencias de contrato entre frontend y backend, y se agregaron filtros defensivos en el frontend para evitar que Compras muestre borradores que pertenecen al flujo de Industrializacion.

## Recomendaciones

- Mantener los DTOs sincronizados con la documentacion real del backend.
- Agregar pruebas automatizadas de componentes criticos como login, rutas protegidas, dashboard y formularios RFQ.
- Implementar pruebas end-to-end para los flujos completos de Industrializacion, Compras y Proveedor.
- Evitar datos hardcodeados en dashboards cuando exista un endpoint disponible.
- Centralizar reglas de visibilidad por estado para no duplicarlas entre pantallas.
- Documentar los contratos esperados de cada endpoint consumido por el frontend.
- Agregar estados vacios mas especificos para tablas sin datos.
- Considerar code splitting para reducir el tamano del bundle principal.
- Mantener validaciones de formulario alineadas con las reglas del backend.

## Conclusiones

El frontend del sistema BOCAR cumple una funcion central dentro del flujo de RFQs al permitir que cada rol opere sus tareas desde una interfaz web especializada. La arquitectura modular facilita separar responsabilidades, reutilizar componentes y mantener control sobre rutas, permisos, formularios y servicios.

El uso de TypeScript, Zod, React Hook Form y un cliente HTTP centralizado ayuda a reducir errores comunes de integracion. Aun asi, el proyecto depende de que los contratos del backend se mantengan claros y actualizados, especialmente en endpoints que manejan estados de RFQ y permisos.

Como resultado, el frontend ofrece una base solida para continuar ampliando funcionalidades, mejorar pruebas automatizadas y consolidar una experiencia operativa estable para Industrializacion, Compras y Proveedores.

## Siglas, Acronimos y Glosario

- API: Application Programming Interface. Conjunto de endpoints usados para comunicacion entre frontend y backend.
- DTO: Data Transfer Object. Estructura usada para representar datos recibidos o enviados al backend.
- RFQ: Request for Quotation. Solicitud de cotizacion.
- UI: User Interface. Interfaz de usuario.
- UX: User Experience. Experiencia de usuario.
- SPA: Single Page Application. Aplicacion web que navega sin recargar completamente la pagina.
- Vite: Herramienta de desarrollo y empaquetado para aplicaciones frontend.
- React: Libreria de JavaScript para construir interfaces de usuario.
- TypeScript: Superset de JavaScript con tipado estatico.
- Zod: Libreria para validacion de esquemas.
- React Hook Form: Libreria para manejo de formularios en React.
- Tailwind CSS: Framework de estilos utilitarios.
- Playwright: Herramienta para automatizar pruebas en navegador.
- Draft: Estado visual para RFQs que aun estan en Industrializacion.
- Pending: Estado visual para RFQs enviadas a Compras y pendientes de asignacion.
- Quoting: Estado visual para RFQs enviadas a proveedores.
- Benchmark: Comparacion de cotizaciones recibidas.

## Referencias

- Documentacion oficial de React: https://react.dev/
- Documentacion oficial de TypeScript: https://www.typescriptlang.org/docs/
- Documentacion oficial de Vite: https://vite.dev/
- Documentacion oficial de React Router: https://reactrouter.com/
- Documentacion oficial de React Hook Form: https://react-hook-form.com/
- Documentacion oficial de Zod: https://zod.dev/
- Documentacion oficial de Tailwind CSS: https://tailwindcss.com/docs
- Documentacion oficial de Playwright: https://playwright.dev/
- Codigo fuente del frontend BOCAR: `Bocar-front/src`
- Configuracion de rutas del frontend: `Bocar-front/src/app/config/routes.ts`
- Cliente HTTP del frontend: `Bocar-front/src/shared/http/httpClient.ts`
