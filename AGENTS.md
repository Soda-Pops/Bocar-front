# Repository Guidelines

## Project Structure & Module Organization
This is a Vite + React 18 + TypeScript frontend for the BOCAR RFQ dashboard. App entry starts at `src/main.tsx`, with app wiring under `src/app/` and route-level screens in `src/pages/`. Business features live in `src/features/` (`analytics`, `auth`, `rfq`), shared UI and utilities live in `src/shared/`, layouts in `src/layouts/`, theme styles in `src/styles/`, and images in `src/assets/`. Product notes and flow docs live in `specs/`. Treat `dist/` as generated output only.

## Build, Test, and Development Commands
Run `npm install` once on a clean machine.

- `npm run dev`: starts the Vite dev server for local UI work.
- `npm run build`: runs TypeScript project checks with `tsc -b` and creates the production bundle in `dist/`.
- `npm run preview`: serves the built app for a production-like smoke check.

Use `npm run build` before opening a PR, even for UI-only changes.

## Coding Style & Naming Conventions
Use strict TypeScript and React function components. Prefer `type` aliases for shared shapes. Keep 2-space indentation and organize long Tailwind class lists by layout, spacing, color, and state. Use PascalCase for components and files such as `RfqTabbedTable.tsx`, and `camelCase` for variables, props, and helpers. Keep feature-specific code inside its feature folder before adding to `src/shared/`.

## Testing Guidelines
There is no dedicated automated test runner yet. Validate changes with `npm run build`, then verify the affected screen in `npm run dev` or `npm run preview`. For new UI flows or responsive changes, use Playwright MCP and save screenshots when the change is visually significant. If tests are added later, place them beside the component as `*.test.tsx` or under `src/__tests__/`.
-Always Use Playwright MCP to test the UI IMPORTANT

## Commit & Pull Request Guidelines
Use short imperative commit subjects, for example `Add RFQ status filters` or `Refine login layout spacing`. Keep each commit focused on one change set. Pull requests should include a concise summary, affected screens or modules, linked tasks or issues, and screenshots for visible UI updates.

## Configuration & Asset Notes
Keep Tailwind content paths aligned with `index.html` and `src/**/*.{ts,tsx}`. Do not edit `dist/` manually. Store reusable images under `src/assets/` and keep environment-dependent settings centralized in `src/app/config/`.
