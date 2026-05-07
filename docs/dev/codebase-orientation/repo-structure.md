# Repo Structure (Top-Level Map)

This is a monorepo for the `gsd` CLI plus its bundled resources (extensions, agents, skills), supporting SDK packages, native engine, web UI, and editor integrations.

## Top-Level Directories

| Path | What it contains | Notes / “go here when…” |
|------|------------------|--------------------------|
| `src/` | The `gsd` CLI wrapper around the Pi SDK | Loader/bootstrap (`src/loader.ts`), CLI (`src/cli.ts`), headless (`src/headless.ts`), MCP server wrapper (`src/mcp-server.ts`) |
| `src/resources/` | Bundled runtime resources synced into `~/.gsd/agent/` | Bundled extensions live in `src/resources/extensions/`; built artifacts are copied to `dist/resources/` during release builds |
| `src/resources/extensions/gsd/` | The core GSD extension | Auto-mode, workflow engine, DB facade, prompts, projections, worktree mgmt |
| `packages/` | Workspace packages (Pi SDK + GSD support libs) | See `docs/dev/codebase-orientation/workspace-packages.json` |
| `extensions/` | Workspace extensions published separately | Currently includes `extensions/google-search` (also bundled into `src/resources/extensions/google-search/`) |
| `native/` | Rust N-API engine implementation | Rust crates under `native/crates/`; TS surface is `packages/native/` |
| `web/` | Browser UI (web mode host + frontend) | Used by `gsd --web` after `scripts/stage-web-standalone.cjs` |
| `vscode-extension/` | VS Code extension for GSD | Chat participant + sidebar dashboard + RPC bridge |
| `studio/` | Electron desktop app | Packaged GUI app (separate from VS Code + web mode) |
| `docs/` | Main documentation (user + dev) | `docs/user-docs/` and `docs/dev/` are the primary sources |
| `mintlify-docs/`, `gitbook/` | Alternate doc-site sources | Publishing pipelines for docs sites |
| `scripts/` | Build, packaging, dev helpers | `scripts/dev-cli.js` is the source-mode TS runner |
| `tests/` | Integration/e2e/smoke harnesses | Unit tests also exist alongside sources (e.g. in packages) |
| `pkg/` | Pi “shim” package dir | Used for theme resolution and `piConfig` isolation (see `src/loader.ts`) |
| `gsd-orchestrator/` | Workflow skill + templates | Not the same thing as the runtime auto orchestrator; it’s a packaged “skill” bundle |

## “Where Do I Change…?”

- CLI startup behavior: `src/loader.ts`, `src/cli.ts`
- Bundled resources sync / versioning: `src/resource-loader.ts`
- Extension discovery/enablement: `src/extension-discovery.ts`, `src/extension-registry.ts`
- Core `/gsd` command surface: `src/resources/extensions/gsd/commands/`
- Auto-mode loop/dispatch: `src/resources/extensions/gsd/auto.ts`, `src/resources/extensions/gsd/auto-dispatch.ts`, `src/resources/extensions/gsd/auto/`
- DB schema/migrations + single-writer DB API: `src/resources/extensions/gsd/gsd-db.ts`, `src/resources/extensions/gsd/db-migration-steps.ts`
- Native engine: `native/` (Rust) + `packages/native/src/` (TS exports)
- Web mode lifecycle (spawn/stop/registry): `src/web-mode.ts`

