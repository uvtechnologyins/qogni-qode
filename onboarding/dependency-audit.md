# Dependency Audit

Scope: npm workspaces + web/studio/vscode apps + Rust native workspace.
Inputs: `package.json`/`package-lock.json`, `web/package.json`/`web/package-lock.json`, `vscode-extension/package.json`/`vscode-extension/package-lock.json`, Rust `native/Cargo.toml` + crate manifests, and `onboarding/repo-scan.md`.

## 1) Dependency inventory

## Dependency Inventory (JavaScript/TypeScript)

### Root

- Package: `gsd-pi` @ `2.80.0`
- Description: GSD — Get Shit Done coding agent

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `@anthropic-ai/sdk` | `^0.90.0` | `0.90.0` | dependencies | Claude API client (TypeScript) |
| `@anthropic-ai/vertex-sdk` | `^0.14.4` | `0.14.4` | dependencies | Claude API client for Google Vertex AI |
| `@aws-sdk/client-bedrock-runtime` | `^3.983.0` | `3.1038.0` | dependencies | AWS Bedrock Runtime client |
| `@clack/prompts` | `^1.1.0` | `1.2.0` | dependencies | Interactive CLI prompts |
| `@google/genai` | `^1.40.0` | `1.50.1` | dependencies | Google Generative AI client |
| `@mariozechner/jiti` | `^2.6.2` | `2.6.5` | dependencies | Runtime loader for TS/ESM |
| `@mistralai/mistralai` | `^1.14.1` | `1.15.1` | dependencies | Mistral API client |
| `@modelcontextprotocol/sdk` | `^1.27.1` | `1.29.0` | dependencies | MCP server/client SDK |
| `@silvia-odwyer/photon-node` | `^0.3.4` | `0.3.4` | dependencies | Photon image processing bindings |
| `@sinclair/typebox` | `^0.34.41` | `0.34.49` | dependencies | Type-safe JSON schema definitions |
| `ajv` | `^8.17.1` | `8.20.0` | dependencies | JSON Schema validator |
| `ajv-formats` | `^3.0.1` | `3.0.1` | dependencies | AJV format validators |
| `chalk` | `^5.6.2` | `5.6.2` | dependencies | Terminal color styling |
| `chokidar` | `^5.0.0` | `5.0.0` | dependencies | File watcher |
| `diff` | `^8.0.2` | `8.0.4` | dependencies | Text diffing |
| `extract-zip` | `^2.0.1` | `2.0.1` | dependencies | Zip extraction |
| `file-type` | `^21.1.1` | `21.3.4` | dependencies | File type detection from bytes |
| `glob` | `^13.0.1` | `13.0.6` | dependencies | File globbing |
| `hosted-git-info` | `^9.0.2` | `9.0.2` | dependencies | Parse hosted Git URLs |
| `ignore` | `^7.0.5` | `7.0.5` | dependencies | gitignore-style matcher |
| `marked` | `^15.0.12` | `15.0.12` | dependencies | Markdown parser |
| `minimatch` | `^10.2.3` | `10.2.5` | dependencies | Glob pattern matching |
| `openai` | `^6.26.0` | `6.35.0` | dependencies | OpenAI API client |
| `picomatch` | `^4.0.3` | `4.0.4` | dependencies | Fast glob matching |
| `playwright` | `^1.58.2` | `1.59.1` | dependencies | Browser automation for tests/tools |
| `proper-lockfile` | `^4.1.2` | `4.1.2` | dependencies | Cross-process file locking |
| `proxy-agent` | `^6.5.0` | `6.5.0` | dependencies | HTTP(S) proxy agent support |
| `sharp` | `^0.34.5` | `0.34.5` | dependencies | High-performance image processing |
| `sql.js` | `^1.14.1` | `1.14.1` | dependencies | SQLite compiled to WebAssembly |
| `strip-ansi` | `^7.1.0` | `7.2.0` | dependencies | Remove ANSI escape codes |
| `undici` | `^7.24.2` | `7.25.0` | dependencies | HTTP client |
| `yaml` | `^2.8.2` | `2.8.3` | dependencies | YAML parser/emitter |
| `@types/node` | `^24.12.0` | `24.12.2` | devDependencies | Node.js type definitions |
| `@types/picomatch` | `^4.0.2` | `4.0.3` | devDependencies | Type definitions for picomatch |
| `c8` | `^11.0.0` | `11.0.0` | devDependencies | Code coverage for Node tests |
| `esbuild` | `^0.25.12` | `0.25.12` | devDependencies | JavaScript/TypeScript bundler |
| `jiti` | `^2.6.1` | `2.6.1` | devDependencies | Runtime loader for TS/ESM |
| `typescript` | `^5.4.0` | `5.9.3` | devDependencies | TypeScript compiler |
| `@anthropic-ai/claude-agent-sdk` | `0.2.83` | `0.2.83` | optionalDependencies | Claude agent/tooling SDK (optional integration) |
| `@gsd-build/engine-darwin-arm64` | `>=2.10.2` | `2.78.1` | optionalDependencies | Internal workspace package |
| `@gsd-build/engine-darwin-x64` | `>=2.10.2` | `2.78.1` | optionalDependencies | Internal workspace package |
| `@gsd-build/engine-linux-arm64-gnu` | `>=2.10.2` | `2.78.1` | optionalDependencies | Internal workspace package |
| `@gsd-build/engine-linux-x64-gnu` | `>=2.10.2` | `2.78.1` | optionalDependencies | Internal workspace package |
| `@gsd-build/engine-win32-x64-msvc` | `>=2.10.2` | `2.78.1` | optionalDependencies | Internal workspace package |
| `fsevents` | `~2.3.3` | `2.3.3` | optionalDependencies | macOS filesystem events (optional) |
| `koffi` | `^2.9.0` | `2.16.1` | optionalDependencies | FFI bridge (optional native calls) |

### Contracts

- Package: `@gsd-build/contracts` @ `2.80.0`
- Description: Shared public contracts for GSD workspace boundaries

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| — | — | — | — | No direct dependencies |

### RPC Client

- Package: `@gsd-build/rpc-client` @ `2.80.0`
- Description: Standalone RPC client SDK for GSD — zero internal dependencies

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `@gsd-build/contracts` | `^2.80.0` | — | dependencies | Internal workspace package |

### Daemon

- Package: `@gsd-build/daemon` @ `2.80.0`
- Description: GSD daemon — background process for project monitoring and Discord integration

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `@anthropic-ai/sdk` | `^0.52.0` | `0.90.0` | dependencies | Claude API client (TypeScript) |
| `@gsd-build/contracts` | `^2.80.0` | — | dependencies | Internal workspace package |
| `@gsd-build/rpc-client` | `^2.80.0` | — | dependencies | Internal workspace package |
| `discord.js` | `^14.25.1` | `14.26.3` | dependencies | Discord bot API client |
| `yaml` | `^2.8.0` | `2.8.3` | dependencies | YAML parser/emitter |
| `zod` | `^3.24.0` | `4.3.6` | dependencies | Runtime schema validation |
| `@types/node` | `^24.12.0` | `24.12.2` | devDependencies | Node.js type definitions |
| `typescript` | `^5.4.0` | `5.9.3` | devDependencies | TypeScript compiler |

### MCP Server

- Package: `@gsd-build/mcp-server` @ `2.80.0`
- Description: MCP server exposing GSD orchestration tools for Claude Code, Cursor, and other MCP clients

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `@gsd-build/contracts` | `^2.80.0` | — | dependencies | Internal workspace package |
| `@gsd-build/rpc-client` | `^2.80.0` | — | dependencies | Internal workspace package |
| `@modelcontextprotocol/sdk` | `^1.27.1` | `1.29.0` | dependencies | MCP server/client SDK |
| `zod` | `^4.0.0` | `4.3.6` | dependencies | Runtime schema validation |
| `@types/node` | `^24.12.0` | `24.12.2` | devDependencies | Node.js type definitions |
| `typescript` | `^5.4.0` | `5.9.3` | devDependencies | TypeScript compiler |

### Native JS wrapper

- Package: `@gsd/native` @ `2.80.0`
- Description: Native Rust bindings for GSD — high-performance native modules via N-API

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| — | — | — | — | No direct dependencies |

### PI Agent Core

- Package: `@gsd/pi-agent-core` @ `2.80.0`
- Description: General-purpose agent core (vendored from pi-mono)

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| — | — | — | — | No direct dependencies |

### PI AI

- Package: `@gsd/pi-ai` @ `2.80.0`
- Description: Unified LLM API (vendored from pi-mono)

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `@anthropic-ai/sdk` | `^0.90.0` | `0.90.0` | dependencies | Claude API client (TypeScript) |
| `@anthropic-ai/vertex-sdk` | `^0.14.4` | `0.14.4` | dependencies | Claude API client for Google Vertex AI |
| `@aws-sdk/client-bedrock-runtime` | `^3.983.0` | `3.1038.0` | dependencies | AWS Bedrock Runtime client |
| `@google/genai` | `^1.40.0` | `1.50.1` | dependencies | Google Generative AI client |
| `@mistralai/mistralai` | `^1.14.1` | `1.15.1` | dependencies | Mistral API client |
| `@sinclair/typebox` | `^0.34.41` | `0.34.49` | dependencies | Type-safe JSON schema definitions |
| `ajv` | `^8.17.1` | `8.20.0` | dependencies | JSON Schema validator |
| `ajv-formats` | `^3.0.1` | `3.0.1` | dependencies | AJV format validators |
| `chalk` | `^5.6.2` | `5.6.2` | dependencies | Terminal color styling |
| `openai` | `^6.26.0` | `6.35.0` | dependencies | OpenAI API client |
| `proxy-agent` | `^6.5.0` | `6.5.0` | dependencies | HTTP(S) proxy agent support |
| `undici` | `^7.24.2` | `7.25.0` | dependencies | HTTP client |
| `zod-to-json-schema` | `^3.24.6` | `3.25.2` | dependencies | Convert Zod schemas to JSON Schema |
| `@smithy/node-http-handler` | `^4.5.0` | `4.6.1` | devDependencies | — |

### PI Coding Agent

- Package: `@gsd/pi-coding-agent` @ `2.80.0`
- Description: Coding agent CLI (vendored from pi-mono)

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `@gsd-build/contracts` | `^2.80.0` | — | dependencies | Internal workspace package |
| `@mariozechner/jiti` | `^2.6.2` | `2.6.5` | dependencies | Runtime loader for TS/ESM |
| `@silvia-odwyer/photon-node` | `^0.3.4` | `0.3.4` | dependencies | Photon image processing bindings |
| `chalk` | `^5.5.0` | `5.6.2` | dependencies | Terminal color styling |
| `diff` | `^8.0.2` | `8.0.4` | dependencies | Text diffing |
| `extract-zip` | `^2.0.1` | `2.0.1` | dependencies | Zip extraction |
| `file-type` | `^21.1.1` | `21.3.4` | dependencies | File type detection from bytes |
| `glob` | `^13.0.1` | `13.0.6` | dependencies | File globbing |
| `hosted-git-info` | `^9.0.2` | `9.0.2` | dependencies | Parse hosted Git URLs |
| `ignore` | `^7.0.5` | `7.0.5` | dependencies | gitignore-style matcher |
| `marked` | `^15.0.12` | `15.0.12` | dependencies | Markdown parser |
| `minimatch` | `^10.2.3` | `10.2.5` | dependencies | Glob pattern matching |
| `proper-lockfile` | `^4.1.2` | `4.1.2` | dependencies | Cross-process file locking |
| `sql.js` | `^1.14.1` | `1.14.1` | dependencies | SQLite compiled to WebAssembly |
| `strip-ansi` | `^7.1.0` | `7.2.0` | dependencies | Remove ANSI escape codes |
| `undici` | `^7.24.2` | `7.25.0` | dependencies | HTTP client |
| `yaml` | `^2.8.2` | `2.8.3` | dependencies | YAML parser/emitter |
| `@types/diff` | `^7.0.2` | `7.0.2` | devDependencies | Type definitions for diff |
| `@types/hosted-git-info` | `^3.0.5` | `3.0.5` | devDependencies | Type definitions for hosted-git-info |
| `@types/proper-lockfile` | `^4.1.4` | `4.1.4` | devDependencies | Type definitions for proper-lockfile |
| `@types/sql.js` | `^1.4.9` | `1.4.11` | devDependencies | Type definitions for sql.js |

### PI TUI

- Package: `@gsd/pi-tui` @ `2.80.0`
- Description: Terminal User Interface library (vendored from pi-mono)

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `chalk` | `^5.6.2` | `5.6.2` | dependencies | Terminal color styling |
| `get-east-asian-width` | `^1.3.0` | `1.5.0` | dependencies | Compute East Asian character width |
| `marked` | `^15.0.12` | `15.0.12` | dependencies | Markdown parser |
| `mime-types` | `^3.0.1` | `3.0.2` | dependencies | MIME type lookup |
| `@types/mime-types` | `^2.1.4` | `2.1.4` | devDependencies | TypeScript type definitions |
| `koffi` | `^2.9.0` | `2.16.1` | optionalDependencies | FFI bridge (optional native calls) |

### Workspace extension: google-search

- Package: `@gsd-extensions/google-search` @ `1.0.0`
- Description: Web search via Google with AI-synthesized answers and source citations

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `@google/genai` | `^1.40.0` | `1.50.1` | dependencies | Google Generative AI client |
| `@sinclair/typebox` | `^0.34.41` | `0.34.49` | dependencies | Type-safe JSON schema definitions |
| `@gsd/pi-coding-agent` | `*` | — | peerDependencies | Internal workspace package |
| `@gsd/pi-tui` | `*` | — | peerDependencies | Internal workspace package |

### Bundled extension: browser-tools

- Package: `pi-browser-tools` @ `1.0.0`

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `playwright` | `>=1.40.0` | `1.59.1` | peerDependencies | Browser automation for tests/tools |
| `sharp` | `>=0.33.0` | `0.34.5` | peerDependencies | High-performance image processing |

### Bundled extension: claude-code-cli

- Package: `@gsd/claude-code-cli` @ `1.0.0`

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| — | — | — | — | No direct dependencies |

### Bundled extension: cmux

- Package: `@gsd/cmux`
- Description: cmux integration library — used by other extensions, not an extension itself

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| — | — | — | — | No direct dependencies |

### Bundled extension: context7

- Package: `pi-extension-context7` @ `1.0.0`

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| — | — | — | — | No direct dependencies |

### Bundled extension: google-search

- Package: `pi-extension-google-search` @ `1.0.0`

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| — | — | — | — | No direct dependencies |

### Bundled extension: gsd

- Package: `pi-extension-gsd` @ `1.0.0`

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| — | — | — | — | No direct dependencies |

### Bundled extension: universal-config

- Package: `pi-extension-universal-config` @ `1.0.0`

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| — | — | — | — | No direct dependencies |

## Dependency Inventory (Apps)

### Web app

- Package: `gsd-web` @ `0.1.0`

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `@gsd-build/contracts` | `file:../packages/contracts` | — | dependencies | Internal workspace package |
| `@hookform/resolvers` | `^3.9.1` | `3.10.0` | dependencies | Validation resolvers for react-hook-form |
| `@lezer/highlight` | `^1.2.3` | `1.2.3` | dependencies | Lezer highlight helpers |
| `@mariozechner/jiti` | `^2.6.2` | `2.6.5` | dependencies | Runtime loader for TS/ESM |
| `@radix-ui/react-accordion` | `1.2.12` | `1.2.12` | dependencies | Radix UI accessible component |
| `@radix-ui/react-alert-dialog` | `1.1.15` | `1.1.15` | dependencies | Radix UI accessible component |
| `@radix-ui/react-aspect-ratio` | `1.1.8` | `1.1.8` | dependencies | Radix UI accessible component |
| `@radix-ui/react-avatar` | `1.1.11` | `1.1.11` | dependencies | Radix UI accessible component |
| `@radix-ui/react-checkbox` | `1.3.3` | `1.3.3` | dependencies | Radix UI accessible component |
| `@radix-ui/react-collapsible` | `1.1.12` | `1.1.12` | dependencies | Radix UI accessible component |
| `@radix-ui/react-context-menu` | `2.2.16` | `2.2.16` | dependencies | Radix UI accessible component |
| `@radix-ui/react-dialog` | `1.1.15` | `1.1.15` | dependencies | Radix UI accessible component |
| `@radix-ui/react-dropdown-menu` | `2.1.16` | `2.1.16` | dependencies | Radix UI accessible component |
| `@radix-ui/react-hover-card` | `1.1.15` | `1.1.15` | dependencies | Radix UI accessible component |
| `@radix-ui/react-label` | `2.1.8` | `2.1.8` | dependencies | Radix UI accessible component |
| `@radix-ui/react-menubar` | `1.1.16` | `1.1.16` | dependencies | Radix UI accessible component |
| `@radix-ui/react-navigation-menu` | `1.2.14` | `1.2.14` | dependencies | Radix UI accessible component |
| `@radix-ui/react-popover` | `1.1.15` | `1.1.15` | dependencies | Radix UI accessible component |
| `@radix-ui/react-progress` | `1.1.8` | `1.1.8` | dependencies | Radix UI accessible component |
| `@radix-ui/react-radio-group` | `1.3.8` | `1.3.8` | dependencies | Radix UI accessible component |
| `@radix-ui/react-scroll-area` | `1.2.10` | `1.2.10` | dependencies | Radix UI accessible component |
| `@radix-ui/react-select` | `2.2.6` | `2.2.6` | dependencies | Radix UI accessible component |
| `@radix-ui/react-separator` | `1.1.8` | `1.1.8` | dependencies | Radix UI accessible component |
| `@radix-ui/react-slider` | `1.3.6` | `1.3.6` | dependencies | Radix UI accessible component |
| `@radix-ui/react-slot` | `1.2.4` | `1.2.4` | dependencies | Radix UI accessible component |
| `@radix-ui/react-switch` | `1.2.6` | `1.2.6` | dependencies | Radix UI accessible component |
| `@radix-ui/react-tabs` | `1.1.13` | `1.1.13` | dependencies | Radix UI accessible component |
| `@radix-ui/react-toast` | `1.2.15` | `1.2.15` | dependencies | Radix UI accessible component |
| `@radix-ui/react-toggle` | `1.1.10` | `1.1.10` | dependencies | Radix UI accessible component |
| `@radix-ui/react-toggle-group` | `1.1.11` | `1.1.11` | dependencies | Radix UI accessible component |
| `@radix-ui/react-tooltip` | `1.2.8` | `1.2.8` | dependencies | Radix UI accessible component |
| `@uiw/codemirror-extensions-langs` | `^4.25.8` | `4.25.9` | dependencies | CodeMirror language extensions |
| `@uiw/codemirror-themes` | `^4.25.8` | `4.25.9` | dependencies | CodeMirror themes |
| `@uiw/react-codemirror` | `^4.25.8` | `4.25.9` | dependencies | CodeMirror editor wrapper |
| `@xterm/addon-fit` | `^0.11.0` | `0.11.0` | dependencies | xterm.js resize addon |
| `@xterm/xterm` | `^6.0.0` | `6.0.0` | dependencies | Terminal emulator (xterm.js) |
| `autoprefixer` | `^10.4.20` | `10.5.0` | dependencies | CSS vendor prefixing |
| `class-variance-authority` | `^0.7.1` | `0.7.1` | dependencies | Typed class variant generator |
| `clsx` | `^2.1.1` | `2.1.1` | dependencies | Conditional className utility |
| `cmdk` | `1.1.1` | `1.1.1` | dependencies | Command palette (cmdk) |
| `date-fns` | `4.1.0` | `4.1.0` | dependencies | Date utility library |
| `embla-carousel-react` | `8.6.0` | `8.6.0` | dependencies | Carousel |
| `input-otp` | `1.4.2` | `1.4.2` | dependencies | OTP input component |
| `lucide-react` | `^0.564.0` | `0.564.0` | dependencies | Icon set |
| `motion` | `^12.36.0` | `12.38.0` | dependencies | Animation library |
| `next` | `16.2.4` | `16.2.4` | dependencies | React framework (server + app router) |
| `next-themes` | `^0.4.6` | `0.4.6` | dependencies | Theme switching for Next.js |
| `node-pty` | `^1.1.0` | `1.1.0` | dependencies | Pseudo-terminal bindings |
| `react` | `19.2.5` | `19.2.5` | dependencies | UI library |
| `react-day-picker` | `9.13.2` | `9.13.2` | dependencies | Date picker |
| `react-dom` | `19.2.5` | `19.2.5` | dependencies | React DOM renderer |
| `react-hook-form` | `^7.54.1` | `7.74.0` | dependencies | Form state management |
| `react-markdown` | `^10.1.0` | `10.1.0` | dependencies | Markdown renderer for React |
| `react-resizable-panels` | `^2.1.7` | `2.1.9` | dependencies | Resizable panel layout |
| `recharts` | `2.15.0` | `2.15.0` | dependencies | Charts |
| `remark-gfm` | `^4.0.1` | `4.0.1` | dependencies | GitHub Flavored Markdown support |
| `shiki` | `^4.0.2` | `4.0.2` | dependencies | Syntax highlighting |
| `sonner` | `^1.7.1` | `1.7.4` | dependencies | Toast notifications |
| `tailwind-merge` | `^3.3.1` | `3.5.0` | dependencies | Tailwind class merge helper |
| `vaul` | `^1.1.2` | `1.1.2` | dependencies | Drawer/bottom-sheet components |
| `zod` | `^3.24.1` | `3.25.76` | dependencies | Runtime schema validation |
| `@eslint/eslintrc` | `^3.3.1` | `3.3.5` | devDependencies | ESLint config utilities |
| `@tailwindcss/postcss` | `^4.2.4` | `4.2.4` | devDependencies | Tailwind PostCSS plugin |
| `@types/node` | `^22` | `22.19.17` | devDependencies | Node.js type definitions |
| `@types/react` | `19.2.14` | `19.2.14` | devDependencies | TypeScript type definitions |
| `@types/react-dom` | `19.2.3` | `19.2.3` | devDependencies | TypeScript type definitions |
| `esbuild` | `^0.27.4` | `0.27.7` | devDependencies | JavaScript/TypeScript bundler |
| `eslint` | `^9.38.0` | `9.39.4` | devDependencies | Linting |
| `eslint-config-next` | `16.2.4` | `16.2.4` | devDependencies | Next.js ESLint rules |
| `postcss` | `8.5.12` | `8.5.12` | devDependencies | CSS transform pipeline |
| `tailwindcss` | `^4.2.4` | `4.2.4` | devDependencies | Utility-first CSS framework |
| `tw-animate-css` | `1.3.3` | `1.3.3` | devDependencies | Animation utilities |
| `typescript` | `5.7.3` | `5.7.3` | devDependencies | TypeScript compiler |

### VS Code extension

- Package: `gsd-2` @ `0.3.0`
- Description: VS Code integration for the GSD-2 coding agent — sidebar dashboard, @gsd chat participant, activity feed, conversation history, code lens, session forking, slash command completion, workflow controls, and 33 commands

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `@gsd-build/contracts` | `file:../packages/contracts` | — | dependencies | Internal workspace package |
| `@types/vscode` | `^1.95.0` | `1.110.0` | devDependencies | VS Code extension API typings |
| `@vscode/vsce` | `^3.7.1` | `3.7.1` | devDependencies | VS Code extension packaging/publishing |
| `typescript` | `^5.7.0` | `5.9.3` | devDependencies | TypeScript compiler |

### Studio (Electron app)

- Package: `@gsd/studio` @ `0.0.0`

| Package | Declared | Locked | Scope | Purpose |
|---|---:|---:|---|---|
| `@phosphor-icons/react` | `^2.1.10` | — | dependencies | Icon set |
| `react` | `^19.2.0` | — | dependencies | UI library |
| `react-dom` | `^19.2.0` | — | dependencies | React DOM renderer |
| `react-resizable-panels` | `^4.7.3` | — | dependencies | Resizable panel layout |
| `zustand` | `^5.0.8` | — | dependencies | State management |
| `@tailwindcss/vite` | `^4.2.1` | — | devDependencies | Tailwind Vite plugin |
| `@types/node` | `^22.18.6` | — | devDependencies | Node.js type definitions |
| `@types/react` | `^19.2.2` | — | devDependencies | TypeScript type definitions |
| `@types/react-dom` | `^19.2.2` | — | devDependencies | TypeScript type definitions |
| `@vitejs/plugin-react` | `^5.1.0` | — | devDependencies | Vite React plugin |
| `electron` | `^41.0.3` | — | devDependencies | Desktop runtime (Electron) |
| `electron-vite` | `^5.0.0` | — | devDependencies | Vite-based Electron build tooling |
| `tailwindcss` | `^4.2.1` | — | devDependencies | Utility-first CSS framework |
| `typescript` | `^5.9.3` | — | devDependencies | TypeScript compiler |

## Dependency Inventory (Rust)

### `native/crates/engine` (`gsd-engine`)

| Crate | Version | Purpose |
|---|---:|---|
| `napi` | `2` | Node.js N-API bindings |
| `napi-derive` | `2` | Proc-macros for N-API bindings |
| `git2` | `0.20` | Git operations (vendored libgit2) |
| `image` | `0.25` | Image decoding/processing |
| `syntect` | `5` | Syntax highlighting |
| `regex` | `1` | Regex engine |
| `serde_json` | `1` | JSON support |
| `globset` | `0.4` | Glob matcher |
| `ignore` | `0.4` | Ignore-file traversal |
| `dashmap` | `6` | Concurrent map |
| `arboard` | `3` | Clipboard access |
| `similar` | `2` | Diff utilities |
| `memchr` | `2` | Fast byte search |
| `xxhash-rust` | `0.8` | Hashing |
| `unicode-segmentation` | `1` | Grapheme segmentation |
| `unicode-width` | `0.2` | Display width |

### `native/crates/ast` (`gsd-ast`)

| Crate | Version | Purpose |
|---|---:|---|
| `ast-grep-core` | `0.39` | AST grep/rewrite core |
| `tree-sitter` + language grammars | `0.23–3.0` | Parsing for many languages |
| `phf` | `0.13` | Perfect hash maps |
| `globset` | `0.4` | Glob matcher |
| `ignore` | `0.4` | Ignore-file traversal |
| `napi` / `napi-derive` | `2` | Node.js N-API bindings |

### `native/crates/grep` (`gsd-grep`)

| Crate | Version | Purpose |
|---|---:|---|
| `grep-searcher` / `grep-regex` / `grep-matcher` | `0.1` | Ripgrep libraries |
| `ignore` | `0.4` | Ignore-file traversal |
| `rayon` | `1.10` | Parallelism |

## 2) Outdated packages

### Root (notable)

| Package | Current | Latest | Risk | Recommended action |
|---|---:|---:|---|---|
| `@anthropic-ai/sdk` | `0.90.0` | `0.95.1` | moderate | Plan upgrade + run unit/integration tests |
| `@google/genai` | `1.52.0` | `2.0.0` | moderate | Plan upgrade + run unit/integration tests |
| `@mistralai/mistralai` | `1.15.1` | `2.2.1` | moderate | Plan upgrade + run unit/integration tests |
| `diff` | `8.0.4` | `9.0.0` | moderate | Plan upgrade + run unit/integration tests |
| `file-type` | `21.3.4` | `22.0.1` | moderate | Plan upgrade + run unit/integration tests |
| `marked` | `15.0.12` | `18.0.3` | moderate | Plan upgrade + run unit/integration tests |
| `proxy-agent` | `6.5.0` | `8.0.1` | moderate | Plan upgrade + run unit/integration tests |

### Web app (notable)

| Package | Current | Latest | Risk | Recommended action |
|---|---:|---:|---|---|
| `@hookform/resolvers` | `3.10.0` | `5.2.2` | moderate | Plan upgrade (UI regression test) |
| `lucide-react` | `0.564.0` | `1.14.0` | moderate | Plan upgrade (UI regression test) |
| `next` | `16.2.4` | `16.2.6` | low | Plan upgrade (UI regression test) |
| `react` | `19.2.5` | `19.2.6` | low | Plan upgrade (UI regression test) |
| `react-day-picker` | `9.13.2` | `10.0.0` | moderate | Plan upgrade (UI regression test) |
| `react-dom` | `19.2.5` | `19.2.6` | low | Plan upgrade (UI regression test) |
| `react-resizable-panels` | `2.1.9` | `4.11.0` | moderate | Plan upgrade (UI regression test) |
| `recharts` | `2.15.0` | `3.8.1` | moderate | Plan upgrade (UI regression test) |
| `sonner` | `1.7.4` | `2.0.7` | moderate | Plan upgrade (UI regression test) |
| `zod` | `3.25.76` | `4.4.3` | moderate | Plan upgrade (UI regression test) |

Maintenance signal: `proper-lockfile@4.1.2` last published 2021-01-25 (no releases in >2 years).

### Unmaintained / maintenance risk

| Package | Current | Risk | Recommended action |
|---|---:|---|---|
| `proper-lockfile` | `4.1.2` | moderate | Replace with a maintained alternative, or isolate usage behind a minimal wrapper with timeouts/retries and strong test coverage |

## 3) Security concerns (detectable)

Source: `npm audit` (root lockfile). Web + VS Code extension lockfiles report 0 vulnerabilities in this scan.

| Package | Current | Risk | Advisory | Recommended action |
|---|---:|---|---|---|
| `@anthropic-ai/sdk` | `0.90.0` | moderate | Claude SDK for TypeScript has Insecure Default File Permissions in Local Filesystem Memory Tool | Upgrade to `0.95.1` (breaking possible) |
| `express-rate-limit` | `8.4.1` | moderate | — | Apply patch update (non-breaking) |
| `hono` | `4.12.15` | moderate | Hono: bodyLimit() can be bypassed for chunked / unknown-length requests | Apply patch update (non-breaking) |
| `ip-address` | `10.1.0` | moderate | ip-address has XSS in Address6 HTML-emitting methods | Apply patch update (non-breaking) |

## 4) Redundant dependencies

| Packages | Current | Risk | Recommended action |
|---|---|---|---|
| `jiti` and `@mariozechner/jiti` | `2.6.1` and `2.6.5` | low | Standardize on one runtime loader package |
| `minimatch` + `picomatch` + `glob` | `10.2.5` + `4.0.4` + `13.0.6` | low | Prefer one matcher API where feasible; avoid dual implementations |
| `typebox`+`ajv` and `zod` | `0.34.49`+`8.20.0` and `3.25.76` | low | Document why both exist; consider converging to one schema stack |

## 5) License concerns

Project license: MIT. Lockfile scan flags LGPL components bundled with `sharp` (libvips). Rust dependency licenses were not resolved here (recommend `cargo deny`).

| Package | Current | Risk | License | Recommended action |
|---|---:|---|---|---|
| `sharp` (bundles `@img/sharp-libvips-*`) | `sharp@0.34.5`, `@img/sharp-libvips@1.2.4` | moderate | LGPL-3.0-or-later components | Confirm distribution/compliance; if problematic, switch to a non-LGPL image pipeline |
| `git2` (Rust) / `libgit2-sys` | `git2@0.20.4`, `libgit2-sys@0.18.3+1.9.2` | low | Needs verification (vendored libgit2) | Run `cargo deny check licenses` and document/approve the resulting licenses for binary distribution |

## 6) Upgrade priority

| Priority | Package(s) | Why it matters | Recommended action |
|---:|---|---|---|
| P0 | `@anthropic-ai/sdk@0.90.0` | `npm audit` moderate (insecure default perms in local filesystem memory tool) | Upgrade to `>=0.91.1` (latest `0.95.1`), validate behavior |
| P0 | `@modelcontextprotocol/sdk` → `hono@4.12.15`, `express-rate-limit@8.4.1`, `ip-address@10.1.0` | `npm audit` moderate; MCP server may be exposed to untrusted traffic | Upgrade MCP SDK and/or pin fixed versions via `overrides` |
| P1 | `proper-lockfile@4.1.2` | Maintenance risk for critical locking primitive | Replace with maintained alternative or in-house lock strategy |
| P1 | Web majors (`zod`, `react-day-picker`, `recharts`, `react-resizable-panels`) | Large UI surface; bugfixes + long-term support | Upgrade incrementally with UI regression coverage |
| P2 | Root majors (`marked`, `proxy-agent`, `@google/genai`, `@mistralai/mistralai`) | Potential API changes affect core provider behavior | Upgrade provider libs one at a time with integration tests |

### Recommended ongoing tooling

- Add `npm audit` to CI for each lockfile (root/web/vscode-extension).
- Add Rust supply-chain checks: `cargo audit` (vulns) + `cargo deny` (licenses/bans) + optionally `cargo outdated` (versions).
