# Default recipe - list available commands
default:
    @just --list

# Setup project (install deps + git hooks)
setup:
    pnpm install
    git config core.hooksPath .githooks
    @echo "Setup complete! Git hooks installed."

# Start development server
dev:
    pnpm dev

# Install dependencies
install:
    pnpm install

# Build for production
build:
    pnpm build

# Run linter
lint:
    pnpm lint

# Preview production build
preview:
    pnpm preview

# Type check
typecheck:
    pnpm tsc --noEmit

# Run all tests once
test:
    pnpm test:run

# Run unit tests only (fast, ~500ms)
test-unit:
    pnpm test:unit

# Run integration tests only (~30s)
test-integration:
    pnpm test:integration

# Run e2e tests only (lesson flows, ~15s)
test-e2e:
    pnpm test:e2e

# Run tests in watch mode
test-watch:
    pnpm test

# Verify lockfile is in sync with package.json
check-lockfile:
    @pnpm install --frozen-lockfile --ignore-scripts >/dev/null 2>&1 || (echo "Error: pnpm-lock.yaml out of sync. Run 'pnpm install'" && exit 1)
    @echo "Lockfile OK"

# Run all checks (typecheck, lint, test, build)
check:
    @echo "Checking lockfile..."
    @just check-lockfile
    @echo "Running typecheck..."
    @just typecheck
    @echo "Running linter..."
    @just lint
    @echo "Running tests..."
    @just test
    @echo "Running build..."
    @just build
    @echo "All checks passed!"
