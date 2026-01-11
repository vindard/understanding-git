# 🌳 Understanding Git

An interactive web-based git playground with curated exercises designed to teach and provide hands-on practice with git concepts.

## 📖 About

Learning git can be challenging - the command line interface, abstract concepts like branches and merges, and the fear of breaking things can make it intimidating for beginners. This project aims to solve that by providing a safe, browser-based environment where users can:

- Practice git commands without fear of breaking anything
- Follow guided lessons that introduce concepts progressively
- See immediate visual feedback as files and the repository state change
- Build muscle memory through hands-on exercises

## ✨ Features

### Implemented

- **Virtual Filesystem**: In-browser filesystem using IndexedDB that resets on page refresh for a clean slate each session
- **Git Operations**: Core git commands powered by isomorphic-git
  - `git init` - Initialize a repository
  - `git add` - Stage files
  - `git commit` - Commit changes
  - `git status` - View repository status (with color-coded output)
  - `git log` - View commit history
  - `git branch` - List and create branches
  - `git checkout` - Switch branches
- **Interactive Terminal**: Full terminal emulator with:
  - Command history (up/down arrows)
  - Cursor navigation (left/right arrows, Home/End)
  - Line editing (backspace, delete)
  - Color-coded output
- **File Explorer**: Visual tree view of the virtual filesystem
- **File Viewer**: Monaco editor integration for viewing file contents
- **Instructions Panel**: Guided lessons with hints
- **Resizable Panes**: VS Code-like draggable panel resizing
- **Shell Commands**: Basic filesystem commands (`ls`, `cat`, `touch`, `mkdir`, `echo`, `pwd`, `clear`, `reset`)

### Planned

- Multiple curated lessons covering git fundamentals to advanced topics
- Progress tracking and completion status
- Branching and merging visualizations
- Interactive rebasing exercises
- Conflict resolution practice

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
just dev      # Start development server
just install  # Install dependencies
just build    # Build for production
```
