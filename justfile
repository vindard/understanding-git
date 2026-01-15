# Default recipe - list available commands
default:
    @just --list

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

# Run tests once
test:
    pnpm test:run

# Run tests in watch mode
test-watch:
    pnpm test

# Run all checks (typecheck, lint, test, build)
check:
    @echo "Running typecheck..."
    @just typecheck
    @echo "Running linter..."
    @just lint
    @echo "Running tests..."
    @just test
    @echo "Running build..."
    @just build
    @echo "All checks passed!"
