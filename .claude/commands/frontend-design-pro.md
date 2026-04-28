---
description: Diseña e implementa UI frontend enterprise de alta calidad para el dashboard BOCAR. Activa cuando crees o mejores páginas, dashboards, pantallas operativas, formularios o admin tools. Valida con Playwright en desktop y mobile.
---

# Frontend Design Pro

## Objetivo
Producir UI frontend distintiva, usable, accesible y lista para producción, con apariencia de sistema real de empresa seria y no de mockup generado por AI.

## Dirección visual base
- Diseñar con mentalidad de producto enterprise B2B.
- Priorizar claridad operativa, confianza, orden y control.
- Hacer que la interfaz se sienta institucional, no experimental.
- Evitar cualquier estética que parezca plantilla genérica, dashboard de Dribbble o landing inflada.
- Favorecer una dirección visual sobria, precisa y corporativa, cercana a sistemas de compras, industrialización, procurement, compliance o administración.

## Personalidad visual buscada
- Transmitir seriedad, estabilidad, trazabilidad y criterio de negocio.
- Hacer que el sistema se vea como una herramienta que una empresa grande usaría todos los días.
- Evitar señales visuales de "producto de startup juguetón".
- Evitar layouts recargados, gradientes llamativos, glassmorphism excesivo, sombras teatrales o colores de moda sin razón funcional.

## Tipografía
- Usar `Inter` como fuente principal por defecto para UI, tablas, formularios, dashboards y navegación.
- Aplicar `font-family: 'Inter', sans-serif;` y `font-style: normal;`.
- Mantener una jerarquía tipográfica clara y contenida.

## Paleta de color base

### Primarios
- `Blue 100`: `#002E5D`
- `Blue 90`: `#1F3A61`
- `Blue 70`: `#4E6484`
- `Blue 50`: `#7F8FA3`
- `Blue 30`: `#A7B1C2`

### Neutrales
- `White`: `#FFFFFF`
- `Light Gray`: `#F5F7FA`
- `Border`: `#D9DEE5`
- `Text`: `#1A1A1A`

### Status
- `Review`: `#FFF200`
- `Done`: `#8DC63F`
- `Error`: `#AA000F`
- `Neutral`: `#AEB3B8`

## Uso recomendado de color
- Usar `Blue 100` y `Blue 90` para navegación, banners institucionales, headers y CTAs principales.
- Usar `Blue 70`, `Blue 50` y `Blue 30` para jerarquías secundarias, texto auxiliar y badges.
- Usar `Light Gray` como fondo base de superficies limpias.
- Usar `Border` para divisores, inputs, tablas y estructura.
- Reservar colores de estado para semántica real, no para decoración.

## Reglas de diseño
- Evitar layouts genéricos y patrones de "AI slop".
- Elegir una dirección visual clara antes de escribir código.
- Definir variables CSS o tokens antes de estilizar.
- Añadir motion solo cuando mejore comprensión.
- No introducir dark mode ni gradientes agresivos salvo que el brief lo pida.
- Mantener densidad informativa alta pero legible en pantallas operativas.

## Principios de layout
- Favorecer layouts limpios, estructurados y de lectura clara.
- Usar grids y columnas con propósito, no mosaicos de tarjetas por inercia.
- Evitar carditis: no convertir cada bloque en una card si un layout abierto funciona mejor.
- Reservar las cards para interacciones reales o agrupaciones con borde semántico.
- Diseñar dashboards como workspaces operativos, no como collage de KPIs.

## Tono específico para este proyecto
- Diseñar como si el producto fuera usado por Compras, Industrialización, Proveedores y Super Usuarios dentro de una empresa automotriz o manufacturera grande.
- Hacer que el sistema inspire confianza para procesos auditables, aprobaciones y seguimiento.
- Evitar cualquier look "demo", "concept art" o "AI generated".

## Casos donde priorizar fidelidad visual
- Si hay screenshots, Figma o imágenes aprobadas, priorizar fidelidad visual por encima de reinterpretación creativa.
- Si el usuario pide "igual a la referencia", reproducir composición, spacing, proporciones, color y jerarquía con máxima precisión.

## Flujo de trabajo
1. Resumir objetivo, audiencia y tono visual.
2. Proponer una dirección estética concreta y seria.
3. Definir tokens, tipografía y jerarquía antes de estilizar.
4. Implementar con componentes reales y responsive.
5. Verificar accesibilidad básica.
6. Usar Playwright MCP para revisar desktop/mobile y corregir desviaciones visuales.
7. Si existe referencia aprobada, iterar hasta acercarse al diseño esperado con la mayor fidelidad posible.

## Validación con Playwright
Después de implementar cualquier cambio visual:
1. Asegurarse de que el dev server esté corriendo en `http://localhost:5173`.
2. Navegar a la pantalla modificada con `browser_navigate`.
3. Tomar screenshots en 1440px, 1024px, 768px y 390px usando `browser_resize` + `browser_take_screenshot`.
4. Confirmar estados hover, focus, empty, loading y error cuando existan.
5. Si hay screenshots o Figma de referencia, comparar y corregir padding, tamaño, alineación, tipografía, color y jerarquía.
6. Corregir cualquier desviación visual antes de reportar el trabajo como terminado.

## Señales de fracaso
- La interfaz parece dashboard genérico de IA.
- Hay demasiadas cards, bordes o sombras sin necesidad.
- La tipografía no transmite seriedad.
- Los colores se sienten arbitrarios o demasiado de moda.
- La pantalla parece landing comercial en lugar de sistema operativo de negocio.
- Los estados importantes no destacan.
- El layout se rompe o pierde jerarquía al cambiar de viewport.


# Validacion frontend con Playwright

## Regla general
Siempre validar cambios visuales con Playwright despues de implementar y despues de correr `npm run build`.

## Flujo que seguimos
1. Compilar el proyecto:

```bash
npm run build
```

2. Levantar preview local:

```bash
npm run preview -- --host 127.0.0.1 --port 4173
```

3. Abrir la ruta a validar en una sesion dedicada:

```bash
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4173/RUTA_A_VALIDAR --session ui-check
```

4. Validar obligatoriamente estos anchos:
- 1440px
- 1024px
- 768px
- 390px

5. Para cada ancho:
- Redimensionar viewport.
- Tomar screenshot.
- Revisar jerarquia visual, espaciados, overflow, cortes de texto, alineacion, sidebar, CTAs, formularios y tablas.

## Comandos base

### 1440
```bash
npx --yes --package @playwright/cli playwright-cli --session ui-check resize 1440 900
npx --yes --package @playwright/cli playwright-cli --session ui-check screenshot
```

### 1024
```bash
npx --yes --package @playwright/cli playwright-cli --session ui-check resize 1024 768
npx --yes --package @playwright/cli playwright-cli --session ui-check screenshot
```

### 768
```bash
npx --yes --package @playwright/cli playwright-cli --session ui-check resize 768 1024
npx --yes --package @playwright/cli playwright-cli --session ui-check screenshot
```

### 390
```bash
npx --yes --package @playwright/cli playwright-cli --session ui-check resize 390 844
npx --yes --package @playwright/cli playwright-cli --session ui-check screenshot
```

## Validacion extra en mobile
Si la pantalla es larga, hacer scroll y volver a capturar la parte baja para revisar inputs, tablas y footer actions:

```bash
npx --yes --package @playwright/cli playwright-cli --session ui-check eval "(window.scrollTo(0, 720), 'ok')"
npx --yes --package @playwright/cli playwright-cli --session ui-check screenshot
```

## Que revisar en cada viewport
- Que no haya overflow horizontal.
- Que no haya botones invisibles o sin texto.
- Que formularios apilen bien en tablet y mobile.
- Que sidebar, tabs o navegacion no se rompan.
- Que titulos, cards, badges y banners mantengan jerarquia.
- Que tablas o bloques anchos sigan siendo utilizables.
- Que los CTAs principales y secundarios sigan visibles y legibles.

## Si se corrige algo
Despues de cada ajuste:
- Volver a compilar.
- Recargar la sesion.
- Repetir screenshots en los anchos afectados.

```bash
npm run build
npx --yes --package @playwright/cli playwright-cli --session ui-check reload
```

## Criterio de cierre
No dar por terminada una pantalla hasta que:
- pase `npm run build`
- se revise en 1440, 1024, 768 y 390
- se confirme que desktop y mobile conservan la misma intencion visual
- no existan quiebres visibles de layout, texto o acciones
