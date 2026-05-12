# Security Audit (qogni-qode)

Scope: See `code-review/scope.md`. This audit focuses on exploitable, production-impact security risks in the web UI/API surface, local process execution surfaces, and dependency chain.

## Top Risks (Prioritized)

1) **Unauthenticated web API exposure risk**: The repo appears to *intend* a bearer-token + Origin gate for `/api/*` via `web/proxy.ts`, but it is **not wired up as Next.js middleware** (no `web/middleware.ts`). If the web server binds beyond localhost (explicit host override, tunneling, container/port exposure), many endpoints become remotely exploitable for **file read/write** and potentially **arbitrary command execution via PTY**.
2) **Supply chain risk**: `npm audit` reports **critical malware** in `@mistralai/mistralai`.
3) **Outdated/vulnerable Next.js**: `web/package.json` pins `next@16.2.4` while `npm audit` recommends `16.2.6` to address multiple high/moderate advisories.

---

## 1) Input Validation (Injection Risks)

### Finding 1.1 — Path-based privilege escalation via `?project=` override
- Severity: **critical**
- OWASP: **A01:2021 – Broken Access Control** (also **A04:2021 – Insecure Design**)
- Evidence:
  - `src/web/bridge-service.ts:1807` (`resolveProjectCwd()` prefers `?project=` over server-side env)
  - `web/app/api/boot/route.ts:14` (uses `resolveProjectCwd(request)`)
  - `web/app/api/files/route.ts:93` (uses `requireProjectCwd(request)`; root derived from that CWD)
  - `web/app/api/terminal/sessions/route.ts:31` (uses `requireProjectCwd(request)` to spawn PTY in that directory)
- Why it matters:
  - `resolveProjectCwd()` accepts arbitrary paths from a query parameter. If the server is reachable by an attacker (non-local bind, tunnel, Docker port mapping, reverse proxy), the attacker can choose a filesystem root (e.g. `?project=/`) and then use endpoints like `/api/files` to read/write arbitrary files within that root (relative paths like `etc/passwd` are allowed).
- Remediation:
  - **Stop trusting** query-string `project` for authorization decisions. Treat it as *client hint* at most.
  - Only allow the project CWD to be server-selected (e.g. `process.env.GSD_WEB_PROJECT_CWD`) or chosen from a server-maintained allowlist of known worktrees/projects.
  - If multi-project is required, validate `project` using `realpath` + `relative` checks against an allowlisted base directory (and enforce a maximum list of allowed roots).

### Finding 1.2 — Directory browsing restriction uses string prefix checks (bypassable)
- Severity: **medium**
- OWASP: **A01:2021 – Broken Access Control**
- Evidence: `web/app/api/browse-directories/route.ts:88`
- Why it matters:
  - `targetPath.startsWith(devRoot)` is vulnerable to prefix tricks (e.g. `/home/user/dev` vs `/home/user/devil`) and does not account for symlinks.
- Remediation:
  - Replace `startsWith` checks with a `realpath` + `relative` based containment check (like `web/lib/secure-path.ts:13` already does for relative paths).
  - Consider restricting the endpoint to a small set of root directories and returning only children, not arbitrary absolute paths.

### Finding 1.3 — Potential XSS sink: `dangerouslySetInnerHTML` for syntax highlighting output
- Severity: **medium** (potentially **high** if any untrusted content can reach these code paths)
- OWASP: **A03:2021 – Injection** (XSS)
- Evidence:
  - `web/components/gsd/chat-mode.tsx:334` (injects `shiki` HTML)
  - `web/components/gsd/file-content-viewer.tsx:154` and `web/components/gsd/file-content-viewer.tsx:251`
- Why it matters:
  - This directly injects HTML into the DOM. Even if `shiki` is expected to escape input, any upstream bug or unexpected HTML output could become script injection.
- Remediation:
  - Prefer a renderer that returns React elements rather than raw HTML, or run the generated HTML through a strict sanitizer (e.g. DOMPurify with a minimal allowlist).
  - Add regression tests that feed adversarial code strings (e.g. `</pre><img src=x onerror=...>`) and assert it renders inert.

### Finding 1.4 — CSS injection sink in `<style dangerouslySetInnerHTML>` based on config keys
- Severity: **low**
- OWASP: **A03:2021 – Injection**
- Evidence: `web/components/ui/chart.tsx:82`
- Why it matters:
  - If `ChartConfig` keys or color strings can be influenced by untrusted input, this can become CSS injection (potential UI redress / data exfil via CSS-based attacks in some contexts).
- Remediation:
  - Constrain keys to a safe character set and quote attribute selectors (e.g. `[data-chart="${id}"]`).
  - Validate color values against a strict pattern (`#rgb`, `#rrggbb`, `rgb()`, etc.).

### Finding 1.5 — SSRF protection does not resolve DNS (rebind/host-to-private bypass)
- Severity: **medium**
- OWASP: **A10:2021 – Server-Side Request Forgery (SSRF)**
- Evidence: `src/resources/extensions/search-the-web/url-utils.ts:42`
- Why it matters:
  - `isBlockedUrl()` blocks private IPs only when the hostname itself is an IP literal. A public hostname that resolves to a private IP at runtime (or changes via DNS rebinding) is not blocked.
- Remediation:
  - Resolve hostnames to IPs (A/AAAA) and apply private-range checks on resolved addresses (and re-check on redirects).
  - Enforce `maxRedirects`, block protocol changes, and treat `Location:` redirects as new URLs requiring validation.

---

## 2) Authentication & Authorization

### Finding 2.1 — Auth gate appears not enforced (proxy logic not wired as middleware)
- Severity: **critical**
- OWASP: **A01:2021 – Broken Access Control** / **A07:2021 – Identification and Authentication Failures**
- Evidence:
  - Intended gate is implemented in `web/proxy.ts:14` (bearer token + Origin enforcement).
  - Defense-in-depth exists only on a couple of routes via `web/lib/auth-guard.ts:14` and is used only by:
    - `web/app/api/shutdown/route.ts:7`
    - `web/app/api/update/route.ts:13`
  - No `web/middleware.ts` exists to register `web/proxy.ts` with Next.js middleware routing.
- Exploit scenario:
  - If the web server is reachable from outside the local machine (bind to `0.0.0.0`, tunnel, container port exposure), an attacker can call endpoints such as:
    - `/api/files` (read/write files; `web/app/api/files/route.ts:81`)
    - `/api/terminal/sessions` (spawn an interactive shell; `web/app/api/terminal/sessions/route.ts:31`)
    - `/api/session/events` (SSE stream of session events; `web/app/api/session/events/route.ts:18`)
  - Even with a localhost bind, a malicious website can potentially **CSRF** state-changing endpoints (requests can be sent cross-site even if responses can’t be read).
- Remediation:
  - Implement Next.js middleware **correctly** (create `web/middleware.ts`) and apply the checks in `web/proxy.ts` to all `/api/:path*` requests.
  - Add **route-level auth** as defense-in-depth for *all* state-changing endpoints (POST/PATCH/DELETE) by calling `verifyAuthToken()` early (not just shutdown/update).
  - Remove or heavily constrain the `?project=` override used in `src/web/bridge-service.ts:1807` (see Finding 1.1).

### Finding 2.2 — Sensitive endpoints rely on ambient trust of local network boundaries
- Severity: **high**
- OWASP: **A01:2021 – Broken Access Control**
- Evidence:
  - PTY creation uses default shell if no command is provided: `web/app/api/terminal/sessions/route.ts:34` → `web/lib/pty-manager.ts:135`
  - Many `/api/*` routes do not call `verifyAuthToken()` (e.g. `web/app/api/terminal/input/route.ts:13`, `web/app/api/session/events/route.ts:18`)
- Remediation:
  - Treat the web UI as a **local-privileged admin interface** and require auth unconditionally when the web mode is launched with a token configured.
  - Consider binding to `127.0.0.1` only by default and refuse `0.0.0.0` unless the user explicitly acknowledges risk (and requires auth).

---

## 3) Secrets Management

### Finding 3.1 — Web auth token is printed to stderr (log leakage)
- Severity: **medium**
- OWASP: **A02:2021 – Cryptographic Failures** (token confidentiality) / **A09:2021 – Security Logging and Monitoring Failures**
- Evidence: `src/web-mode.ts:733`
- Why it matters:
  - The bearer token is embedded in the URL fragment and then printed to stderr as part of the “Ready” message. In environments where stderr is persisted (CI logs, terminal history capture, log forwarders), this token can be recovered and used to call privileged `/api/*` endpoints while the server is running.
- Remediation:
  - Avoid printing the full token; print a redacted form (e.g. first/last 4 chars) and/or print the base URL without the token.
  - Optionally write the token to a file with `0600` perms and display that file path for manual recovery.

### Finding 3.2 — Auth file permissions are set correctly (positive)
- Severity: **low** (positive control)
- OWASP: **A02:2021 – Cryptographic Failures** (related)
- Evidence: `src/web/web-auth-storage.ts:36` (creates parent dir `0o700`, auth file `0o600`)
- Recommendation:
  - Keep this pattern, and ensure no logs ever print API keys or OAuth refresh tokens.

---

## 4) Data Exposure (Logs, Responses, Errors)

### Finding 4.1 — API responses may disclose filesystem layout and internal errors
- Severity: **medium**
- OWASP: **A01:2021 – Broken Access Control** / **A09:2021 – Security Logging and Monitoring Failures**
- Evidence:
  - Absolute paths echoed in error responses: `web/app/api/browse-directories/route.ts:102`, `web/app/api/browse-directories/route.ts:162`
  - File path echoed in not-found responses: `web/app/api/files/route.ts:118`
- Why it matters:
  - If the API is reachable to untrusted clients (see auth findings), these endpoints can leak the host’s directory structure and facilitate further attacks.
- Remediation:
  - For non-debug builds, return generic errors and avoid including absolute paths. Log detailed errors server-side only.
  - Ensure consistent `Cache-Control: no-store` on sensitive endpoints (already present in some routes like `web/app/api/boot/route.ts:37`).

---

## 5) Dependency Vulnerabilities (Known CVEs / Advisories)

### Finding 5.1 — Critical: `@mistralai/mistralai` reported as malware
- Severity: **critical**
- OWASP: **A06:2021 – Vulnerable and Outdated Components**
- Evidence:
  - `npm audit --omit=dev` at repo root reports: “Malware in @mistralai/mistralai” (GHSA-3q49-cfcf-g5fm)
  - Direct dependency: `package.json:121` and `packages/pi-ai/package.json:35`
  - Runtime usage: `packages/pi-ai/src/providers/mistral.ts:16`
- Remediation:
  - **Immediately remove** `@mistralai/mistralai` from dependencies and disable the provider, or replace with a verified-safe official SDK (after due diligence).
  - Audit the lockfile history and CI artifacts for potential compromise; rotate any credentials that could have been exposed during install/runtime.

### Finding 5.2 — Next.js vulnerabilities in web app
- Severity: **high**
- OWASP: **A06:2021 – Vulnerable and Outdated Components**
- Evidence:
  - `web/package.json` pins `next: 16.2.4`
  - `npm audit --omit=dev` inside `web/` recommends upgrade to `16.2.6` (multiple advisories)
- Remediation:
  - Upgrade `next` (and `eslint-config-next`) to `16.2.6` or newer and re-run `npm audit`.
  - Reassess any planned middleware-based security gates after upgrade (some advisories reference middleware/proxy bypass).

### Finding 5.3 — `@anthropic-ai/sdk` advisory: insecure default file permissions (moderate)
- Severity: **medium**
- OWASP: **A06:2021 – Vulnerable and Outdated Components**
- Evidence: `npm audit --omit=dev` at repo root reports GHSA-p7fg-763f-g4gf affecting `@anthropic-ai/sdk` `<0.91.1` (current range `^0.90.0`)
- Remediation:
  - Upgrade to a non-vulnerable version (≥ `0.91.1`) and validate behavior in any local filesystem “memory” tools.

---

## 6) CORS & CSP Configuration (Web UI)

### Finding 6.1 — No explicit CSP/security headers configured for the Next.js app
- Severity: **medium**
- OWASP: **A05:2021 – Security Misconfiguration**
- Evidence:
  - No CSP-related configuration present in `web/next.config.mjs:8`
  - Multiple `dangerouslySetInnerHTML` sinks exist (see Finding 1.3, 1.4), increasing the value of defense-in-depth headers.
- Remediation:
  - Configure security headers via `next.config.mjs` `headers()`:
    - `Content-Security-Policy` (at minimum disallow `unsafe-inline`/`unsafe-eval` where feasible)
    - `X-Frame-Options` / `frame-ancestors`
    - `Referrer-Policy`
    - `Permissions-Policy`
  - If a strict CSP is not feasible in dev, enforce it at least in standalone/production builds.

### Finding 6.2 — “Origin check” exists but may be ineffective without middleware wiring
- Severity: **high** (because it contributes to the auth bypass)
- OWASP: **A05:2021 – Security Misconfiguration**
- Evidence: `web/proxy.ts:27` (Origin allowlist), but not registered as middleware (see Finding 2.1)
- Remediation:
  - Implement middleware correctly and ensure both token and Origin checks are enforced for all `/api/*` requests.

