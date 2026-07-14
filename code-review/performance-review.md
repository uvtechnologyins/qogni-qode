# Performance Review (qogni-qode)

Scope reference: `code-review/scope.md`

This review focuses on changes that can meaningfully reduce latency, CPU, memory, and I/O cost in user-facing paths (CLI/TUI + web dashboard).

---

## 1) Database queries (N+1, missing indexes, unbounded queries)

### Finding: N+1 DB access in memory graph traversal
- **Impact:** medium (can become high with large memory graphs or frequent UI polling)
- **Where:** `src/resources/extensions/gsd/memory-relations.ts:125`
- **Current behavior:** `traverseGraph()` performs multiple SQLite queries per visited node:
  - node fetch (`SELECT ... FROM memories WHERE id = :id`)
  - predecessor scan (`SELECT id FROM memories WHERE superseded_by = :id`)
  - outgoing edges (`SELECT ... FROM memory_relations WHERE from_id = :id`)
  - incoming edges (`SELECT ... FROM memory_relations WHERE to_id = :id`)
  With many reachable nodes, this turns into “queries-per-node”, increasing latency and CPU due to repeated `prepare/all/get` calls.
- **Expected improvement:** reduce round-trips to ~O(depth) queries (depth is already capped to 5) and reduce JS overhead; improves responsiveness of graph/visualizer tools and reduces cost of repeated calls.
- **Recommended fix (code suggestion):** switch to level-by-level batching using `IN (...)` lists instead of per-node queries.

  Example shape (pseudo-code, keep bind parameters):
  ```ts
  // 1) startIds = [startId]
  // 2) for each hop:
  //    - fetch nodes in batch
  //    - fetch edges in batch
  //    - derive next frontier from edges
  const ids = frontierIds; // string[]
  const placeholders = ids.map((_, i) => `:id${i}`).join(", ");
  const params = Object.fromEntries(ids.map((id, i) => [`:id${i}`, id]));

  const nodeRows = adapter.prepare(
    `SELECT id, category, content, confidence, superseded_by FROM memories WHERE id IN (${placeholders})`
  ).all(params);

  const edgeRows = adapter.prepare(
    `SELECT from_id, to_id, rel, confidence, created_at
       FROM memory_relations
      WHERE from_id IN (${placeholders}) OR to_id IN (${placeholders})`
  ).all({ ...params, ...params2 /* second set if needed */ });
  ```
  If you want to go further, a recursive CTE can do bounded-depth traversals in one query, but the batching approach is usually the best tradeoff for maintainability.

### Finding: Sorting hot paths without supporting indexes (sequence ordering)
- **Impact:** medium (shows up as “death by a thousand cuts” during auto-mode + dashboard refreshes, especially as projects grow)
- **Where:** `src/resources/extensions/gsd/gsd-db.ts:1350`, `src/resources/extensions/gsd/gsd-db.ts:1613`, `src/resources/extensions/gsd/gsd-db.ts:1644`
- **Current behavior:**
  - `getSliceTasks()` runs `... WHERE milestone_id = :mid AND slice_id = :sid ORDER BY sequence, id` (`src/resources/extensions/gsd/gsd-db.ts:1352`)
  - `getMilestoneSlices()` runs `... WHERE milestone_id = :mid ORDER BY sequence, id` (`src/resources/extensions/gsd/gsd-db.ts:1646`)
  - `getActiveSliceFromDb()` and `getActiveTaskFromDb()` also order by `sequence, id` and apply a `LIMIT 1` (`src/resources/extensions/gsd/gsd-db.ts:1618`, `src/resources/extensions/gsd/gsd-db.ts:1637`)
  Existing indexes (e.g. `idx_tasks_active ON tasks(milestone_id, slice_id, status)` in `src/resources/extensions/gsd/db-migration-steps.ts:213`) help filtering, but not ordering by `sequence`.
- **Expected improvement:** avoid SQLite temp sort work; improve “find next unit / active task / active slice” latency as rows grow; reduces CPU and disk I/O under WAL.
- **Recommended fix (code suggestion):** add covering/composite indexes that match the filter + order patterns.

  Example migration DDL (new schema version):
  ```sql
  CREATE INDEX IF NOT EXISTS idx_tasks_slice_sequence
    ON tasks(milestone_id, slice_id, sequence, id);
  CREATE INDEX IF NOT EXISTS idx_slices_milestone_sequence
    ON slices(milestone_id, sequence, id);
  ```
  For “active task” queries, optionally add:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_tasks_active_sequence
    ON tasks(milestone_id, slice_id, status, sequence, id);
  ```
  (Whether you need the latter depends on how many tasks are in non-complete states; measure with `EXPLAIN QUERY PLAN`.)

### Finding: Extra query on memory source insert path (can be 2x work in common case)
- **Impact:** low to medium (depends on ingestion frequency; reduces work per source)
- **Where:** `src/resources/extensions/gsd/memory-source-store.ts:73`
- **Current behavior:** `createMemorySource()` runs a `SELECT id ... WHERE content_hash = :h` first, then inserts via `insertMemorySourceRow(...)` (`src/resources/extensions/gsd/memory-source-store.ts:80`).
- **Expected improvement:** common non-duplicate ingestion path becomes 1 DB statement instead of 2; reduces CPU and lock time in WAL mode.
- **Recommended fix (code suggestion):** rely on the `UNIQUE` constraint on `memory_sources.content_hash` (`src/resources/extensions/gsd/db-migration-steps.ts:332`) and use `INSERT ... ON CONFLICT DO NOTHING RETURNING ...` (SQLite ≥ 3.35) or `INSERT OR IGNORE` + follow-up `SELECT` only on conflict.

  Example approach:
  ```ts
  // In gsd-db.ts: expose an insert that returns whether it inserted.
  const inserted = currentDb.prepare(`
    INSERT INTO memory_sources (id, kind, uri, title, content, content_hash, imported_at, scope, tags)
    VALUES (:id, :kind, :uri, :title, :content, :content_hash, :imported_at, :scope, :tags)
    ON CONFLICT(content_hash) DO NOTHING
    RETURNING id
  `).get(params);
  ```

---

## 2) Memory patterns (leaks, large allocations, unbounded caches)

### Finding: PTY sessions can leak processes and memory after client disconnect
- **Impact:** high (spawns long-lived shells; increases CPU/memory; can exhaust file descriptors on busy servers)
- **Where:** `web/lib/pty-manager.ts:249`, `web/app/api/terminal/stream/route.ts:21`
- **Current behavior:**
  - SSE disconnect removes only the listener (`removeListener?.()`) but does not destroy the PTY session (`web/app/api/terminal/stream/route.ts:71`).
  - Sessions are stored in a global `Map` that persists across HMR/module reloads (`web/lib/pty-manager.ts:32`) and are only destroyed on explicit `DELETE /api/terminal/sessions` or process exit.
  - Each session buffers up to 1 MiB (`MAX_SESSION_BUFFER_BYTES`) plus holds an OS process (`node-pty` spawned shell).
- **Expected improvement:** bounded resource usage even if clients refresh/navigate; fewer zombie shells; lower memory footprint and better server stability.
- **Recommended fix (code suggestion):** implement idle reaping tied to “no listeners” + last activity timestamps.

  Minimal implementation idea:
  ```ts
  // web/lib/pty-manager.ts
  // - track session.lastActiveAt (onData / on write)
  // - when a listener is removed and listeners.size === 0, schedule a timeout
  // - if still no listeners after N seconds, destroySession(sessionId)
  ```
  Additionally, consider an explicit “close on disconnect” mode in `web/app/api/terminal/stream/route.ts` (query flag) when the UX expects terminals to die with the tab.

### Finding: Unbounded in-session cache for Google Search tool
- **Impact:** medium (long-running sessions can accumulate large responses; higher memory usage)
- **Where:** `extensions/google-search/index.ts:169`
- **Current behavior:** `resultCache` is a process-global `Map` with no max size or TTL; every unique query adds an entry (`extensions/google-search/index.ts:249` and later `resultCache.set(key, result)`).
- **Expected improvement:** predictable memory usage; avoids worst-case OOM in long-lived agent processes.
- **Recommended fix (code suggestion):** bound the cache (LRU + TTL). For example:
  ```ts
  const MAX_ENTRIES = 100;
  const TTL_MS = 10 * 60_000;
  // store { value, expiresAt }, delete on get if expired,
  // and evict oldest when size > MAX_ENTRIES.
  ```

### Finding: Prepared statement cache can grow unbounded if SQL strings vary
- **Impact:** low (currently most SQL is static; risk increases if dynamic SQL is added)
- **Where:** `src/resources/extensions/gsd/db-adapter.ts:39`
- **Current behavior:** `stmtCache` is a `Map<string, DbStatement>` with no size cap; any unique SQL string is cached forever until adapter close.
- **Expected improvement:** prevents accidental memory growth from future dynamic-query additions.
- **Recommended fix (code suggestion):** cap cache size (e.g. 200–500 statements) with simple FIFO eviction, or only cache statements that are known static (e.g. via a small wrapper that opts-in).

---

## 3) I/O patterns (sync blocking, connection pooling)

### Finding: Synchronous filesystem scanning/reading in web project discovery path
- **Impact:** medium to high (blocks Node.js event loop; visible latency spikes when scanning large dev roots)
- **Where:** `src/web/project-discovery-service.ts:84`
- **Current behavior:** `discoverProjects()` uses `readdirSync`, `statSync`, and optionally `readFileSync` for each project’s `.gsd/STATE.md` (`src/web/project-discovery-service.ts:35`, `src/web/project-discovery-service.ts:104`).
- **Expected improvement:** smoother web UI (no request stalls), better throughput under concurrent users, less tail-latency.
- **Recommended fix (code suggestion):**
  - Convert to async `fs.promises` APIs.
  - Add a concurrency limit for `stat`/`readFile` (e.g. 10–20 in-flight ops).
  - Cache `readProjectProgress()` results keyed by `(projectPath, stateMtimeMs)` to avoid re-reading on every request.

  Sketch:
  ```ts
  const entries = await fs.promises.readdir(devRootPath, { withFileTypes: true });
  // then Promise.all with p-limit for stat/read
  ```

### Finding: SQLite access is synchronous by design; “pooling” is not the bottleneck, but open/close work can be
- **Impact:** low (mostly fine; call out for growth)
- **Where:** `src/resources/extensions/gsd/gsd-db.ts:563`
- **Current behavior:** `closeDatabase()` performs `wal_checkpoint(TRUNCATE)` and `incremental_vacuum(64)` every close. If callers open/close frequently, this adds noticeable I/O.
- **Expected improvement:** lower per-command overhead in workloads that churn DB connections.
- **Recommended fix (code suggestion):**
  - Prefer keeping the connection open for the process lifetime (already the default).
  - If you must close often, gate checkpoint/vacuum behind “dirty writes happened” or a time-based throttle.

---

## 4) Algorithm complexity (O(n²) or worse in hot paths)

### Finding: Queue `.shift()` in traversal/topo sorts can become O(n²)
- **Impact:** low to medium (depends on graph size; avoidable overhead in JS)
- **Where:** `src/resources/extensions/gsd/memory-relations.ts:139`, `src/resources/extensions/gsd/visualizer-data.ts:279`
- **Current behavior:** using `queue.shift()` inside `while (queue.length)` loops repeatedly causes array reindexing; large queues degrade toward O(n²).
- **Expected improvement:** better CPU efficiency for large graphs; smoother visualizer rendering.
- **Recommended fix (code suggestion):** use an index pointer instead:
  ```ts
  let qIdx = 0;
  while (qIdx < queue.length) {
    const item = queue[qIdx++];
    // ...
  }
  ```

---

## 5) Caching opportunities (repeated expensive computations)

### Finding: Repeated `.gsd/STATE.md` parsing can be cached by mtime
- **Impact:** medium (especially when the UI polls project lists/progress)
- **Where:** `src/web/project-discovery-service.ts:35`
- **Current behavior:** `readProjectProgress()` reads and splits the entire file each call.
- **Expected improvement:** reduced disk reads and CPU; more responsive project dashboard.
- **Recommended fix (code suggestion):** maintain a small in-memory cache:
  - Key: `projectPath`
  - Value: `{ mtimeMs, parsedProgress }`
  - Invalidate when `statSync(statePath).mtimeMs` changes (or async equivalent).

---

## 6) Bundle/payload size concerns (frontend)

### Finding: Heavy visualization libraries should stay off critical-path bundles
- **Impact:** low to medium (depends on whether the component is actually used on initial routes)
- **Where:** `web/components/ui/chart.tsx:4`
- **Current behavior:** `recharts` is imported in a `"use client"` component; if this component is pulled into the initial client chunk, it increases JS payload and parse/execute time.
- **Expected improvement:** faster initial load and interaction on low-end machines.
- **Recommended fix (code suggestion):**
  - Prefer route-level code splitting (dynamic import) for rarely-used charts.
  - If charts are optional panels, wrap them in `next/dynamic(() => import(...), { ssr: false })`.

