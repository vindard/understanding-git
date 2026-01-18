# Project Guidelines for Claude

## Meta-Purpose: Learning to One-Shot Projects

This repository serves a dual purpose:

1. **Product**: An interactive Git learning playground
2. **Meta-learning**: A case study in AI-assisted development workflows

We are using this project to derive and refine a specification (`PROJECT-SPEC.md`) that could enable an AI agent to build the entire project autonomously from scratch. As we develop features incrementally, we extract patterns and requirements that would have been useful to know upfront.

### Updating PROJECT-SPEC.md

**After completing any meaningful task**, update `PROJECT-SPEC.md` to reflect learnings:

- New requirements discovered during implementation
- Constraints that weren't obvious upfront
- Quality standards that emerged from bugs or issues
- Workflow patterns that proved effective
- Decisions that should be made differently next time

The goal is that `PROJECT-SPEC.md` evolves into a document that, if given to an agent at the start of an empty repo, would enable autonomous execution of the entire project.

**What to capture:**
- Requirements (what to build)
- Constraints (technical limitations, must-use technologies)
- Quality standards (test coverage, performance, UX)
- Development philosophy (TDD, no mocks, etc.)
- Agent execution strategies (phasing, checkpoints, recovery)

**What NOT to include:**
- Specific file structures (agent decides)
- Code snippets (agent implements)
- Architecture diagrams (agent designs)
- Implementation details (agent figures out)

---

## Testing Philosophy

### TDD Approach
Always use Test-Driven Development:
1. Write a failing test first
2. Implement the minimum code to make it pass
3. Refactor if needed

### Three-Tier Test Structure

| Type | Suffix | Purpose | Speed |
|------|--------|---------|-------|
| **Unit** | `*.unit.test.ts` | Pure functions | ~500ms |
| **Integration** | `*.integration.test.ts` | Single service boundary | ~30s |
| **E2E** | `*.e2e.test.ts` | Multiple services together | ~15s |

**Unit tests** (`*.unit.test.ts`):
- Test pure functions only (no I/O, no side effects)
- No mocks - if you need mocks, it's not a unit test
- Test calculations, parsing, filtering, transformations

**Integration tests** (`index.integration.test.ts`):
- Test code that crosses a single boundary (filesystem, git)
- Use real implementations (fake-indexeddb for fs, isomorphic-git)
- **MUST be named `index.integration.test.ts`** - no other naming allowed
- Located at `<service>/index.integration.test.ts`

**E2E tests** (`*.e2e.test.ts`):
- Test multiple services working together
- Verify user-facing flows (e.g., lesson progression)
- Example: `lesson-flow.e2e.test.ts` tests commands + validators + fs + git

### File Structure Pattern

Services get their own folder with this structure:
```
src/lib/<service>/
├── <pure-module>.ts           # Pure functions
├── <pure-module>.unit.test.ts # Unit tests for pure functions
├── index.ts                   # Service entry point (boundary code)
└── index.integration.test.ts  # Integration tests for the service
```

Example:
```
src/lib/gitStateHash/
├── hash-utils.ts              # Pure: djb2Hash, createStateString, checkIntegrity
├── hash-utils.unit.test.ts
├── index.ts                   # Service: updateGitStateHash, repoIntact, withHashUpdate
└── index.integration.test.ts
```

### Current Test Structure

```
src/lib/
├── commands/
│   ├── parsing.ts + parsing.unit.test.ts       # Pure parsing functions
│   ├── registry.ts + registry.unit.test.ts     # Pure registry queries
│   ├── index.ts + index.integration.test.ts    # Command execution service
│   └── [file-commands.ts, git-commands.ts, shell-commands.ts]
│
├── completion/
│   ├── filters.ts + filters.unit.test.ts       # Pure filtering functions
│   ├── index.ts + index.integration.test.ts    # Completion service
│   └── strategies/
│       └── lesson-completer.ts + lesson-completer.unit.test.ts
│
├── fs/
│   ├── index.ts + index.integration.test.ts    # Filesystem service (no pure functions - thin I/O wrapper)
│
└── gitStateHash/
    ├── hash-utils.ts + hash-utils.unit.test.ts # Pure hash functions
    └── index.ts + index.integration.test.ts    # Hash state service
```

**Note**: Some services like `fs/` have no pure functions because they are thin wrappers around I/O libraries. This is acceptable - not every service needs pure function extraction.

### Running Tests

```bash
# Run all tests
just test

# Run only unit tests (fast, ~500ms)
just test-unit

# Run only integration tests (~30s)
just test-integration

# Run only e2e tests (~15s)
just test-e2e

# Run specific test file
pnpm test -- --run src/lib/commands/parsing.unit.test.ts
```

### When Adding New Features

1. Identify if the logic is pure or crosses a boundary
2. For pure logic:
   - Add to or create `<module>.ts`
   - Write failing test in `<module>.unit.test.ts`
   - Implement until test passes
3. For boundary/service code:
   - Add to or create `index.ts` in a service folder
   - Write failing test in `index.integration.test.ts`
   - Implement until test passes
4. For user-facing flows (e.g., new lessons):
   - Write failing test in `lesson-flow.e2e.test.ts`
   - Implement until test passes

### When Fixing Bugs

Use the **failing test first** workflow with two separate commits:

1. **First commit: Add failing test**
   - Write a test that reproduces the bug
   - Verify the test fails (proves the bug exists)
   - Commit with message like: `test: add failing test for <bug description>`

2. **Second commit: Fix the bug**
   - Implement the fix
   - Verify the test now passes
   - Commit with message like: `fix: <bug description>`

This workflow:
- Documents the bug in the test history
- Proves the fix actually addresses the bug
- Prevents regressions (the test remains in the suite)
- Makes code review easier (reviewer sees bug reproduction, then fix)

### Key Principles

- **No mocks, but stubs are OK**: Extract pure functions instead of mocking dependencies. Stubs (minimal placeholder implementations that return hardcoded values) are acceptable as intermediate TDD steps - write the stub so tests run with assertion failures, then implement the real logic.
- **Boundary separation**: Keep I/O at the edges, pure logic in the core
- **Fast feedback**: Unit tests should run in milliseconds
- **Real implementations**: Integration tests use actual fs/git, not mocks
- **Explicit pure functions**: All pure functions must be in dedicated `<module>.ts` files with corresponding `<module>.unit.test.ts` tests. No implicit pure logic hiding in service files. If a service has no pure functions (e.g., thin wrappers around I/O), that's fine - just document it.
