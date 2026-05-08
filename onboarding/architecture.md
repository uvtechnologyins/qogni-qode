# Architecture Overview

This repo builds **GSD (Get Shit Done)**: a local-first coding agent with multiple “surfaces” (CLI/TUI, headless automation, MCP integration, web UI, VS Code extension) backed by a shared agent core, extension system, and persistent project state.

## 1) High-level architecture

- **`gsd-pi` (root `src/`)**: product wrapper around the upstream “pi” agent; owns startup loader (`src/loader.ts`), resource syncing (`src/resource-loader.ts`), onboarding (`src/onboarding.ts`), web-mode launcher (`src/web-mode.ts`), and a CLI facade (`src/cli.ts`) that selects modes.
- **`@gsd/pi-coding-agent` (`packages/pi-coding-agent/`)**: the main SDK/engine used by `gsd-pi` to create sessions, load extensions/resources, manage settings/models, and run interactive/print/RPC modes.
- **`@gsd/pi-agent-core` (`packages/pi-agent-core/`)**: the generic agent loop: streams model responses, executes tool calls, emits events, and handles retries/cancellation.
- **`@gsd/pi-ai` (`packages/pi-ai/`)**: provider-agnostic LLM layer (Anthropic/OpenAI/Google/AWS Bedrock/Mistral + compat transports).
- **Extension system (bundled + user/project)**: extensions are discovered, enabled/disabled via a registry, and loaded into a runtime that can register tools, models/providers, commands, and hooks.
  - Bundled extensions live under `src/resources/extensions/**` and are synced into `~/.gsd/agent/extensions/**` at startup.
  - The **`gsd` extension** (`src/resources/extensions/gsd/**`) provides most “GSD workflow” behavior: worktrees, milestones/slices/tasks, SQLite-backed state, metrics, automation phases, and operator commands.
- **RPC + contracts (`@gsd-build/contracts`, `@gsd-build/rpc-client`)**: JSONL-over-stdio protocol for driving an agent session as a child process.
- **MCP integration**
  - **In-process MCP mode**: `gsd --mode mcp` starts an MCP server exposing the session’s tool registry (`src/mcp-server.ts`).
  - **Standalone MCP server package**: `@gsd-build/mcp-server` exposes higher-level “orchestration + state readers + workflow tools” over MCP (`packages/mcp-server/`).
- **Daemon (`@gsd-build/daemon`)**: long-running background orchestrator for project monitoring and Discord integration (`packages/daemon/`).
- **Web UI (`web/`)**: Next.js app that can spawn `gsd` in a PTY for a browser terminal and manage local `.gsd` files via API routes.
- **VS Code extension (`vscode-extension/`)**: spawns `gsd --mode rpc` and bridges agent events + UI prompts into VS Code.
- **Native engine (`@gsd/native` + `native/`)**: Rust N-API module (`@gsd-build/engine-*` optional deps) for high-performance utilities (grep/glob/diff/parser/highlight/image/etc.).

```mermaid
flowchart TB
  classDef svc fill:#e8f2ff,stroke:#1e6bd6,color:#0b2e6d;
  classDef store fill:#e9f9ee,stroke:#2f9e44,color:#1b5e20;
  classDef ext fill:#fff3e0,stroke:#ef6c00,color:#7a3b00;

  subgraph LocalHost["Local host (developer machine / CI runner)"]
    CLI["gsd CLI (`gsd-pi`)\nloader + cli + modes"]:::svc
    PI["@gsd/pi-coding-agent\n(session + extensions + modes)"]:::svc
    CORE["@gsd/pi-agent-core\n(agent loop + tool execution)"]:::svc
    AI["@gsd/pi-ai\n(LLM providers)"]:::svc
    NATIVE["@gsd/native + native/*\n(Rust N-API engine)"]:::svc
    EXT["Extensions runtime\n(bundled + user + project)"]:::svc

    HOME["~/.gsd/\n(agent, sessions, auth, registry)"]:::store
    PROJ["<project>/.gsd/\n(db, metrics, worktrees, runtime)"]:::store
  end

  subgraph Externals["External systems"]
    LLM["LLM APIs\n(Anthropic/OpenAI/Google/Bedrock/Mistral/...)"]:::ext
    GIT["git (worktrees, history)"]:::ext
    DISCORD["Discord / Slack / Telegram\n(remote questions + daemon)"]:::ext
    MCPHOST["MCP Hosts\n(Claude Desktop/Cursor/etc.)"]:::ext
  end

  CLI --> PI
  PI --> CORE
  CORE --> AI --> LLM
  PI --> EXT
  EXT --> HOME
  EXT --> PROJ
  CLI --> GIT
  EXT --> GIT
  NATIVE --> PI
  MCPHOST -->|"stdio MCP"| CLI
  MCPHOST -->|"stdio MCP"| MCPPkg["@gsd-build/mcp-server"]:::svc
  MCPPkg -->|"spawns RPC sessions"| CLI
  MCPPkg --> HOME
  MCPPkg --> PROJ
  DISCORD --> MCPPkg
```

## 2) Data flow

### Interactive CLI (TUI) lifecycle

```mermaid
sequenceDiagram
  participant U as User
  participant L as src/loader.ts
  participant C as src/cli.ts
  participant R as src/resource-loader.ts
  participant PI as @gsd/pi-coding-agent
  participant EXT as Extensions
  participant A as @gsd/pi-agent-core.Agent
  participant P as @gsd/pi-ai Providers
  participant FS as .gsd (home + project)

  U->>L: run `gsd ...`
  L->>L: env/bootstrap (paths, proxies, toolchain)
  L->>C: import CLI entry
  C->>R: initResources(~/.gsd/agent)
  R->>FS: sync bundled extensions/prompts
  C->>PI: buildResourceLoader + reload()
  PI->>EXT: discover + load enabled extensions
  EXT-->>PI: register tools/providers/hooks
  C->>PI: createAgentSession(...)
  PI->>A: create Agent + session wrappers
  loop turns
    U->>PI: input via TUI (InteractiveMode)
    PI->>A: prompt/steer/follow-up
    A->>P: stream model response
    P-->>A: tokens + tool calls
    A->>PI: execute tools (read/write/edit/bash + extension tools)
    PI->>FS: persist session + state (jsonl/db/metrics)
    A-->>PI: events (tool_start/end, output, cost)
    PI-->>U: render via TUI
  end
```

### Headless orchestration (`gsd headless`)

`src/headless.ts` spawns a **child** `gsd --mode rpc` process and drives it via JSONL RPC, auto-handling extension UI requests (questions/confirmations) and emitting machine-readable summaries/exit codes.

```mermaid
sequenceDiagram
  participant Or as Headless orchestrator (src/headless.ts)
  participant Rpc as RpcClient (spawns child)
  participant Child as gsd child process (--mode rpc)
  participant Sess as AgentSession
  participant ExtUI as Extension UI requests

  Or->>Rpc: start(cliPath, cwd, env)
  Rpc->>Child: spawn `node dist/cli.js --mode rpc`
  Child->>Sess: createAgentSession + runRpcMode
  Or->>Rpc: prompt("/gsd auto" | other command)
  Child-->>Rpc: JSONL events (progress/tool/cost)
  Rpc-->>Or: event callbacks
  Child-->>Rpc: extension_ui_request (blocker/question)
  Or->>Rpc: sendUIResponse(...) / inject answers
  Child-->>Rpc: completion/blocked/error events
  Or-->>Or: map status -> exit code + JSON summary
```

### MCP server modes

- **`gsd --mode mcp`**: exposes *the current session’s tool registry* over MCP stdio (`src/mcp-server.ts`).
- **`gsd-mcp-server` (`@gsd-build/mcp-server`)**: exposes *orchestration + state readers + workflow tools* and typically spawns/controls sessions via RPC (`packages/mcp-server/src/server.ts`).

## 3) Component dependencies

```mermaid
flowchart LR
  classDef pkg fill:#e8f2ff,stroke:#1e6bd6,color:#0b2e6d;
  classDef ui fill:#f3e8ff,stroke:#7c3aed,color:#3b0764;
  classDef ext fill:#fff3e0,stroke:#ef6c00,color:#7a3b00;
  classDef store fill:#e9f9ee,stroke:#2f9e44,color:#1b5e20;

  GSD["gsd-pi\n(root src/)"]:::pkg
  PIC["@gsd/pi-coding-agent"]:::pkg
  CORE["@gsd/pi-agent-core"]:::pkg
  AI["@gsd/pi-ai"]:::pkg
  NATIVE["@gsd/native\n(+ native Rust)"]:::pkg
  CONTRACTS["@gsd-build/contracts"]:::pkg
  RPC["@gsd-build/rpc-client"]:::pkg
  MCP["@gsd-build/mcp-server"]:::pkg
  DAEMON["@gsd-build/daemon"]:::pkg

  WEB["web (Next.js)"]:::ui
  VSC["vscode-extension"]:::ui
  STUDIO["studio (Electron)"]:::ui
  EXTRES["bundled extensions\nsrc/resources/extensions/**"]:::ext
  HOME["~/.gsd"]:::store
  PROJ["<project>/.gsd"]:::store

  GSD --> PIC
  PIC --> CORE
  CORE --> AI
  PIC --> NATIVE
  RPC --> CONTRACTS
  MCP --> RPC
  MCP --> CONTRACTS
  DAEMON --> RPC
  DAEMON --> CONTRACTS
  WEB --> PROJ
  WEB --> HOME
  VSC --> CONTRACTS
  GSD --> EXTRES
  EXTRES --> HOME
  EXTRES --> PROJ
```

## 4) External integrations

- **LLM providers** (via `@gsd/pi-ai`): Anthropic, OpenAI (Responses/Completions + Codex), Google (Gemini/Vertex), AWS Bedrock, Mistral, plus “OpenAI-compatible” endpoints.
- **MCP** (via `@modelcontextprotocol/sdk`): stdio servers for external hosts (Claude Desktop/Cursor/etc.).
- **git**: required at startup; used heavily for worktree creation/merge/cleanup and repo identity.
- **Remote questions + notifications**: Slack/Discord/Telegram adapters (bundled extension + standalone adapter in `@gsd-build/mcp-server`).
- **Discord daemon**: `@gsd-build/daemon` uses `discord.js` and can run an LLM-backed orchestrator from a control channel.
- **Containerization**: `docker/` provides a sandbox runtime (compose + Docker Sandbox template) and maps port `3000` for the web UI.
- **Native binaries / optional deps**: platform-specific `@gsd-build/engine-*` provide Rust N-API modules; JS fallbacks exist for some features.

## 5) Deployment topology

```mermaid
flowchart TB
  classDef proc fill:#e8f2ff,stroke:#1e6bd6,color:#0b2e6d;
  classDef ui fill:#f3e8ff,stroke:#7c3aed,color:#3b0764;
  classDef store fill:#e9f9ee,stroke:#2f9e44,color:#1b5e20;

  subgraph Host["Developer machine / workstation"]
    CLI["gsd CLI process"]:::proc
    WEBHOST["web host (Next.js standalone/dev)\nport 3000"]:::ui
    PTY["node-pty PTY sessions\n(spawn gsd/shell)"]:::proc
    VSC["VS Code extension\n(spawns gsd --mode rpc)"]:::ui
    MCPPROC["gsd-mcp-server\n(MCP stdio)"]:::proc
    DAEMON["gsd-daemon\n(launchd/background)"]:::proc
    HOME["~/.gsd"]:::store
  end

  subgraph Project["A project workspace"]
    PROJSTATE["<project>/.gsd\n(db, metrics, worktrees)"]:::store
  end

  CLI --> HOME
  CLI --> PROJSTATE
  WEBHOST --> HOME
  WEBHOST --> PROJSTATE
  WEBHOST --> PTY --> CLI
  VSC --> CLI
  MCPPROC --> CLI
  DAEMON --> CLI
```

## 6) Key abstractions

- **`Agent` (`packages/pi-agent-core/src/agent.ts`)**: stateful controller over the streaming loop; owns model/tool state, queues steering/follow-ups, cancellation, and event emission.
- **`agentLoop` (`packages/pi-agent-core/src/agent-loop.ts`)**: the turn engine; streams provider output, validates/executes tool calls (sequential/parallel), and produces structured events.
- **`AgentSession` (`packages/pi-coding-agent/src/core/agent-session.ts`)**: session wrapper around `Agent` that adds persistence (JSONL), extension integration, tool registry activation, and UI-mode coordination.
- **`ModelRegistry` + `SettingsManager` (`packages/pi-coding-agent/src/core/*`)**: resolves available models/providers and merges settings from global + project scopes.
- **`ResourceLoader` / `DefaultResourceLoader`**: loads bundled/user/project resources and drives extension discovery/loading; `gsd-pi` syncs bundled resources into `~/.gsd/agent` before reload.
- **Extension runtime (`packages/pi-coding-agent/src/core/extensions/*`)**: registers tools/commands/hooks; can also register provider/model configs before session creation (flushed into `ModelRegistry`).
- **RPC protocol (`@gsd-build/contracts`)**: JSONL framing for commands/events between hosts (VS Code/web/headless/MCP server) and a `gsd --mode rpc` child process.
- **Project state layer (bundled `gsd` extension)**: SQLite + JSON artifacts under `<project>/.gsd` to track milestones/slices/tasks, metrics, worktrees, and recovery/forensics signals.

