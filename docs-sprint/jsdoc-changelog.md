# JSDoc Changelog

## Summary
- Total functions documented in this pass: **22**
- Source report: `docs-sprint/undocumented-report.md` (Priority queue top 20 + final 2 partial-gap entries)

## Documented Functions (By File)

### `packages/pi-tui/src/keys.ts`
- `matchesKey(data: string, keyId: KeyId)`

### `src/resources/extensions/gsd/doctor.ts`
- `runGSDDoctor(basePath: string, options?: { fix?: boolean; dryRun?: boolean; scope?: string; fixLevel?: "task" | "all"; isolationMode?: "none" | "worktree" | "branch"; includeBuild?: boolean; includeTests?: boolean })`

### `src/resources/extensions/gsd/gsd-db.ts`
- `openDatabase(path: string)`

### `src/resources/extensions/gsd/state.ts`
- `deriveState(basePath: string, opts?: DeriveStateOptions)`
- `deriveStateFromDb(basePath: string)`

### `src/resources/extensions/gsd/auto-recovery.ts`
- `verifyExpectedArtifact(unitType: string, unitId: string, base: string)`

### `src/resources/extensions/gsd/worktree-manager.ts`
- `createWorktree(basePath: string, name: string, opts: { branch?: string; startPoint?: string; reuseExistingBranch?: boolean } = {})`
- `removeWorktree(basePath: string, name: string, opts: { deleteBranch?: boolean; force?: boolean; branch?: string } = {})`

### `src/resources/extensions/gsd/schemas/parsers.ts`
- `parseRoadmap(content: string)`

### `packages/pi-ai/src/env-api-keys.ts`
- `getEnvApiKey(provider: KnownProvider | string)`

### `packages/pi-ai/src/web-runtime-env-api-keys.ts`
- `getEnvApiKey(provider: KnownProvider | string)`

### `packages/pi-coding-agent/src/core/tools/truncate.ts`
- `truncateHead(content: string, options: TruncationOptions = {})`

### `src/resources/extensions/gsd/auto-worktree.ts`
- `teardownAutoWorktree(originalBasePath: string, milestoneId: string, opts: { preserveBranch?: boolean } = {})`
- `mergeMilestoneToMain(originalBasePath_: string, milestoneId: string, roadmapContent: string)`

### `src/resources/extensions/gsd/preferences-validation.ts`
- `validatePreferences(preferences: GSDPreferences)`

### `src/resources/extensions/gsd/preferences.ts`
- `loadEffectiveGSDPreferences(basePath?: string, opts?: { availableModelIds?: string[] })`

### `src/resources/extensions/gsd/auto-dispatch.ts`
- `resolveDispatch(ctx: DispatchContext)`

### `src/resources/extensions/gsd/prompt-loader.ts`
- `loadPrompt(name: string, vars: Record<string, string> = {})`

### `scripts/dist-test-resolve.mjs`
- `resolve(specifier, context, nextResolve)`

### `src/resources/extensions/gsd/auto-artifact-paths.ts`
- `resolveExpectedArtifactPath(unitType: string, unitId: string, base: string)`

### `web/lib/workflow-action-execution.ts`
- `executeWorkflowActionInPowerMode({ dispatch }: { dispatch: () => Promise<unknown> })`

### `web/proxy.ts`
- `proxy(request: NextRequest)`

## Skipped (This Pass)
- Remaining entries in `docs-sprint/undocumented-report.md` (**6,353** total; **6,331** not addressed here).
  - Reason: the report scope is too large for a single documentation-only patch; this pass follows the report’s built-in Priority queue (highest-impact entries) to iterate safely.

## Representative Before/After Snippets

### 1) `packages/pi-tui/src/keys.ts` — `matchesKey`
**Before**
```ts
/**
 * Match input data against a key identifier string.
 *
 * @param data - Raw input data from terminal
 * @param keyId - Key identifier (e.g., "ctrl+c", "escape", Key.ctrl("c"))
 */
export function matchesKey(data: string, keyId: KeyId): boolean {
```
**After**
```ts
/**
 * Match input data against a key identifier string.
 *
 * @param {string} data - Raw input data from the terminal.
 * @param {KeyId} keyId - Key identifier (e.g. `"ctrl+c"`, `"escape"`, `Key.ctrl("c")`).
 * @returns {boolean} `true` when `data` matches `keyId`.
 * @example
 * ```ts
 * import { matchesKey, Key } from "@gsd/pi-tui";
 * ```
 */
export function matchesKey(data: string, keyId: KeyId): boolean {
```

### 2) `src/resources/extensions/gsd/gsd-db.ts` — `openDatabase`
**Before**
```ts
export function openDatabase(path: string): boolean {
```
**After**
```ts
/**
 * Opens a SQLite database file and initializes the schema for the current process.
 *
 * @param {string} path - Absolute path (or `":memory:"`) to the SQLite database.
 * @returns {boolean} `true` when the DB is open and ready for queries; otherwise `false`.
 * @throws {Error} When opening the database or initializing the schema fails.
 * @example
 * ```ts
 * import { openDatabase, getDbStatus } from "./gsd-db.js";
 * ```
 */
export function openDatabase(path: string): boolean {
```

### 3) `scripts/dist-test-resolve.mjs` — `resolve`
**Before**
```js
export function resolve(specifier, context, nextResolve) {
```
**After**
```js
/**
 * Node.js ESM loader resolve hook for running compiled tests under `dist-test/`.
 *
 * @param {string} specifier - Import specifier being resolved.
 * @param {object} context - Loader context, including `parentURL`.
 * @param {(specifier: string, context: any) => any} nextResolve - Next resolver in the chain.
 * @returns {any} The resolved module record returned by `nextResolve`.
 */
export function resolve(specifier, context, nextResolve) {
```

