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
