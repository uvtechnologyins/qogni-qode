# Review Scope (qogni-qode)

## In Scope
- Repository-wide review of tracked source and configuration, with emphasis on: `src/`, `packages/`, `gsd-orchestrator/`, `web/`, `studio/`, `extensions/`, `vscode-extension/`, `native/`, `docs/`, `scripts/`, `tests/`, `docker/`, `pkg/` (excluding generated artifacts).

## Objectives
- Identify production-risk issues (correctness, reliability, security) and verify expected behavior in critical paths.
- Assess API/CLI/UI contracts for breaking changes and compatibility.
- Validate test coverage for changed/critical logic and highlight gaps.
- Flag performance regressions (hot paths, excessive I/O, memory growth) where likely.

## Known Concerns
- No specific concerns provided beyond exclusions; treat as general release-readiness review.
- Recent history indicates fixes around `gsd` stale recovery/replay and timeouts; scrutinize idempotency, race conditions, and state transitions in `gsd-orchestrator/` and any shared workflow/runtime code.

## Out of Scope
- `.qogni/` and `.qogni-agent-projection/`
- All `**/node_modules/`
- All build outputs: `**/dist/`, `**/dist-test/`, `pkg/dist/`

## Acceptance Criteria
- Clear list of prioritized findings (must-fix vs nice-to-have) with concrete file-level pointers and suggested remediation.
- No unresolved P0/P1 issues in critical paths (security, data loss/corruption, crashes, auth/secrets handling, workflow execution correctness).
- Review notes include test recommendations and a minimal verification checklist for maintainers.
