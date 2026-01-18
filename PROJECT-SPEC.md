# Project Specification: Understanding Git

**Document Type**: Forward-looking agent execution specification
**Purpose**: Enable AI agents to autonomously build this project from scratch
**Estimated Duration**: 6-10 hours across multiple agent sessions

---

## Table of Contents

1. [Product Vision](#product-vision)
2. [User Stories & Requirements](#user-stories--requirements)
3. [Technical Constraints](#technical-constraints)
4. [Development Philosophy](#development-philosophy)
5. [Agent Execution Strategy](#agent-execution-strategy)
6. [Multi-Agent Orchestration](#multi-agent-orchestration)
7. [Quality Standards](#quality-standards)
8. [Success Criteria](#success-criteria)

---

## Product Vision

### The Problem

Learning git is intimidating for beginners:
- Fear of breaking things on a real system
- Abstract concepts (staging, branches, commits) are hard to visualize
- Command line interface is unfamiliar
- No safe place to experiment and make mistakes

### The Solution

A browser-based interactive Git playground where users learn Git through hands-on exercises. Users type real git commands in a terminal, see files change in a virtual filesystem, and progress through guided lessons.

### Key Insight

Use `isomorphic-git` (pure JavaScript Git implementation) to run **real** git operations entirely in the browser—not simulated, but actual git. Pair with `lightning-fs` (IndexedDB-backed filesystem) for a complete virtual environment.

### Target User

Complete beginners who have never used git. They should be able to:
- Open the app in a browser (no installation)
- Follow guided lessons from "git init" to basic branching
- Make mistakes safely and reset anytime
- Build muscle memory through repetition

---

## User Stories & Requirements

### Core Experience

**As a learner, I want to:**

1. **Practice git commands in a safe environment**
   - Type commands in an interactive terminal
   - See realistic output (colors, formatting like real git)
   - Cannot break anything—reset anytime

2. **Follow progressive lessons**
   - Start with basics (init, status)
   - Progress through staging, commits, viewing history
   - Learn branching fundamentals
   - Each lesson builds on previous knowledge

3. **Get immediate visual feedback**
   - See file tree update as I create/modify files
   - View file contents when I select them
   - See current lesson instructions and progress

4. **Know when I've completed an exercise**
   - Exercises validate that I did the right thing
   - Clear success messages when complete
   - Automatic progression to next exercise

5. **Get help when stuck**
   - Hints available for each exercise
   - Commands are suggested/autocompleted
   - Can reset and start over if needed

### Lesson Content

The app must include lessons covering:

1. **Repository basics**: `git init`, `git status`
2. **Tracking files**: Creating files, `git add`, staging concept
3. **Making commits**: `git commit`, viewing with `git log`
4. **The edit-stage-commit cycle**: Modifying files, staging changes, committing
5. **Working with multiple files**: Batch operations, `git add .`
6. **Branching basics**: Creating branches, switching branches

### Terminal Requirements

The terminal must support:
- Common shell commands: `ls`, `cat`, `touch`, `mkdir`, `rm`, `echo`, `pwd`, `clear`
- Git commands: `init`, `status`, `add`, `commit`, `log`, `branch`, `checkout`
- Tab autocomplete for commands, file paths, git subcommands, branch names
- Command history (up/down arrows)
- Standard cursor navigation and line editing

### Validation Requirements

Exercises must validate **state**, not just commands:
- "Create a file" → check file exists
- "Stage a file" → check file is staged
- "Make a commit" → check commit exists
- Validators must remain true after completing subsequent exercises (no false negatives)

---

## Technical Constraints

### Must Use

| Technology | Reason |
|------------|--------|
| React + TypeScript | Modern, type-safe UI development |
| Vite | Fast development and build |
| isomorphic-git | Only way to run real git in browser |
| lightning-fs | Required by isomorphic-git for browser filesystem |
| xterm.js | Industry-standard terminal emulator |

### Should Use

| Technology | Reason |
|------------|--------|
| Monaco Editor | VS Code engine, excellent code viewing |
| Resizable panes | VS Code-like UX, user control over layout |
| Vitest | Fast, Vite-native testing |

### Browser Constraints

- All data stored in IndexedDB (no server)
- Must work offline after initial load
- No backend required

---

## Development Philosophy

### Test-Driven Development

**MANDATORY**: Every feature follows TDD:

```
1. Write a failing test
2. Implement minimum code to pass
3. Refactor if needed
4. Commit
```

**For bug fixes, use two commits:**
1. First commit: Add failing test that reproduces the bug
2. Second commit: Fix the bug

### Three-Tier Test Structure

| Tier | Purpose | Speed Target |
|------|---------|--------------|
| Unit | Pure functions, no I/O | < 1 second |
| Integration | Single service with real I/O | < 30 seconds |
| E2E | Multiple services, user flows | < 30 seconds |

### No Mocks

Do not use mocking libraries. Instead:
- Extract pure functions that can be unit tested without mocks
- Test I/O code with integration tests using real implementations
- Use `fake-indexeddb` for testing (it's a real IndexedDB implementation, not a mock)

### Code Organization

- Separate pure logic from I/O
- Pure functions should be independently testable
- Services should have clear boundaries
- Colocate tests with source files

### Commit Conventions

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructure (no behavior change)
- `test:` - Add or modify tests
- `chore:` - Maintenance

---

## Agent Execution Strategy

### Execution Models

This specification supports two execution models:

**Model A: Single Long-Running Agent**
- One agent executes all phases sequentially
- Uses subagents for exploration/research to conserve context
- Commits after each major milestone
- Can resume session if interrupted

**Model B: Orchestrated Multi-Agent System**
- Orchestrator agent coordinates work
- Delegates phases to specialized agents
- Verifies completion before proceeding
- Handles failures with retry/rollback

### Phased Approach

Break the work into phases with clear boundaries:

1. **Foundation**: Project setup, build tooling, test framework
2. **Core Services**: Filesystem abstraction, git operations wrapper
3. **Command System**: Terminal command parsing and execution
4. **User Interface**: Terminal component, file browser, editor integration
5. **Lesson System**: Lesson content, validation, progress tracking
6. **Polish**: Edge cases, error handling, deployment

Each phase should:
- Have clear completion criteria
- Be independently testable
- Result in a commit
- Not break previous phases

### Checkpoint Strategy

After each phase:
1. Run full test suite
2. Verify no regressions
3. Commit with descriptive message
4. Only proceed if all tests pass

### Context Management

For long-running sessions:
- Use subagents for exploration to avoid filling context with search results
- Write intermediate findings to files rather than keeping in context
- Commit frequently so git history serves as external memory
- Reference this spec document rather than re-reading it

### Session Resumption

If session is interrupted:
1. Check git log for recent work
2. Run test suite to see current state
3. Read this spec to re-orient
4. Continue from last incomplete phase

---

## Multi-Agent Orchestration

### When to Use Multi-Agent

Consider multi-agent when:
- Total work exceeds 4-6 hours
- Phases are independently testable
- Some phases can run in parallel
- Context limits are a concern

### Agent Roles

| Role | Responsibility |
|------|----------------|
| **Orchestrator** | Coordinates phases, verifies completion, handles failures |
| **Explorer** | Analyzes requirements, researches approaches, documents findings |
| **Implementer** | Writes code following spec and patterns |
| **Tester** | Runs tests, reports failures with context |
| **Debugger** | Fixes failing tests, investigates issues |

### Orchestration Patterns

**Pattern 1: Sequential with Verification**
```
For each phase:
  1. Delegate to Implementer
  2. Run Tester to verify
  3. If failed: Delegate to Debugger, then re-test
  4. If passed: Commit and proceed
```

**Pattern 2: Parallel Independent Work**
```
Identify phases with no dependencies
Run them in parallel
Wait for all to complete
Then proceed with dependent phases
```

**Pattern 3: Explore-Then-Implement**
```
1. Explorer analyzes codebase/requirements
2. Explorer writes findings to file
3. Implementer reads findings, implements with full context
```

### Communication Between Agents

- Write analysis/findings to files in `.claude/context/`
- Commit messages document what was completed
- Tests serve as executable specifications
- Session resumption preserves conversation context

### Failure Handling

```
If phase fails:
  1. Capture error context
  2. Attempt fix (up to 3 times)
  3. If still failing: Rollback to last good commit
  4. Report to human with context
```

---

## Quality Standards

### Test Coverage

- All pure functions must have unit tests
- All services must have integration tests
- Complete lesson flows must have E2E tests
- No code merged with failing tests

### Code Quality

- TypeScript strict mode
- ESLint with no errors
- No `any` types (except when truly necessary)
- Build must succeed without warnings

### User Experience

- Terminal must feel responsive
- Autocomplete must be helpful, not intrusive
- Error messages must be clear
- Lesson progression must be intuitive

### Performance

- App must load in < 3 seconds
- Commands must execute in < 100ms
- No visible lag when typing

---

## Success Criteria

### Minimum Viable Product

The project is complete when:

1. **Lessons work end-to-end**
   - User can complete all 6 lessons in sequence
   - Each exercise validates correctly
   - Progress is tracked

2. **Terminal is functional**
   - All required commands work
   - Autocomplete helps users
   - Output matches expectations

3. **Tests pass**
   - Unit tests: < 1 second
   - Integration tests: < 30 seconds
   - E2E tests: < 30 seconds
   - All green

4. **Quality gates pass**
   - TypeScript compiles
   - ESLint passes
   - Build succeeds

5. **Deployable**
   - Can be deployed to Vercel (or similar)
   - Works in modern browsers

### Acceptance Test

Final verification:
```
1. Fresh clone of repository
2. Install dependencies
3. Run all checks (typecheck, lint, test, build)
4. Start dev server
5. Complete all 6 lessons manually in browser
6. Verify reset works and can start over
```

---

## Self-Healing & Recovery

### When Tests Fail

1. Read error message carefully
2. Find the test to understand expectations
3. Implement minimum fix
4. Re-run tests
5. If failing after 3 attempts: reconsider approach

### When Stuck

1. Re-read relevant section of this spec
2. Check if similar problem was solved elsewhere in codebase
3. Consider simpler approach
4. If truly stuck: document the blocker and ask for help

### Never Do

- Skip failing tests and move on
- Modify tests to make them pass (unless test is wrong)
- Commit with failing tests
- Continue to next phase without checkpoint passing
- Add complexity without clear need

### Rollback Strategy

If a phase goes wrong:
```
git log --oneline -5    # Find last good commit
git reset --hard <sha>  # Reset to it
# Restart phase from beginning
```

---

## Decision Framework

### When Facing Ambiguity

| Situation | Approach |
|-----------|----------|
| Multiple valid approaches | Choose simplest that meets requirements |
| Unclear requirement | Implement minimal version, note assumption |
| Performance vs simplicity | Choose simplicity unless perf is measurably bad |
| Feature creep temptation | Only implement what spec requires |

### When to Ask for Help

Pause and report if:
- Same issue persists after 5 fix attempts
- Fundamental approach seems wrong
- Spec seems contradictory or impossible
- External dependency is broken/incompatible

---

## Start Execution

1. Read this spec completely
2. Plan your phases
3. Start with foundation (project setup, tooling)
4. Follow TDD: test first, then implement
5. Commit after each milestone
6. Verify tests pass before proceeding

If interrupted: check git log, run tests, continue from last incomplete phase.

Build something that helps people learn git.
