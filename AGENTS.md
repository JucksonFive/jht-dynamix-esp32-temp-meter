# Repository Guidelines

## Project Structure & Module Organization
- `board/`: ESP32 firmware (PlatformIO). Source in `board/src`, LittleFS assets in `board/data`, and optional tests in `board/test`.
- `backend/`: AWS CDK app and Lambda code. Stacks live in `backend/cdk`, functions in `backend/lambdas`.
- `dashboard/`: React + Vite app in `dashboard/src` with static assets in `dashboard/public`.
- `homepage/`: Marketing site (React + Vite) in `homepage/src` with assets in `homepage/public`.
- `agents/`: Automation scripts and tests under `agents/tasks`.

## Build, Test, and Development Commands
- Install deps via workspace: `pnpm install` at repo root (preferred). If using npm, run `npm install` in `backend/`, `dashboard/`, and `homepage/`.
- Backend: `npm run build` compiles TypeScript; `npm run cdk deploy --all` deploys all stacks.
- Dashboard/Homepage: `npm run dev` starts Vite; `npm run build` creates production output; `npm run preview` serves the build.
- Firmware (from `board/`): use PlatformIO VS Code tasks (Build, Upload, Upload Filesystem Image, Monitor) or CLI equivalents like `pio run` and `pio run -t uploadfs`.
- Agents: `pytest -q` in `agents/tasks` runs agent tests.

## Coding Style & Naming Conventions
- TypeScript/React uses 2-space indentation and double quotes; keep components PascalCase (`App.tsx`) and utilities camelCase.
- Linting is via ESLint: `npm run lint` in `backend/` and `dashboard/`.
- Firmware follows existing Arduino/PlatformIO C++ style; config files (e.g., `mqtt.json`) live in `board/data`.

## Testing Guidelines
- Dashboard: Vitest + Testing Library (`npm run test` for coverage, `npm run test:watch` for watch mode); tests like `dashboard/src/App.test.tsx`.
- Backend: Jest + ts-jest (`npm run test`) with coverage enabled; tests are expected under `backend/src` per `jest.config.ts`.
- Agents: pytest tests live in `agents/tasks/tests` (files named `test_*.py`).
- Firmware: PlatformIO test runner can use `board/test` when adding MCU tests.

## Commit & Pull Request Guidelines
- Prefer Conventional Commits with prefixes like `feat:`, `fix:`, `refactor:`, `chore:`, and `test:`; keep subjects short and imperative.
- PRs should describe scope, list commands run, and include screenshots for UI changes in `dashboard/` or `homepage/`.
- Link related issues and call out AWS/CDK or environment variable changes.

## Configuration & Secrets
- Backend CDK reads root `.env` (e.g., `DOMAIN_NAME`, `SUBDOMAIN`, `AWS_REGION`); do not commit secrets.
- Dashboard uses `dashboard/.env.local` for Cognito/API settings.
- Homepage deployments expect a production build at `homepage/dist`.
