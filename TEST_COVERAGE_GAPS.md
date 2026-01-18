# Test Coverage Gap Analysis

This document tracks test coverage gaps from the unit/integration refactor.
Review after every change until commit.

## Status Legend
- ✅ Covered
- ⚠️ Partially covered (pure logic tested, boundary not tested)
- ❌ Not covered
- 🔄 In progress

---

## Fully Covered

| Deleted Test | Current Coverage | Status |
|--------------|------------------|--------|
| registry.test.ts (11 tests) | registry.integration.test.ts (11 tests) | ✅ |
| validators.test.ts (32 tests) | lesson-flow.integration.test.ts (25 tests) | ✅ |
| completion.test.ts - filtering | filters.unit.test.ts (50 tests) | ✅ |
| file-path-completer.test.ts - filtering | filters.unit.test.ts | ✅ |
| gitStateHash.test.ts - hash logic | gitStateHash.unit.test.ts (26 tests) | ✅ |

---

## Shell Commands (from shell.test.ts) - COVERED

### File Commands

| Command | Pure Logic | Unit Tests | Integration | Status |
|---------|------------|------------|-------------|--------|
| `ls` | resolvePath | ✅ parsing.unit | ✅ shell.integration | ✅ |
| `cat` | resolvePath | ✅ parsing.unit | ✅ shell.integration | ✅ |
| `head` | parseHeadTailArgs, getFirstNLines | ✅ parsing.unit | ✅ shell.integration | ✅ |
| `tail` | parseHeadTailArgs, getLastNLines | ✅ parsing.unit | ✅ shell.integration | ✅ |
| `mkdir` | resolvePath | ✅ parsing.unit | ✅ shell.integration | ✅ |
| `touch` | resolvePath | ✅ parsing.unit | ✅ lesson-flow (multi-file) | ✅ |
| `rm` | parseRmArgs, resolvePath | ✅ parsing.unit | ✅ shell.integration | ✅ |

### Shell Commands

| Command | Pure Logic | Unit Tests | Integration | Status |
|---------|------------|------------|-------------|--------|
| `echo` | extractRedirection | ✅ parsing.unit | ✅ shell.integration | ✅ |
| `pwd` | None (returns constant) | N/A | ✅ shell.integration | ✅ |
| `help` | None (formatting too trivial) | N/A | ✅ shell.integration | ✅ |
| `clear` | None (returns constant) | N/A | ✅ shell.integration | ✅ |
| `reset` | None (boundary only) | N/A | ❌ | ❌ trivial |

### Edge Cases

| Case | Status |
|------|--------|
| Empty command | ✅ parsing.unit.test.ts |
| Whitespace-only command | ✅ parsing.unit.test.ts |
| Extra spaces between args | ✅ parsing.unit.test.ts |

### Git Commands

| Command | Status |
|---------|--------|
| `git init` | ✅ lesson-flow.integration |
| `git add` | ✅ lesson-flow.integration |
| `git commit` | ✅ lesson-flow.integration |
| `git status` | ✅ lesson-flow.integration |
| `git log` | ✅ lesson-flow.integration |
| `git branch` | ❌ Not in lesson flow |
| `git checkout` | ❌ Not in lesson flow |

---

## Gaps - Completion Integration

| Area | Pure Logic | Integration | Status |
|------|------------|-------------|--------|
| Command completion | ✅ filterByPrefix | ❌ with real registry | ⚠️ |
| Git subcommand completion | ✅ filterByPrefix | ❌ with real registry | ⚠️ |
| File path completion | ✅ all filters | ❌ with real fs | ⚠️ |
| Branch completion | ✅ filterByPrefix | ❌ with real git | ⚠️ |

---

## gitStateHash - COVERED

| Area | Pure Logic | Integration | Status |
|------|------------|-------------|--------|
| Hash computation | ✅ djb2Hash, createStateString | N/A | ✅ |
| Integrity check logic | ✅ checkIntegrity | N/A | ✅ |
| Update decision | ✅ shouldUpdateStoredHash | N/A | ✅ |
| File change detection | N/A | ✅ gitStateHash.integration | ✅ |
| Nested directory traversal | N/A | ✅ gitStateHash.integration | ✅ |
| withHashUpdate behavior | N/A | ✅ gitStateHash.integration | ✅ |

---

## Remaining Action Items

### Unit Tests (extract pure functions)
1. [x] head/tail: parseHeadTailArgs, getFirstNLines, getLastNLines
2. [x] rm: parseRmArgs
3. [x] Already covered: resolvePath, extractRedirection, parseCommandLine
4. [x] Edge cases: empty command, whitespace-only command

### Integration Tests Needed
1. [x] Shell commands: ls, cat, head, tail, mkdir, rm (with real fs)
2. [ ] Completion: file path completion with real fs
3. [x] gitStateHash: file change detection, withHashUpdate
4. [ ] Git: branch, checkout (not in lessons)

### Intentionally Not Covered (trivial/low value)
- reset (simple fs reset, tested implicitly)

---

## Test Counts

| Type | Count | Time |
|------|-------|------|
| Unit | 155 | ~500ms |
| Integration | 72 | ~30s |
| **Total** | **227** | ~31s |

Last updated: After shell.integration and gitStateHash.integration tests
