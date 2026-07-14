# Developer Getting Started (Day 1)

This guide is for developers working **on the GSD-2 codebase itself** (not just installing `gsd-pi` from npm).

GSD-2 is a multi-surface product:
- CLI/TUI + “modes” live at the repo root (`src/`, `packages/*`)
- Web UI lives in `web/` (Next.js)
- VS Code extension lives in `vscode-extension/`
- Native performance modules live in `native/` (Rust N-API)

If you haven’t yet, read:
- `onboarding/repo-scan.md`
- `onboarding/architecture.md`
- `onboarding/dependency-audit.md`

---

## Quickstart (10 minutes)

```bash
git clone https://github.com/gsd-build/gsd-2.git
cd gsd-2
npm ci
npm run secret-scan:install-hook
export ANTHROPIC_API_KEY="sk-ant-..."
npm run gsd -- --version
npm run gsd
```

If you plan to run tests or `npm run typecheck:extensions`, build the workspace packages once first:

```bash
npm run build:core
```

## 1) Prerequisites

### Required

- **Node.js**: `>=22.0.0` (repo enforces this via `package.json#engines` + `engine-strict=true` in `.npmrc`). Recommended: Node 24 LTS.
- **npm**: `10.9.3` (repo pins via `package.json#packageManager`).
- **git**: required at runtime (startup checks + heavy worktree usage).

### Optional (only if you touch these areas)

- **Rust**: stable `>=1.70` (for `native/` builds) + a working C/C++ toolchain for your OS.
- **Docker Desktop**: `4.58+` (for the Docker sandbox workflow in `docker/`).
- **VS Code**: `>=1.95.0` (to develop/test the extension).

### Provider credentials (you’ll need one)

Pick at least one supported LLM provider and set credentials:
- Most common: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- Full list and setup: `docs/user-docs/providers.md`

GSD can also store tool keys globally via `/gsd config` (writes `~/.gsd/agent/auth.json`): `docs/user-docs/configuration.md`.

---

## 2) Setup Steps

### 2.1 Clone

```bash
git clone https://github.com/gsd-build/gsd-2.git
cd gsd-2
```

### 2.2 Install root dependencies (required)

```bash
npm ci
```

Why `npm ci` matters in this repo:
- It installs dependencies exactly from `package-lock.json`.
- It wires up workspace symlinks for `packages/*` and `extensions/*` (see `CONTRIBUTING.md`).

### 2.3 Install pre-commit hooks (recommended)

```bash
npm run secret-scan:install-hook
```

### 2.4 Install app-specific deps (only if needed)

The repo has separate apps with their own dependency trees:

```bash
# Web UI (Next.js)
npm --prefix web ci

# VS Code extension
npm --prefix vscode-extension ci

# Electron studio (no lockfile in this repo)
npm --prefix studio install
```

### 2.5 First-run state (“seed data”)

GSD is “local-first” and will create state directories on first run:
- Global: `~/.gsd/` (managed agent resources, extensions, auth, bins)
- Per-project: `<project>/.gsd/` (SQLite DB + rendered markdown projections)

To seed these locally, run the dev CLI once (see next section). You don’t need a separate seed script.

---

## 3) Running The Application

### 3.1 Build

```bash
npm run build
```

This builds:
- workspace packages in `packages/*`
- the root CLI (`src/*` → `dist/`)
- bundled resources/themes/export-html assets copied via `scripts/copy-*.cjs`
- the staged web host when needed (`scripts/build-web-if-stale.cjs`)

### 3.2 Run the CLI from source (dev wrapper)

Run the local source-mode CLI via the repo script (spawns `src/loader.ts` with Node type-stripping):

```bash
# Show help/version without needing a full TUI session
npm run gsd -- --version
npm run gsd -- --help

# Start an interactive session in the current directory
export ANTHROPIC_API_KEY="sk-ant-..."
npm run gsd
```

The wrapper is `scripts/dev-cli.js`. It sets `GSD_DEV_CLI_PATH` so **child GSD processes** (subagents, workers, workflow MCP) re-enter through the same wrapper during development.

### 3.3 Watch mode (TypeScript + resources)

```bash
npm run dev
```

This runs `tsc --watch` plus a resources watcher (see `scripts/dev.js`).

### 3.4 Web UI

Two common workflows:

1) **Run GSD’s web mode from the repo** (builds/stages what it needs):
```bash
npm run gsd:web
```

2) **Run the Next.js app directly** (for UI work):
```bash
npm run build:contracts
npm --prefix web ci
npm --prefix web run dev
```

Default URL: `http://localhost:3000` (see `docs/user-docs/web-interface.md`).

Windows note: `scripts/build-web-if-stale.cjs` skips building the staged web host on Windows due to Next.js webpack `EPERM` issues; the CLI remains functional.

### 3.5 Tests

Primary commands (root):

```bash
npm run build:core       # required once after clone/pull (see note below)
npm test              # unit + integration + package tests
npm run test:unit      # compiles to dist-test/ then runs node --test
npm run test:integration
npm run test:packages
```

Useful subsets:

```bash
npm run verify:pr      # build:core → typecheck:extensions → test:unit
npm run test:smoke
npm run test:e2e
```

Notes:
- Tests primarily use Node’s built-in runner (`node --test`).
- Many unit tests run from compiled artifacts under `dist-test/` (see `scripts/compile-tests.mjs` and the `test:unit:compiled` script in `package.json`).
- `npm test` runs `npm run typecheck:extensions` first (`package.json#scripts.pretest`). That typecheck expects workspace package type declarations under `packages/*/dist/*.d.ts`, which are produced by `npm run build:core` (not just `build:pi`).
- Some `web/`-focused integration tests are skipped unless `web/` dependencies are installed (`npm --prefix web ci`).

### 3.6 Linting / typechecking

At repo root:

```bash
npm run typecheck:extensions
```

For the web app:

```bash
npm --prefix web run lint
```

---

## 4) Project Structure Guide

### “Read first” files

- `src/loader.ts` — runtime bootstrap, fast `--help/--version` path, env checks, resource sync.
- `src/cli.ts` — mode selection and CLI surface.
- `src/resource-loader.ts` — syncs bundled resources into `~/.gsd/agent` and drives reloads.
- `src/mcp-server.ts` — in-process MCP server mode (`gsd --mode mcp`).
- `packages/pi-coding-agent/src/core/agent-session.ts` — session wrapper around the agent loop + persistence + modes.
- `packages/pi-agent-core/src/agent.ts` and `packages/pi-agent-core/src/agent-loop.ts` — the core streaming/tool execution loop.
- `src/resources/extensions/gsd/**` — the bundled “gsd” extension that implements most workflow/state behavior.

### Where things live (high level)

- `src/`: root CLI and “product wrapper” behavior (resource sync, onboarding, modes).
- `packages/`: core libraries (agent core, AI providers, TUI, RPC, MCP server, daemon, contracts, native JS wrapper).
- `src/resources/extensions/`: bundled extensions shipped with the CLI.
- `extensions/`: workspace extensions developed in-repo (npm workspaces).
- `web/`: Next.js web UI + API routes.
- `vscode-extension/`: VS Code extension (spawns `gsd --mode rpc`).
- `studio/`: Electron app.
- `native/`: Rust workspace for the N-API engine.
- `tests/`: smoke/live/e2e runners.
- `scripts/`: build/test/release utilities (many npm scripts delegate here).

---

## 5) Architecture Overview (Simplified)

From `onboarding/architecture.md`:

- The **CLI** (`src/*`) bootstraps and launches a **coding agent session** (`@gsd/pi-coding-agent`).
- The session is powered by the **agent loop** (`@gsd/pi-agent-core`) and routes model calls through the **provider layer** (`@gsd/pi-ai`).
- Most “GSD workflow” behavior is an **extension** (bundled under `src/resources/extensions/gsd/`) with persistent state stored under:
  - `~/.gsd/` (global agent resources/config)
  - `<project>/.gsd/` (project DB + projections)
- Other surfaces (web, VS Code, MCP server, daemon) primarily **spawn or control sessions** via RPC/MCP and read the same on-disk state.

---

## 6) Common Tasks

### Add a feature

Preferred approach is extension-first (see `CONTRIBUTING.md`):
1. Decide whether it belongs in a bundled extension (`src/resources/extensions/<name>/`) or a workspace extension (`extensions/<name>/`).
2. Ensure the extension has an `extension-manifest.json` (required for bundled extensions).
3. Add/adjust commands/tools/hooks in the extension runtime.
4. Add tests (see below).

If you must change “core” behavior (agent loop, orchestration, auto-mode), expect an RFC/ADR bar (see `CONTRIBUTING.md` and `docs/dev/` ADRs).

### Fix a bug

1. Reproduce with `npm run gsd` (interactive) or the relevant test (`npm run test:unit` / `npm run test:integration` / `npm run test:e2e`).
2. Add a regression test in `src/tests/` or under the relevant extension’s `tests/` folder.
3. Run `npm run verify:pr` before pushing.

### Add a test

Most unit tests live under these patterns (so they’re picked up by `test:unit:compiled`):
- `src/tests/*.test.ts`
- `src/resources/extensions/**/tests/*.test.ts`

Then run:
```bash
npm run test:unit
```

For integration-style tests (run directly from TS with type stripping), use:
```bash
npm run test:integration
```

### Work on the native engine (Rust)

If you touch `native/` or `@gsd/native`:

```bash
npm run build:native:dev
npm run test:native

# Rust-only tests
cd native && cargo test
```

### Deploy / release

Releases are automated via GitHub Actions and repository scripts:
- Workflows: `.github/workflows/prod-release.yml`, `.github/workflows/next-publish.yml`, `.github/workflows/dev-publish.yml`
- Release scripts: `npm run release:bump`, `npm run release:update-changelog`, `npm run prepublishOnly`

If you’re new to the process, start by reading `docs/dev/ci-cd-pipeline.md` and inspecting the workflows above.

---

## 7) Gotchas & Tribal Knowledge

- **Node engine enforcement**: `.npmrc` has `engine-strict=true`; wrong Node versions will fail installs.
- **Use `npm ci`**: if you see `Cannot find module '@gsd/*'`, re-run `npm ci` to restore workspace wiring (see `CONTRIBUTING.md`).
- **Many TS2307/TS7006 errors when running tests/typecheck**: if `npm test` or `npm run typecheck:extensions` reports lots of `Cannot find module '@gsd/…'` / `Cannot find module '@gsd-build/…'` and `Parameter … implicitly has an 'any' type` inside `src/resources/extensions/**`, run `npm run build:core` to generate the workspace packages’ `dist/` (including `.d.ts`) and retry.
- **Oh My Zsh alias conflict**: some setups alias `gsd` to `git svn dcommit`; check `alias gsd` and `unalias gsd`, or run `gsd-cli` instead (`docs/user-docs/getting-started.md`).
- **Playwright download**: installing can pull Chromium; use `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` (or `npx gsd-pi --skip-chromium` for installer flows) when you don’t need browser tools.
- **Managed RTK binary**: GSD may install/manage `rtk`; disable with `GSD_RTK_DISABLED=1` (see `README.md` and `scripts/install.js`).
- **Windows web host**: staged web host builds are skipped on Windows; work on the Next app directly via `web/` if needed.
- **State is DB-authoritative**: `.gsd/gsd.db` is the source of truth; markdown under `.gsd/` is a rendered projection (see `README.md` and `docs/user-docs/troubleshooting.md`).
- **Resetting local state**: delete `<project>/.gsd/` to reset a single project; delete `~/.gsd/` to reset global agent state (this removes saved auth/config and managed resources).

---

## 8) Key Contacts & Resources

Project resources found in-repo:
- Docs index: `docs/README.md`
- Contributing guidelines: `CONTRIBUTING.md`
- Public Discord (community): linked in `README.md` (`https://discord.com/invite/nKXTsAcmbT`)
- GitHub issues: `https://github.com/gsd-build/gsd-2/issues`
- CI workflows: `.github/workflows/`
- User docs likely relevant during dev: `docs/user-docs/commands.md`, `docs/user-docs/configuration.md`, `docs/user-docs/troubleshooting.md`

Team-specific resources (Slack channels, dashboards, on-call rotation) are not defined in this repo; ask your onboarding buddy/manager for the current links and add them here once you have them.
