# Auto Mode & Workflow Engine (GSD Extension)

Most of “GSD behavior” lives in the bundled GSD extension at `src/resources/extensions/gsd/`. The top-level `src/` code primarily bootstraps the Pi runtime, syncs resources, and loads extensions.

## Command Surface → Engine Entry

- `/gsd` command registration: `src/resources/extensions/gsd/index.ts`
- Command dispatch/router: `src/resources/extensions/gsd/commands/dispatcher.ts`
- Auto command handler: `src/resources/extensions/gsd/commands/handlers/auto.ts`
  - Starts auto-mode via `startAutoDetached(...)` exported from `src/resources/extensions/gsd/auto.ts`

## Core Auto-Mode Modules

These are the files you usually end up reading when working on auto-mode:

- Auto loop orchestrator: `src/resources/extensions/gsd/auto.ts`
  - “Fresh session per unit” model; owns lifecycle glue, locking, and high-level flow
- Fresh-start bootstrap (git/worktree/db/prefs): `src/resources/extensions/gsd/auto-start.ts`
- Declarative dispatch decision table: `src/resources/extensions/gsd/auto-dispatch.ts`
- Prompt builders for each unit type: `src/resources/extensions/gsd/auto-prompts.ts`
- Worktree lifecycle + isolation: `src/resources/extensions/gsd/auto-worktree.ts`
- Post-unit processing + verification gates: `src/resources/extensions/gsd/auto-post-unit.ts`, `src/resources/extensions/gsd/auto-verification.ts`
- Recovery & stuck-loop handling: `src/resources/extensions/gsd/auto-recovery.ts`, `src/resources/extensions/gsd/auto-timeout-recovery.ts`
- DB-authoritative state derivation: `src/resources/extensions/gsd/state.ts`
- DB facade (schema + migrations + write API): `src/resources/extensions/gsd/gsd-db.ts`

## Auto Orchestration “Deep Module”

Recent refactors isolate a lifecycle deep module:

- Module + contract: `src/resources/extensions/gsd/auto/orchestrator.ts`, `src/resources/extensions/gsd/auto/contracts.ts`

The intent (see `CONTEXT.md` and ADRs in `docs/dev/`) is to make the auto loop call invariant modules explicitly (state reconciliation, dispatch, tool contract, worktree safety, runtime persistence) rather than hiding them in a monolithic dispatch adapter.

## Dispatch: How the Next Unit Is Chosen

The dispatch table (`src/resources/extensions/gsd/auto-dispatch.ts`) evaluates ordered rules against:

- derived project state (`src/resources/extensions/gsd/state.ts`)
- preferences (`src/resources/extensions/gsd/preferences*.ts`)
- milestone/slice/task artifacts (`src/resources/extensions/gsd/paths.ts`, `.../files.ts`)
- DB-backed gates and coordination rows (`src/resources/extensions/gsd/gsd-db.ts`, `src/resources/extensions/gsd/db/`)

When a rule matches, it returns a `unitType`, `unitId`, and a fully-built prompt string.

## High-Level Loop (Conceptual)

This is the “shape” of auto-mode, independent of the evolving implementation details:

```mermaid
flowchart TD
  A[/gsd auto/] --> B[bootstrapAutoSession]
  B --> C{advance loop}
  C --> D[deriveState (DB-first)]
  D --> E[resolveDispatch rule]
  E -->|stop| Z[exit]
  E -->|dispatch| F[select model + build prompt]
  F --> G[new Pi session (fresh context)]
  G --> H[agent executes tools/code]
  H --> I[post-unit hooks + verification]
  I --> J[persist DB + projections]
  J --> C
```

## Worktree Isolation

Auto-mode can isolate milestone execution using git worktrees:

- Worktree operations: `src/resources/extensions/gsd/auto-worktree.ts`, `src/resources/extensions/gsd/worktree*.ts`
- Architectural background: `docs/dev/ADR-001-branchless-worktree-architecture.md`

Key idea: keep project DB state authoritative and avoid cross-worktree contamination by scoping DB/metrics/workspace identity (see recent CHANGELOG entries around “worktree-scoped DB + metrics”).

