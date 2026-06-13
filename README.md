# **BOCAR FRONTEND**

## **Cómo ejecutar el proyecto**

> Versión rápida. La guía completa paso a paso está en [docs/guia-de-usuario.md](docs/guia-de-usuario.md).

```bash
# 1. Clonar y entrar al proyecto
git clone https://github.com/Soda-Pops/Bocar-front
cd Bocar-front

# 2. Instalar dependencias
npm install

# 3. Correr el servidor de desarrollo
npm run dev
```

El proyecto queda disponible en `http://localhost:5173`.

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Verifica tipos (TypeScript) y genera build de producción |
| `npm run preview` | Vista previa del build de producción |

---

## **Avisos importantes**

> [!NOTE]
>
> El frontend consume la API del backend Django (`Bocar-django`). Para que la autenticación y los flujos de datos funcionen, el backend debe estar corriendo en `http://localhost:8000`.

> [!IMPORTANT]
>
> Los usuarios internos (Industrialización y Compras) se autentican mediante SSO corporativo. Los proveedores ingresan con usuario y contraseña proporcionados por BOCAR. Sin el backend activo, el login no completará el flujo.

> [!CAUTION]
>
> Al instalar dependencias, verificar el número de vulnerabilidades reportadas por npm. Ejecutar `npm audit fix` para resolver las automáticas y revisar manualmente las que requieran intervención manual.

---

## **Rutas de navegación del proyecto**

La aplicación es un SPA (Single Page Application). Todas las rutas son manejadas por React Router en el cliente.

### Entrada al sistema
[http://localhost:5173/](http://localhost:5173/)

### Dashboards por rol
| Rol | URL |
|-----|-----|
| Industrialización | http://localhost:5173/industrializacion/dashboard |
| Compras | http://localhost:5173/compras/dashboard |
| Proveedor | http://localhost:5173/proveedor/dashboard |

> [!IMPORTANT]
>
> Al recargar la página en producción el servidor debe redirigir todas las rutas a `index.html`. Sin esta configuración las rutas distintas a `/` devolverán 404. En desarrollo, Vite lo maneja automáticamente.

---

## **Documentación**

| Documento | Contenido |
|-----------|-----------|
| [docs/guia-de-usuario.md](docs/guia-de-usuario.md) | Guía paso a paso para instalar, ejecutar y operar el sistema |
| [docs/documentacion_tecnica.md](docs/documentacion_tecnica.md) | Arquitectura, módulos, stack con versiones, convenciones |
| [docs/flujo_completo.md](docs/flujo_completo.md) | Flujo de negocio end-to-end (RFQs, roles, estados) |
| [docs/flujo_industrializacion.md](docs/flujo_industrializacion.md) | Flujo detallado del área de Industrialización |
| [docs/flujo_compras.md](docs/flujo_compras.md) | Flujo detallado del área de Compras |
| [docs/flujo_proveedor.md](docs/flujo_proveedor.md) | Flujo detallado del área de Proveedor |
| [docs/plan_de_pruebas.md](docs/plan_de_pruebas.md) | Plan de pruebas manuales con 38 casos organizados por módulo |
| [docs/security.md](docs/security.md) | Medidas de seguridad implementadas, riesgos identificados y recomendaciones |
| [docs/historial.md](docs/historial.md) | Historial de versiones y cambios significativos |
