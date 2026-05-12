# Consolidated Code Review Report (qogni-qode)

Sources reviewed:
- `code-review/static-analysis.md`
- `code-review/security-audit.md`
- `code-review/performance-review.md`

## 1. Executive summary
Overall code health is **moderate with several release-blocking risks**. The largest issues are concentrated in the web/API surface: the intended auth/origin gate is not enforced globally, and a `?project=` override enables path-based privilege escalation. Combined with terminal/PTY endpoints, this creates a credible remote compromise path if the service is reachable beyond localhost. Separately, the dependency chain includes a reported malware package, and the LLM proxy streaming layer has correctness issues that can crash streams or hang consumers awaiting completion. Performance risks are dominated by resource leaks (PTY sessions) and a few unbounded caches/hot-path inefficiencies that can degrade long-running sessions.

## 2. Critical findings (must-fix before release)

| ID | Area | Risk | Evidence | Recommended fix | Effort |
|---:|---|---|---|---|---|
| C1 | Web authN/authZ | **Remote file/command execution risk** if server is reachable; auth gate not enforced | `code-review/security-audit.md` Findings 2.1, 2.2 | Add `web/middleware.ts` to enforce `web/proxy.ts` checks for all `/api/:path*`; add route-level `verifyAuthToken()` defense-in-depth on state-changing endpoints; default-bind to `127.0.0.1` and require explicit opt-in for `0.0.0.0` | M |
| C2 | Web project selection | **Path-based privilege escalation** via `?project=` | `code-review/security-audit.md` Finding 1.1 (`src/web/bridge-service.ts:1807`, multiple `/api/*` routes) | Remove `?project=` as an authorization input; use server-selected CWD or an allowlist; if multi-project required, enforce containment via `realpath` + `relative` against allowlisted roots | M |
| C3 | Supply chain | **Critical malware advisory** | `code-review/security-audit.md` Finding 5.1 (`@mistralai/mistralai`) | Remove/disable provider and dependency immediately; audit lockfile/CI artifacts; rotate potentially exposed credentials | S–M |
| C4 | LLM proxy streaming | **Crash / stream termination hangs** (can hang agent loop) | `code-review/static-analysis.md` (critical items in `packages/pi-agent-core/src/proxy.ts:166`, `:180`) | Guard per-line SSE JSON parsing; ensure stream completion always resolves `EventStream.result()` by emitting a terminal event or ending with a result | M |
| C5 | Web terminal stability | **Unbounded resource usage** (zombie shells + memory/FD exhaustion), amplified by C1 | `code-review/performance-review.md` Finding “PTY sessions can leak…” (`web/lib/pty-manager.ts:249`, `web/app/api/terminal/stream/route.ts:21`) | Reap idle sessions (no listeners + last activity); optionally “close-on-disconnect” mode; cap sessions per token/user | M |

## 3. High-priority improvements (should-fix soon)

| ID | Area | Rationale | Evidence | Recommended fix | Effort |
|---:|---|---|---|---|---|
| H1 | Web framework | Vulnerable/outdated Next.js increases exposure surface | `code-review/security-audit.md` Finding 5.2 | Upgrade `next` (and `eslint-config-next`) to `16.2.6+`, rerun audits, and re-verify middleware behavior | S |
| H2 | SSRF hardening | Current blocklist can be bypassed via DNS rebind / host->private | `code-review/security-audit.md` Finding 1.5 | Resolve A/AAAA records and enforce private-range checks on resolved IPs; re-validate on redirects; cap redirects | M |
| H3 | XSS defense-in-depth | `dangerouslySetInnerHTML` sinks increase blast radius of upstream bugs | `code-review/security-audit.md` Finding 1.3 | Prefer element-based renderers or sanitize HTML (e.g. DOMPurify allowlist); add adversarial regression tests | M |
| H4 | Filesystem containment | Prefix checks and path leakage make probing easier | `code-review/security-audit.md` Findings 1.2, 4.1 | Replace `startsWith` with `realpath`/`relative` containment; avoid returning absolute paths in non-debug responses | S–M |
| H5 | Secrets hygiene | Token printed to stderr can leak in log collectors | `code-review/security-audit.md` Finding 3.1 | Redact token in logs; optionally write token to `0600` file and print path | S |
| H6 | Web security headers | Add baseline protection where feasible | `code-review/security-audit.md` Finding 6.1 | Add headers via `web/next.config.mjs` (`CSP`, `frame-ancestors`, `referrer-policy`, `permissions-policy`); phase in strict CSP to avoid breaking dev | M |
| H7 | Agent loop robustness | Hook errors should not kill sessions | `code-review/static-analysis.md` (`packages/pi-agent-core/src/agent-loop.ts:769`) | Contain `afterToolCall` exceptions and surface as non-fatal tool/hook errors | S |
| H8 | Dynamic extension loading | Runtime failures are currently low-context and type-unsafe | `code-review/static-analysis.md` (`src/headless-query.ts:76–77`) | Define an `ExtensionModules` interface + runtime guards; provide aggregated error diagnostics | M |
| H9 | DB hot paths | N+1 graph traversal and missing ordering indexes scale poorly | `code-review/performance-review.md` (N+1 traversal; sequence-order indexes) | Batch graph queries per level; add composite indexes for `(milestone_id, slice_id, sequence, id)` and `(milestone_id, sequence, id)` | M |
| H10 | Web I/O latency | Sync filesystem scanning blocks the event loop on large dev roots | `code-review/performance-review.md` (project discovery sync FS) | Convert to async `fs.promises` with concurrency limits; cache `.gsd/STATE.md` parsing by mtime | M |
| H11 | Memory bounds | Unbounded caches can grow without limit in long-running sessions | `code-review/performance-review.md` (Google Search `resultCache`; statement `stmtCache`) | Add LRU+TTL for search results; cap prepared statement cache or opt-in caching for static SQL only | S–M |

## 4. Suggestions (nice-to-have improvements)
- Reduce long-term maintenance risk by refactoring `runLoop` into smaller helpers and adding focused edge-case tests (`packages/pi-agent-core/src/agent-loop.ts:175`, `code-review/static-analysis.md`).
- Remove duplicated semver comparison helpers by centralizing `compareSemver` (`src/update-check.ts:22`, `src/resources/extensions/gsd/changelog.ts:23`).
- Improve type safety by replacing broad `any` casts with `unknown` + type guards; model internal “partial tool call” state explicitly instead of hidden fields (`packages/pi-agent-core/src/proxy.ts:277`, `:290`, `packages/pi-agent-core/src/agent.ts:557`).
- Align workspace dependencies (e.g. `chalk`, `sql.js`, `hosted-git-info`) to reduce version skew and ownership ambiguity (`code-review/static-analysis.md` dependency section).
- Replace queue `.shift()` usage with an index pointer in traversal/topo sort loops for predictable scaling (`src/resources/extensions/gsd/memory-relations.ts:139`, `src/resources/extensions/gsd/visualizer-data.ts:279`).
- Consider route-level code splitting for heavy charting libraries to keep initial bundles smaller (`web/components/ui/chart.tsx:4`).

## 5. Deferred items (acknowledged, not blocking)
- Add additional tests around update-cache “valid JSON, wrong types” handling (`src/tests/update-check.test.ts`, `src/update-check.ts:134`) after the must-fix stream/auth work lands.
- Consider bounding prepared statement caching only if future work introduces dynamic SQL; current risk is low but worth preventing regressions (`src/resources/extensions/gsd/db-adapter.ts:39`).
- Keep existing positive controls: auth file permissions are appropriately restrictive (`src/web/web-auth-storage.ts:36`) and JSONL framing is well-documented (`packages/rpc-client/src/jsonl.ts:21`).

## 6. Recommended action plan with effort estimates

1) **Lock down web API access (M, 1–3 days)**
   - Implement `web/middleware.ts` to enforce `web/proxy.ts` on `/api/:path*`.
   - Add route-level `verifyAuthToken()` checks on all state-changing routes as defense-in-depth.
   - Change defaults to bind to `127.0.0.1` unless explicitly overridden with a risk acknowledgement.

2) **Remove `?project=` escalation path (M, 1–3 days)**
   - Make project root server-selected or allowlist-based; enforce containment with `realpath` + `relative`.
   - Add regression tests covering `?project=/` and symlink/prefix bypass cases.

3) **Address supply-chain blocker (S–M, 0.5–2 days)**
   - Remove `@mistralai/mistralai`; disable provider; rerun `npm audit` and rotate secrets if needed.

4) **Fix proxy stream correctness + add targeted tests (M, 1–3 days)**
   - Harden SSE parsing and guarantee stream terminal resolution.
   - Add unit tests for malformed frames and “no terminal event” completion to prevent hangs.

5) **Prevent PTY session leaks (M, 1–3 days)**
   - Implement idle reaping; add session caps; add tests/smoke checks for disconnect cleanup.

6) **Security & performance hardening sprint (M, 2–5 days)**
   - Upgrade Next.js; add security headers; SSRF DNS resolution; fix directory containment; reduce error/path leakage.
   - Batch memory graph DB traversal + add sequence-order indexes; migrate sync filesystem discovery to async with concurrency limits and caching.
