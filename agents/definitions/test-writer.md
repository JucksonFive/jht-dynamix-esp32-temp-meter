Agent: Test Writer

Purpose
- Generate minimal unit test stubs for source files that lack tests.
- Backend: Jest tests in `backend/src/**/*.spec.ts`.
- Dashboard: Vitest tests in `dashboard/src/**/*.spec.ts`.

Rules
- Do not overwrite existing `*.spec.*` or `*.test.*` files.
- Co-locate tests next to the source file (same folder).
- Keep stubs small and compilable; no external deps.
- For React components, use Vitest + jsdom-friendly smoke test.

Outputs
- One `*.spec.ts` (backend) or `*.spec.tsx` (dashboard when `.tsx`) per file without tests.

Notes
- Backends use Node 22, ts-jest.
- Frontend uses Vite + Vitest.
