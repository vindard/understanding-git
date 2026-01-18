import { fs } from './fs';
import { CWD } from './config';

const GIT_DIR = `${CWD}/.git`;

// Module state: the last known valid hash of .git directory
let lastKnownHash: string | null = null;

// ============================================================================
// Pure functions (unit testable)
// ============================================================================

/**
 * Compute a simple hash of a string using djb2 algorithm.
 * Returns hex string representation.
 */
export function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash >>> 0; // Convert to unsigned 32-bit
  }
  return hash.toString(16);
}

/**
 * Create a deterministic string representation of file contents.
 * Files should be pre-sorted by path for deterministic output.
 */
export function createStateString(files: [string, string][]): string {
  return files
    .map(([path, content]) => `${path}:${content}`)
    .join('\n');
}

/**
 * Determine if the stored hash should be updated based on before/after comparison.
 */
export function shouldUpdateStoredHash(hashBefore: string, hashAfter: string): boolean {
  return hashBefore !== hashAfter;
}

/**
 * Check if repo is intact based on stored and current hash.
 * Returns true if no hash stored (pre-init) or hashes match.
 */
export function checkIntegrity(storedHash: string | null, currentHash: string): boolean {
  if (storedHash === null) {
    return true;
  }
  return currentHash === storedHash;
}

// ============================================================================
// Boundary functions (require fs access)
// ============================================================================

/**
 * Recursively collect all files in a directory with their contents.
 * Returns a sorted array of [path, content] pairs for deterministic hashing.
 */
async function collectFiles(dir: string): Promise<[string, string][]> {
  const results: [string, string][] = [];

  const entries = await fs.promises.readdir(dir);
  // Sort for deterministic ordering
  entries.sort();

  for (const entry of entries) {
    const fullPath = `${dir}/${entry}`;
    const stats = await fs.promises.stat(fullPath);

    if (stats.isDirectory()) {
      const subFiles = await collectFiles(fullPath);
      results.push(...subFiles);
    } else {
      // Read file content as base64 to handle binary files
      const content = await fs.promises.readFile(fullPath);
      const contentStr = typeof content === 'string'
        ? content
        : new TextDecoder().decode(content as Uint8Array);
      results.push([fullPath, contentStr]);
    }
  }

  return results;
}

/**
 * Compute a hash of the entire .git directory state.
 */
async function computeGitHash(): Promise<string> {
  try {
    const files = await collectFiles(GIT_DIR);
    const stateString = createStateString(files);
    return djb2Hash(stateString);
  } catch {
    return '';
  }
}

// ============================================================================
// Public API (manages state + boundary)
// ============================================================================

/**
 * Update the stored hash after a legitimate git operation.
 * Call this after git init, add, commit, branch, checkout, etc.
 */
export async function updateGitStateHash(): Promise<void> {
  lastKnownHash = await computeGitHash();
}

/**
 * Wrap a git operation and only update the stored hash if the operation
 * actually changed the .git directory state.
 *
 * This prevents "blessing" a corrupted state when a git command is a no-op
 * (e.g., `git init` on an existing repo).
 */
export async function withHashUpdate<T>(operation: () => Promise<T>): Promise<T> {
  const hashBefore = await computeGitHash();
  const result = await operation();
  const hashAfter = await computeGitHash();

  if (shouldUpdateStoredHash(hashBefore, hashAfter)) {
    lastKnownHash = hashAfter;
  }
  return result;
}

/**
 * Clear the stored hash. Call this on environment reset.
 */
export function clearGitStateHash(): void {
  lastKnownHash = null;
}

/**
 * Check if the .git directory is still intact (unchanged since last git operation).
 * Returns true if:
 * - No hash stored yet (pre-init state)
 * - Current hash matches stored hash
 * Returns false if hash mismatch (external tampering detected).
 */
export async function repoIntact(): Promise<boolean> {
  const currentHash = await computeGitHash();
  return checkIntegrity(lastKnownHash, currentHash);
}
