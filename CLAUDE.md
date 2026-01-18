# Project Guidelines for Claude

## Testing Philosophy

### TDD Approach
Always use Test-Driven Development:
1. Write a failing test first
2. Implement the minimum code to make it pass
3. Refactor if needed

### Unit vs Integration Tests

**Unit tests** (`*.unit.test.ts`):
- Test pure functions only (no I/O, no side effects)
- No mocks - if you need mocks, it's not a unit test
- Fast (~500ms for all unit tests)
- Test calculations, parsing, filtering, transformations

**Integration tests** (`*.integration.test.ts`):
- Test code that crosses boundaries (filesystem, git, network)
- Use real implementations (fake-indexeddb for fs, isomorphic-git)
- Slower (~30-50s for all integration tests)
- Test service orchestration and boundary behavior

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
└── gitStateHash/
    ├── hash-utils.ts + hash-utils.unit.test.ts # Pure hash functions
    └── index.ts + index.integration.test.ts    # Hash state service
```

### Running Tests

```bash
# Run all tests
npm test

# Run only unit tests (fast)
npm test -- --run unit

# Run only integration tests
npm test -- --run integration

# Run specific test file
npm test -- --run src/lib/commands/parsing.unit.test.ts
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

### Key Principles

- **No mocks**: Extract pure functions instead of mocking
- **Boundary separation**: Keep I/O at the edges, pure logic in the core
- **Fast feedback**: Unit tests should run in milliseconds
- **Real implementations**: Integration tests use actual fs/git, not mocks
