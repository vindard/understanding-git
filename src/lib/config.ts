/**
 * Centralized configuration constants.
 *
 * This module provides a single source of truth for values that are used
 * across multiple modules. Centralizing these values:
 * - Eliminates magic strings scattered throughout the codebase
 * - Makes global changes trivial (change once, applies everywhere)
 * - Improves testability (can mock config in tests)
 * - Documents the application's key configuration in one place
 */

/**
 * The current working directory for the virtual filesystem.
 * All file operations are relative to this path.
 */
export const CWD = '/repo';
