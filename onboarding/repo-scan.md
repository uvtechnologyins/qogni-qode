# Repository Scan

Primary purpose (from repo metadata): build and distribute **GSD (Get Shit Done)** — an autonomous coding agent system with a CLI, web UI, VS Code extension, and supporting packages (daemon + MCP server), plus native Rust modules for performance-critical operations.

## Directory Structure

Top-level layout (selected notable directories and what they contain):

- `.agents/`: directory exists; contains `.agents/skills/` (no files found under `.agents/` at depth 3).
- `.plans/`: Markdown planning documents (e.g. `startup-performance.md`, `token-optimization-suite.md`, `workflow-templates.md`).
- `.qogni/`: local agent persona materials (e.g. `.qogni/agent/SOUL.md`, `.qogni/agent/templates/repository-scan-report.md`).
- `.qogni-agent-projection/`: local projection state (`.qogni-agent-projection/state.json`).
- `.qwen/`: directory exists; contains `.qwen/skills/` (empty).
- `.github/`: GitHub metadata and workflows (`.github/workflows/*.yml`, templates, `CODEOWNERS`).
- `docker/`: Docker sandbox runtime (`docker/Dockerfile.sandbox`), CI builder image (`docker/Dockerfile.ci-builder`), compose files (`docker/docker-compose*.yaml`), env example (`docker/.env.example`), and usage docs (`docker/README.md`).
- `docs/`: project documentation, including `docs/user-docs/`, `docs/dev/` ADRs/implementation plans, and `docs/zh-CN/` translations (`docs/README.md`).
- `extensions/`: workspace extensions (currently `extensions/google-search/`).
- `gitbook/`: GitBook-style docs (`gitbook/SUMMARY.md`, feature/reference pages).
- `gsd-orchestrator/`: a skill package with references/templates/workflows (`gsd-orchestrator/SKILL.md`, `gsd-orchestrator/workflows/*.md`).
- `mintlify-docs/`: Mintlify docs site content (`*.mdx`, `mintlify-docs/docs.json`, images).
- `native/`: Rust workspace (`native/Cargo.toml`, `native/Cargo.lock`, `native/crates/*`) and build tooling (`native/scripts/*`, `native/npm/*`).
- `packages/`: npm workspaces for published libraries and CLIs (see “Package Management”).
- `pkg/`: packaging shim content (`pkg/package.json`, `pkg/dist/**` including export-HTML vendor assets).
- `scripts/`: build/test/release utilities and CI helper scripts (e.g. `scripts/install.js`, `scripts/compile-tests.mjs`, `scripts/secret-scan.*`).
- `src/`: main TypeScript source for the `gsd-pi` package (CLI loader, CLI, resource loading, web bridge, onboarding, etc.).
- `studio/`: Electron app (Electron + Vite) with its own `studio/package.json`.
- `tests/`: smoke, live, live-regression, and e2e tests (`tests/smoke/`, `tests/live/`, `tests/e2e/`).
- `vscode-extension/`: VS Code extension package with docs and images (`vscode-extension/package.json`, `vscode-extension/docs/images/*`).
- `web/`: Next.js web app (app router, API routes), with its own `web/package.json` and config files.

Top-level docs and metadata:

- `README.md`, `VISION.md`, `CONTEXT.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`
- `.gitignore`, `.dockerignore`, `.npmignore`, `.npmrc`
- `tsconfig.json` plus variants (`tsconfig.extensions.json`, `tsconfig.test.json`, `tsconfig.resources.json`)

## Languages & Frameworks

Detected by file types and package manifests:

- TypeScript/JavaScript (Node.js ESM): `src/**/*.ts`, `packages/**`, `scripts/*.mjs|*.cjs|*.js`, `"type": "module"` in multiple `package.json` files.
- Rust (edition 2021): `native/Cargo.toml` workspace with crates under `native/crates/*`; uses `napi`/`napi-derive` for Node integration (see `native/crates/engine/Cargo.toml`).
- Web UI: Next.js + React (`web/package.json` has `next@16.2.4`, `react@19.2.5`, Tailwind CSS, Radix UI).
- Desktop UI: Electron + electron-vite + React (`studio/package.json`).
- VS Code extension: TypeScript extension package (`vscode-extension/package.json`).
- Testing: Node.js built-in test runner (`node --test`), plus Playwright listed as a dependency in root `package.json`.
- CI/CD: GitHub Actions workflows (`.github/workflows/*.yml`).
- Containerization: Docker (`Dockerfile`, `docker/docker-compose*.yaml`).

## Entry Points

CLI/binaries (root):

- npm `bin` mapping in `package.json`:
  - `gsd` → `dist/loader.js`
  - `gsd-cli` → `dist/loader.js`
  - `gsd-pi` → `scripts/install.js`
- Source loader: `src/loader.ts` (compiled to `dist/loader.js` during build). Handles `--help/--version` fast-path, runtime checks (Node version + git), environment setup, resource/extension wiring, and workspace package linking before importing heavier modules.
- Main CLI implementation: `src/cli.ts` (compiled output under `dist/` after build).
- Dev CLI helpers: `scripts/dev.js`, `scripts/dev-cli.js` (referenced by root scripts).

Other CLIs:

- Daemon CLI: `packages/daemon/package.json` declares `gsd-daemon` → `./dist/cli.js`.
- MCP server CLI: `packages/mcp-server/package.json` declares `gsd-mcp-server` → `./dist/cli.js`.

Web apps:

- Next.js app: `web/package.json` scripts `dev|build|start|start:standalone` and `web/next.config.mjs`.
- Electron app: `studio/package.json` scripts `electron-vite dev|build|preview`.

VS Code extension:

- Extension entry: `vscode-extension/package.json` has `"main": "dist/extension.js"` and activation on startup.

## Configuration

Runtime/build configuration files found:

- Node/npm:
  - `.npmrc` (`engine-strict=true`)
  - `package.json` (requires Node `>=22.0.0`, `packageManager: npm@10.9.3`, defines workspaces, scripts, deps)
  - `package-lock.json` (repo root), plus `web/package-lock.json` and `vscode-extension/package-lock.json`
- TypeScript:
  - `tsconfig.json` (NodeNext module + resolution, outputs to `dist/`, excludes `src/resources`, `src/tests`, `src/web`)
  - `tsconfig.extensions.json` (noEmit; includes `src/resources/extensions` and `extensions`)
  - `tsconfig.test.json` (compiles a selected list of test/entry TS files)
  - `tsconfig.resources.json` (present at root)
- Docker:
  - `Dockerfile` (runtime image installs `gsd-pi@latest` globally; `runtime-local` installs from an npm-packed tarball)
  - `docker/Dockerfile.sandbox`, `docker/Dockerfile.ci-builder`
  - `docker/docker-compose.yaml`, `docker/docker-compose.full.yaml`
  - `docker/.env.example`
- Next.js:
  - `web/next.config.mjs` (standalone output; `typescript.ignoreBuildErrors: true`; webpack `extensionAlias` for NodeNext-style `.js` imports mapping to `.ts/.tsx`)
  - `web/eslint.config.mjs`, `web/postcss.config.mjs`, `web/tsconfig.json`, `web/components.json`
- GitHub Actions: `.github/workflows/*.yml` including (by filename):
  - `ci.yml` (docs injection scan, secret scans, change classification and conditional build/test)
  - `build-native.yml` (matrix build/publish of Rust native binaries)
  - `prod-release.yml` (manual release flow: version bump, build, publish, docker image)
  - plus `ai-triage.yml`, `dev-publish.yml`, `next-publish.yml`, `version-check.yml`, `forensics-check.yml`, `cleanup-dev-versions.yml`, `pipeline.yml`, `pr-risk.yml`
- Repo hygiene/security scanning:
  - `.prompt-injection-scanignore`, `.secretscanignore`
  - `scripts/secret-scan.*`, `scripts/base64-scan.sh`, `scripts/docs-prompt-injection-scan.sh`

## Package Management

JavaScript/TypeScript workspace:

- npm workspaces defined in root `package.json`:
  - `packages/*`
  - `extensions/*`
- Root lock: `package-lock.json`
- Additional locks:
  - `web/package-lock.json` (Next.js app)
  - `vscode-extension/package-lock.json` (VS Code extension)

Workspace packages under `packages/` (each has its own `package.json`):

- `packages/contracts/` — `@gsd-build/contracts` (shared contracts; `main: dist/index.js`)
- `packages/rpc-client/` — `@gsd-build/rpc-client`
- `packages/mcp-server/` — `@gsd-build/mcp-server` (`bin: gsd-mcp-server`)
- `packages/daemon/` — `@gsd-build/daemon` (`bin: gsd-daemon`)
- `packages/pi-coding-agent/` — `@gsd/pi-coding-agent`
- `packages/pi-ai/` — `@gsd/pi-ai`
- `packages/pi-agent-core/` — `@gsd/pi-agent-core`
- `packages/pi-tui/` — `@gsd/pi-tui`
- `packages/native/` — `@gsd/native` (JS wrapper package; builds Rust via `native/scripts/build.js`)

Rust workspace:

- `native/Cargo.toml` workspace with members `native/crates/*`
- Rust lock: `native/Cargo.lock`
- Engine crate: `native/crates/engine/` (crate name `gsd-engine`, `crate-type = ["cdylib","rlib"]`)

## Notable Patterns

Observed architectural and naming patterns:

- “Resources as bundled content”: `src/resources/**` and `pkg/dist/**` suggest a build step that copies/extensions/themes/export-html assets into a distributable layout (see scripts like `scripts/copy-resources.cjs`, `scripts/copy-themes.cjs`, `scripts/copy-export-html.cjs`).
- Extension system:
  - Source and bundled extensions appear under `src/resources/extensions/**`.
  - External extension packages exist under `extensions/*` and can declare entries via `pi.extensions` (example: `extensions/google-search/package.json`).
  - Loader logic mentions discovery + registry checks (e.g. `src/extension-discovery.ts`, `src/extension-registry.ts`).
- Runtime “managed” directories: loader/CLI code references a user state dir under `~/.gsd` (root `package.json` includes `"piConfig": {"configDir": ".gsd"}` and `pkg/package.json` repeats `piConfig`).
- NodeNext-style ESM with `.js` import specifiers mapping to TS sources in builds (see `tsconfig.json` and `web/next.config.mjs` comments about `.js` extension imports).
- Test compilation pipeline: root scripts compile selected tests to `dist-test/` (`scripts/compile-tests.mjs`) and then run Node’s test runner over compiled outputs (`npm run test:unit:compiled`).
- Multi-surface product:
  - CLI (root + `src/`)
  - Web UI (`web/`)
  - Desktop UI (`studio/`)
  - Editor integration (`vscode-extension/`)
  - MCP integration (`packages/mcp-server/`)

## Areas of Concern

Concrete “watch-outs” based on size/shape of the repo:

- Very large files (by byte size; sample from `find ... | sort -nr | head`):
  - `vscode-extension/docs/images/overview.png` (~786 KB)
  - `web/package-lock.json` (~439 KB), `package-lock.json` (~232 KB)
  - `CHANGELOG.md` (~232 KB)
  - Large TS/TSX sources such as `web/lib/gsd-workspace-store.tsx`, `packages/pi-coding-agent/src/modes/interactive/interactive-mode.ts`, and multiple files under `src/resources/extensions/gsd/` (e.g. `auto-prompts.ts`, `gsd-db.ts`, `guided-flow.ts`, `auto.ts`).
- Vendored/minified assets committed:
  - `pkg/dist/core/export-html/vendor/highlight.min.js`, `pkg/dist/core/export-html/vendor/marked.min.js`
  - Similar vendor assets under `packages/pi-coding-agent/src/core/export-html/vendor/`
- Deep nesting: maximum observed path depth among files was 8 directories (multiple files under `src/resources/extensions/**` and other trees hit this depth).
- “Legacy” migration/compat pathways exist (by identifier search):
  - `src/resource-loader.ts` includes logic around migrating “legacy skills”.
  - Scripts like `scripts/legacy-cleanup-gate.mjs` and `scripts/legacy-cleanup-evidence.mjs` exist.
- Build outputs are expected but not necessarily present in-repo:
  - Root `dist/` is gitignored; in this checkout `pkg/dist/` exists, but `dist/` at repo root was not present.

