# Entrypoints & Runtime Modes

This codebase has two layers of “entrypoints”:

1) **npm binaries** (what users execute), and  
2) **mode routers** (what the CLI does after parsing args).

## Published Binaries (root `package.json`)

- `gsd`, `gsd-cli` → `dist/loader.js` (compiled from `src/loader.ts`)
- `gsd-pi` → `scripts/install.js` (postinstall bootstrap for managed resources / native bits)

Related workspace binaries:

- `gsd-daemon` → `packages/daemon/dist/cli.js`
- `gsd-mcp-server` → `packages/mcp-server/dist/cli.js`

## Main JS/TS Entrypoints

### Startup loader (fast path + env bootstrap)

- `src/loader.ts`
  - Prints `--version`/`--help` without importing the heavy Pi bundles
  - Sets process env used by Pi (`PI_PACKAGE_DIR`) and by GSD (`GSD_*`)
  - Discovers bundled extensions and sets `GSD_BUNDLED_EXTENSION_PATHS`
  - Ensures linkable workspace packages exist in `node_modules/` (important for `npx --ignore-scripts`)
  - Then imports `src/cli.ts`

### CLI router + mode selection

- `src/cli.ts`
  - Parses args (`--print`, `--mode`, `--web`, subcommands like `graph`, `headless`, `update`, etc.)
  - Boots managed tools/resources (`src/resource-loader.ts`, `src/tool-bootstrap.ts`)
  - Loads extensions and starts the Pi runtime (interactive / print / rpc / mcp / text)

### Headless orchestrator

- `src/headless.ts`
  - Implements `gsd headless ...`
  - Spawns a child process in RPC mode, auto-responds to extension UI requests, streams progress to stderr

### MCP server mode (in-process wrapper)

- `src/mcp-server.ts`
  - Runs an MCP server over stdin/stdout for the *current session’s* tool registry
  - Distinct from the standalone package `packages/mcp-server/` (which exposes GSD workflow/project tools)

## Modes (What They Mean)

GSD is built on the Pi runtime, and exposes several modes depending on TTY and flags:

- **Interactive (default)**: TUI + live tool rendering (requires TTY)
- **Print (`--print`)**: single-shot prompt execution
- **Text (`--mode text`)**: plain-text output mode (no TUI)
- **RPC (`--mode rpc`)**: JSON-RPC over stdin/stdout for embedding
- **MCP (`--mode mcp`)**: MCP server over stdin/stdout (session tool surface)
- **Web (`--web`)**: spawns/serves the Next.js host and opens a browser (see `src/web-mode.ts`)
- **Headless (`headless`)**: higher-level, multi-turn orchestration by supervising an RPC child (`src/headless.ts`)

## Environment Variables Worth Knowing

These are set very early in `src/loader.ts` and shape runtime behavior:

- `PI_PACKAGE_DIR`: points Pi at `pkg/` (theme + piConfig shim)
- `GSD_HOME`: overrides `~/.gsd` (see `src/app-paths.ts`)
- `GSD_VERSION`: version stamp for UI + resource sync logic
- `GSD_PKG_ROOT`: absolute path to the installed `gsd-pi` package root (used by deployed extensions)
- `GSD_WORKFLOW_PATH`: points at the bundled `GSD-WORKFLOW.md`
- `GSD_BUNDLED_EXTENSION_PATHS`: resolved entrypoints that will be loaded/synced
- `GSD_BIN_PATH` / `GSD_CLI_PATH`: used when GSD needs to spawn itself (subagents, parallel workers)

