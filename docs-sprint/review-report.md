# Documentation Review Report (Documentation Reviewer)

Scope reviewed:
- `docs-sprint/undocumented-report.md`
- `docs-sprint/jsdoc-changelog.md`
- `README.md`
- JSDoc blocks added/modified in source files (functions listed in `docs-sprint/jsdoc-changelog.md`)

Date: 2026-05-13

---

## 1) JSDoc accuracy audit (sample ≥10; reviewed 22/22)

The sprint changelog lists 22 documented functions. I audited all 22 JSDoc blocks against their implementations, focusing on: behavior claims, param names/types, returns, throws, and whether examples are runnable in-context.

### Summary
- **Pass (no issues found):** 17
- **Issues found:** 5 (1 critical/doc-misleading claim, 4 warnings/nitpicks)

### Sampled JSDoc checks (22)

| Function | JSDoc location | Audit result |
|---|---:|---|
| `matchesKey(data, keyId)` | `packages/pi-tui/src/keys.ts:667` | OK — behavior matches switch cases; params/returns correct; example matches export (`@gsd/pi-tui`). |
| `runGSDDoctor(basePath, options?)` | `src/resources/extensions/gsd/doctor.ts:332` | OK — options match implementation; example is syntactically valid (`./doctor.js`). |
| `openDatabase(path)` | `src/resources/extensions/gsd/gsd-db.ts:581` | OK — fallback + VACUUM recovery described matches code; throws/returns correct. |
| `deriveState(basePath, opts?)` | `src/resources/extensions/gsd/state.ts:290` | OK — DB-authoritative path + explicit fallback described matches code. |
| `deriveStateFromDb(basePath)` | `src/resources/extensions/gsd/state.ts:666` | OK — DB-only derivation; example matches required open flow. |
| `verifyExpectedArtifact(unitType, unitId, base)` | `src/resources/extensions/gsd/auto-recovery.ts:579` | OK — overall contract matches (true when satisfied / not applicable); example is valid. |
| `createWorktree(basePath, name, opts?)` | `src/resources/extensions/gsd/worktree-manager.ts:219` | OK — params/defaults match; throws type matches `GSDError` usage. |
| `removeWorktree(basePath, name, opts?)` | `src/resources/extensions/gsd/worktree-manager.ts:501` | OK — defaults + “chdir out first” matches code. |
| `parseRoadmap(content)` | `src/resources/extensions/gsd/schemas/parsers.ts:289` | OK — supports both formats as documented; return type matches. |
| `getEnvApiKey(provider)` | `packages/pi-ai/src/env-api-keys.ts:58` | **Nitpick** — “Will not return API keys for providers that require OAuth tokens” is ambiguous vs implementation (returns OAuth tokens for some providers). Suggested clarification in Issues table. |
| `getEnvApiKey(provider)` | `packages/pi-ai/src/web-runtime-env-api-keys.ts:22` | OK — scope/intent matches code; return contract correct. |
| `truncateHead(content, options?)` | `packages/pi-coding-agent/src/core/tools/truncate.ts:62` | OK — never-partial-lines behavior described matches implementation. |
| `teardownAutoWorktree(originalBasePath, milestoneId, opts?)` | `src/resources/extensions/gsd/auto-worktree.ts:1195` | OK — behavior/throws match; example is valid. |
| `mergeMilestoneToMain(originalBasePath_, milestoneId, roadmapContent)` | `src/resources/extensions/gsd/auto-worktree.ts:1500` | **Warning** — documented sequence order conflicts with implementation ordering (worktree removal happens before branch deletion). |
| `validatePreferences(preferences)` | `src/resources/extensions/gsd/preferences-validation.ts:32` | OK — pure validation + warnings/errors behavior matches implementation. |
| `loadEffectiveGSDPreferences(basePath?, opts?)` | `src/resources/extensions/gsd/preferences.ts:149` | OK — merge order + default layering matches code. |
| `resolveDispatch(ctx)` | `src/resources/extensions/gsd/auto-dispatch.ts:1450` | **Warning** — `@throws` is overstated for the registry path (errors are caught and fallback is used). |
| `loadPrompt(name, vars?)` | `src/resources/extensions/gsd/prompt-loader.ts:168` | OK — missing-placeholder GSDError behavior matches implementation. |
| `resolve(specifier, context, nextResolve)` | `scripts/dist-test-resolve.mjs:32` | OK — redirects described match code; example is runnable. |
| `resolveExpectedArtifactPath(unitType, unitId, base)` | `src/resources/extensions/gsd/auto-artifact-paths.ts:45` | OK — return contract matches per-unit switch behavior. |
| `executeWorkflowActionInPowerMode({ dispatch })` | `web/lib/workflow-action-execution.ts:11` | **Warning** — description says it navigates to Power view, but code navigates to `chat` in “vibe-coder” mode. Also param naming in JSDoc doesn’t match destructured signature (nit). |
| `proxy(request)` | `web/proxy.ts:4` | OK — bearer/origin/_token behavior matches `evaluateWebProxyAuth`. |

---

## 2) README accuracy audit

### Installation steps
- `npm install -g gsd-pi@latest` matches `package.json#name` (`gsd-pi`) and `package.json#bin` (`gsd` → `dist/loader.js`).  
- “From source” steps (`npm ci`, `npm run build`, `npm run gsd`) match `package.json#scripts`.

### Usage examples
- CLI examples (`gsd`, `/login`, `/model`, `/gsd auto`) are syntactically fine (shell vs in-app slash commands is clear enough by context).
- Programmatic example imports (`@gsd/pi-coding-agent`) match actual exports (`createAgentSession`, `InteractiveMode`) in `packages/pi-coding-agent/src/index.ts`.

### Project structure & features
- Directory layout shown under “Project Structure” matches repository top-level folders present (`src/`, `packages/`, `extensions/`, `web/`, `vscode-extension/`, `native/`, etc.).
- “Optional integrations” named in README exist as workspaces/directories (`packages/mcp-server`, `packages/daemon`, `web/`, `vscode-extension/`).

### Dependencies & prerequisites
- Node prerequisite `>=22` matches `package.json#engines.node`.
- `npm@10.9.3` pin matches `package.json#packageManager`.

### Links/references
- All local (relative) links in `README.md` resolve to existing paths (spot-checked programmatically).

### README issues
- **RTK integration is described as always provisioning a managed RTK binary**, but the code indicates RTK is **opt-in** via `preferences.experimental.rtk` (and otherwise force-disabled by setting `GSD_RTK_DISABLED=1`). See Issues table.
- The “What’s New” note claims `mergeMilestoneToMain` was “privatized”, but the symbol remains `export`ed (with `@internal` guidance). This is potentially confusing and worth tightening.

---

## 3) Consistency check

- Terminology is mostly consistent (`.gsd/`, “milestone/slice/task”, “worktree”, “DB-authoritative”).
- **Inconsistency:** `docs-sprint/undocumented-report.md` coverage percentage conflicts with the counts it reports (critical).
- Parameter naming is consistent in most JSDoc blocks; one notable exception is destructured-parameter documentation in `web/lib/workflow-action-execution.ts`.
- README “API Reference” aligns with actual exported symbols for sampled entries (spot-checked `createAgentSession`, `getEnvApiKey`, workspace presence for `mcp-server`/`daemon`).

---

## 4) Issues found

| File | Line | Issue | Severity | Suggested fix |
|---|---:|---|---|---|
| `docs-sprint/undocumented-report.md` | 6 | Coverage reported as **2.6%** but counts show total `12258` and undocumented `8750` (implies documented `3508` → coverage ≈ **28.6%**, not 2.6%). | critical | Recompute and replace the coverage % (or adjust the counts/definitions so they agree). Add a one-line formula note to prevent future drift. |
| `README.md` | 22 | RTK paragraph implies RTK is provisioned/used by default; implementation indicates RTK is **opt-in** (`preferences.experimental.rtk === true`) and otherwise disabled via `GSD_RTK_DISABLED`. | warning | Update the paragraph to state RTK is opt-in and document how to enable it (and keep env var override note). |
| `README.md` | 146 | “`mergeMilestoneToMain` was privatized” conflicts with the fact it is still exported (even if intended internal). | warning | Rephrase to “no longer a supported public entry point” / “internal-only via deps seam” to match code reality. |
| `src/resources/extensions/gsd/auto-worktree.ts` | 1504 | JSDoc “Sequence” lists branch deletion before worktree removal; implementation explicitly removes worktree first, then deletes branch. | warning | Update the sequence ordering to match the code (or remove the step-by-step list if it’s too brittle). |
| `src/resources/extensions/gsd/auto-dispatch.ts` | 1460 | `@throws` suggests prompt-construction failures bubble; registry path catches all errors and falls back, so throws behavior is conditional and more nuanced. | warning | Clarify `@throws` to describe which path(s) can throw (inline rule matching) and that registry errors are caught/logged. |
| `web/lib/workflow-action-execution.ts` | 11 | JSDoc says it navigates to “Power User Mode view”, but code navigates to `chat` when `getUserMode()` is `"vibe-coder"`. | warning | Update description to “navigate to the appropriate view (power or chat) based on user mode”. |
| `web/lib/workflow-action-execution.ts` | 20 | JSDoc param names use `params` / `params.dispatch`, but the function signature destructures `{ dispatch }` and has no `params` identifier. | nitpick | Either rename JSDoc param to match destructuring conventions (e.g. document `dispatch` only) or introduce a named `params` object parameter. |
| `packages/pi-ai/src/env-api-keys.ts` | 61 | “Will not return API keys for providers that require OAuth tokens” is ambiguous vs implementation (returns OAuth tokens for some providers and API keys for others). | nitpick | Clarify wording: e.g. “For OAuth-based providers, returns the OAuth token env var (not an API key).” |

---

## 5) Verdict

**APPROVED WITH CHANGES**

Rationale: core README + JSDoc content is largely accurate and useful, but there is at least one **critical** misreporting issue (`docs-sprint/undocumented-report.md` coverage %) plus several documentation/code mismatches that could mislead maintainers (RTK enablement, merge sequence).

---

## 6) Suggested fixes (concrete edits)

1) Fix coverage math in `docs-sprint/undocumented-report.md:6`:
   - If counts are correct: change `2.6%` → `28.6%` (or compute to 1 decimal consistently).
   - Add a short note, e.g. “Coverage = (total - undocumented) / total”.

2) Update RTK wording in `README.md:22`:
   - Mention it is **opt-in** via `preferences.experimental.rtk`.
   - Keep env overrides (`GSD_RTK_DISABLED`, `RTK_TELEMETRY_DISABLED`) but ensure the enablement path is documented.

3) Tighten the `mergeMilestoneToMain` statements:
   - `README.md:146`: rephrase “privatized” to “internal-only” and reference the supported entry points mentioned in the JSDoc (`WorktreeLifecycle.*`).
   - `src/resources/extensions/gsd/auto-worktree.ts:1504`: reorder the “Sequence” list (remove worktree before branch delete) or remove brittle numbering.

4) Clarify `resolveDispatch` error behavior in `src/resources/extensions/gsd/auto-dispatch.ts:1460`:
   - Document that registry evaluation failures are caught and a fallback is used; only the fallback rule path can throw.

5) Align `executeWorkflowActionInPowerMode` doc with behavior in `web/lib/workflow-action-execution.ts:11`:
   - Update description to match conditional navigation.
   - Adjust param docs to avoid `params.*` for destructured input (or change signature to `params`).

