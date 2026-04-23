# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BOCAR RFQ — a React + TypeScript frontend for managing Requests for Quote (RFQs) across three user roles: Industrialización, Compras (Purchasing), and Proveedor (Supplier).

## Commands

```bash
npm run dev      # Dev server at http://localhost:5173
npm run build    # Type-check (tsc -b) + Vite production build
npm run preview  # Preview production build
```

No test runner is configured. Build validation (`npm run build`) is the primary correctness check before PRs.

## Architecture

Feature-based structure under `src/`:

- **`app/`** — Providers, Router, and config. Route definitions live in `app/config/routes.ts` (the `ROUTES` constant). Add new routes here first.
- **`pages/`** — One folder per role area (`industrializacion/`, `purchasing/`, `rfq/`). Each page maps to a route.
- **`features/`** — Domain logic grouped by domain: `auth/`, `analytics/`, `rfq/`. Each feature owns its components, hooks, services, and types.
- **`layouts/`** — `MainLayout` (sidebar + header) and `AuthLayout` (two-panel login). Pages render inside these.
- **`shared/`** — Only code used across 2+ features: `components/ui/`, `utils/`.
- **`styles/`** — `themes/bocar.css` defines all brand CSS variables; `index.css` imports Tailwind.

Path aliases (use these instead of relative paths):
- `@` → `src/`
- `@app`, `@features`, `@pages`, `@layouts`, `@shared`

## Conventions

### TypeScript

- Strict mode is on. No `any`.
- Prefer `type` over `interface` for object shapes.
- Use `as const` for literal arrays/objects.
- New feature-specific types belong in that feature's `types.ts`; types shared across features go in `shared/types/`.

### Styling

- Tailwind utility classes only — no inline styles, no new CSS files except for global tokens.
- Brand colors are CSS variables in `src/styles/themes/bocar.css` (e.g., `--bocar-blue-100: #002e5d`). Reference them via `var()` or extend Tailwind config if needed.
- Card shadow: `shadow-[0px_8px_24px_#00000040]`; border radii: `rounded-lg` buttons, `rounded-xl` badges, `rounded-2xl` cards.

### Forms

React Hook Form + Zod. Validation schemas live in the feature folder (or `shared/schemas/` if reused). Form submission logic goes in a custom hook, not inside the component.

### Data

All data is currently hardcoded in service files (e.g., `analyticsService.ts`). There is no backend API integration yet. Mock data lives in `*Service.ts` files inside the relevant feature.

### Preview mode

The router supports `?screen=<screen-name>` query params for navigating to specific screens without auth, used for design review flows.

## Specs

`specs/` contains product documentation:
- `SCREENS_AND_FLOWS.md` — Wireflows and screen inventory
- `ARCHITECTURE_PROPOSAL.md` — Architecture decisions
- `VISUAL_BRIEFS.md` — Design briefs

Consult these when implementing new screens or features.
