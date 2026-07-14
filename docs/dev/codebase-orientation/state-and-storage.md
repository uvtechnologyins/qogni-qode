# State & Storage (Global + Per-Project)

GSD keeps two distinct categories of persisted state:

- **Global (per user/machine)** under `~/.gsd/` (or `$GSD_HOME`)
- **Per-project** under `<project>/.gsd/`

The important design point is that **runtime state is DB-authoritative**, and many Markdown files are *projections* generated from DB state for human readability and git-friendly diffs.

## Global State (`~/.gsd/`)

Defined in `src/app-paths.ts`:

- `~/.gsd/agent/`
  - Synced **managed resources**: bundled extensions, agents, skills, themes, prompts, etc.
  - Credentials: `~/.gsd/agent/auth.json`
- `~/.gsd/sessions/`
  - Pi session store (branching transcripts / session metadata)
- `~/.gsd/extensions/registry.json`
  - Extension enable/disable registry (missing = enabled-by-default)
- `~/.gsd/web-instances.json`, `~/.gsd/web-server.pid`
  - Web mode instance registry + legacy PID file (see `src/web-mode.ts`)

### Managed resource syncing

On startup, GSD syncs bundled resources from `dist/resources/` (preferred) or `src/resources/` into `~/.gsd/agent/`:

- Sync logic: `src/resource-loader.ts`
- Version/fingerprint tracking: `managed-resources.json`, `.managed-resources-content-hash`

This is intentionally **always-overwrite** so `npm update -g gsd-pi` takes effect immediately.

## Per-Project State (`<project>/.gsd/`)

This is the *project runtime database + projections* used by the GSD extension:

- `.<project>/.gsd/gsd.db`
  - SQLite DB containing milestones, slices, tasks, requirements, decisions, gates, coordination state, memories, etc.
- `.<project>/.gsd/STATE.md`, `PROJECT.md`, `REQUIREMENTS.md`
  - Human-readable projections; auto-mode reads them, but DB is the source of truth
- `.<project>/.gsd/milestones/<MID>/...`
  - Milestone artifacts like `ROADMAP.md`, `SUMMARY.md`, `CONTEXT.md`, slice/task files, etc.
- `.<project>/.gsd/worktrees/<MID>/...`
  - Worktree directories when isolation mode uses git worktrees

### DB authoritativeness and projections

- State derivation (DB-first with explicit legacy markdown fallback): `src/resources/extensions/gsd/state.ts`
- DB facade + schema + migrations: `src/resources/extensions/gsd/gsd-db.ts`
- Schema migrations: `src/resources/extensions/gsd/db-migration-steps.ts`

### Single-writer invariant (important)

Only `src/resources/extensions/gsd/gsd-db.ts` should issue write SQL against `.gsd/gsd.db`.

Direct DB access via `sqlite3` / `better-sqlite3` / `sql.js` is treated as unsafe because the engine owns a single-writer WAL connection.

Guardrails:

- Write interception / blocked patterns: `src/resources/extensions/gsd/write-intercept.ts`
- Tooling for safe checkpointing before git staging: `src/resources/extensions/gsd/bootstrap/query-tools.ts` (e.g. `gsd_checkpoint_db`)

### DB provider fallback chain

GSD prefers built-in Node SQLite when available:

- Provider loader: `src/resources/extensions/gsd/db-provider.ts`
  - `node:sqlite` → `better-sqlite3` fallback

