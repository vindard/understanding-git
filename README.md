# 🌳 Understanding Git

An interactive web-based git playground with curated exercises designed to teach and provide hands-on practice with git concepts.

**Live Demo:** [understanding-git.vercel.app](https://understanding-git.vercel.app/)

## 📖 About

Learning git can be challenging - the command line interface, abstract concepts like branches and merges, and the fear of breaking things can make it intimidating for beginners. This project aims to solve that by providing a safe, browser-based environment where users can:

- Practice git commands without fear of breaking anything
- Follow guided lessons that introduce concepts progressively
- See immediate visual feedback as files and the repository state change
- Build muscle memory through hands-on exercises

## 🎯 Current Status

The app is functional with 6 foundational lessons covering git basics. The codebase has a robust test suite (360 tests) organized into three tiers: unit tests for pure functions, integration tests for service boundaries, and e2e tests for lesson flows.

**What works well:**
- Complete terminal experience with autocomplete and history
- All basic git operations (init, add, commit, status, log, branch, checkout)
- Guided lessons with validation and progress tracking
- Environment integrity detection (warns if state becomes inconsistent)
- Progress persistence with resume prompt on return visits

## ✨ Features

### Implemented

- **Virtual Filesystem**: In-browser filesystem using IndexedDB that persists during session
- **Git Operations**: Core git commands powered by isomorphic-git
  - `git init` - Initialize a repository
  - `git add` - Stage files (supports `.` for all files)
  - `git commit -m` - Commit changes with message
  - `git status` - View repository status (with color-coded output)
  - `git log` - View commit history
  - `git branch` - List and create branches
  - `git checkout` - Switch branches
- **Interactive Terminal**: Full terminal emulator with:
  - Tab autocomplete for commands, file paths, git subcommands, and branches
  - Shift+Tab to cycle backward through autocomplete suggestions
  - Command history navigation (up/down arrows)
  - Cursor navigation (left/right arrows, Home/End, Ctrl+A/E)
  - Word navigation (Alt+Left/Right)
  - Line editing (Backspace, Delete, Ctrl+U, Ctrl+K, Ctrl+W)
  - Color-coded output
- **File Explorer**: Visual tree view of the virtual filesystem
- **File Viewer**: Monaco editor integration for viewing file contents
- **Resizable Panes**: VS Code-like draggable panel layout with expand/fullscreen modes
- **Shell Commands**: Filesystem and utility commands
  - `ls` - List directory contents
  - `cat` - Display file contents
  - `head` / `tail` - Display first/last lines of a file (with `-n` option)
  - `touch` - Create files (supports multiple files)
  - `mkdir` - Create directories
  - `rm` - Remove files (with `-r` for directories)
  - `echo` - Output text (with `>` and `>>` redirection)
  - `pwd` - Print working directory
  - `clear` - Clear terminal screen
  - `reset` - Reset environment to start fresh
  - `help` - Show available commands
- **Lesson System**: Progressive exercises teaching git fundamentals
  - **Lesson 1**: Your First Repository (git init, git status)
  - **Lesson 2**: Tracking Files (touch, git add, staging)
  - **Lesson 3**: Making Commits (git commit, git log)
  - **Lesson 4**: The Edit-Stage-Commit Cycle (modify, stage, commit workflow)
  - **Lesson 5**: Working with Multiple Files (batch operations, git add .)
  - **Lesson 6**: Branching Basics (git branch, git checkout)
  - Hybrid validation: checks both command patterns and resulting state
  - Visual progress tracking with checkmarks
  - Contextual hints when stuck
  - Auto-advance to next exercise on completion
  - Broken state detection with recovery suggestions
- **Progress Persistence**: Auto-saves progress to localStorage
  - Resume prompt on return visits ("Welcome Back!")
  - Shows lesson name and completed exercise count
  - Option to resume or start fresh
  - Progress cleared on environment reset

### Planned Next Steps

**Near-term:**
- Lesson 7+: Merging branches (fast-forward and merge commits)
- Git diff command to show changes
- User authentication for cross-device progress sync

**Future:**
- Visual git graph showing commit history and branches
- Interactive merge conflict resolution exercises
- Cherry-pick and rebase tutorials
- Stashing changes
- Remote operations simulation (clone, push, pull concepts)

## 🛠️ Tech Stack

- **React 19** + TypeScript
- **Vite** - Build tooling
- **isomorphic-git** - Pure JavaScript git implementation
- **lightning-fs** - IndexedDB-backed filesystem
- **xterm.js** - Terminal emulator
- **Monaco Editor** - Code viewer
- **allotment** - Resizable pane layout
- **CSS Modules** - Scoped styling with design tokens

## 🚀 Development

### Prerequisites

- Node.js 20+
- pnpm

### Using Nix (Recommended)

This project includes a Nix flake for reproducible development environments.

```bash
# Enter the development shell
nix develop

# Or with direnv (recommended for automatic activation)
echo "use flake" > .envrc
direnv allow
```

The Nix environment provides:
- Node.js 20
- pnpm
- git
- just (command runner)

### Using direnv

If you have [direnv](https://direnv.net/) installed, the development environment will automatically activate when you enter the project directory:

1. Install direnv and hook it into your shell
2. Create `.envrc` with `use flake` (or it may already exist)
3. Run `direnv allow` to trust the configuration

### Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Using just

Common tasks are available via [just](https://github.com/casey/just):

```bash
just dev       # Start development server
just install   # Install dependencies
just build     # Build for production
just test      # Run all tests
just test-unit # Run unit tests only (~500ms)
just test-integration  # Run integration tests (~30s)
just test-e2e  # Run e2e tests (~15s)
just check     # Run all checks (typecheck, lint, test, build)
```
