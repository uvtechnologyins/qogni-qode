# Codebase Orientation Pack

This folder is a concise “where-things-live + how-they-flow” map of the GSD-2 codebase. It is intended for contributors and for quick onboarding when you need to change something without re-reading the full docs set.

## Read Order

- `docs/dev/codebase-orientation/repo-structure.md` — what each top-level directory is for
- `docs/dev/codebase-orientation/entrypoints-and-modes.md` — binaries/entrypoints and runtime modes
- `docs/dev/codebase-orientation/state-and-storage.md` — where persistent state lives (global + per-project)
- `docs/dev/codebase-orientation/auto-and-workflow-engine.md` — auto-mode control flow, dispatch, DB-authoritative state

## Machine-Readable Summaries

- `docs/dev/codebase-orientation/workspace-packages.json` — workspace packages and internal dependency edges
- `docs/dev/codebase-orientation/extensions-manifests.json` — bundled extension manifests (the ones that declare `extension-manifest.json`)

## Related Deep-Dive Docs (already in repo)

- `docs/dev/architecture.md` — the canonical architecture overview
- `docs/dev/FILE-SYSTEM-MAP.md` — exhaustive file → subsystem labeling
- `docs/user-docs/` — end-user guides and command reference

