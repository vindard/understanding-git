import { fs } from './fs';
import { CWD } from './config';

const GIT_DIR = `${CWD}/.git`;

// Module state: the last known valid hash of .git directory
let lastKnownHash: string | null = null;

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
 * Uses a simple string hash for browser compatibility.
 */
async function computeGitHash(): Promise<string> {
  try {
    const files = await collectFiles(GIT_DIR);
    // Create a deterministic string representation
    const stateString = files
      .map(([path, content]) => `${path}:${content}`)
      .join('\n');

    // Simple hash function (djb2)
    let hash = 5381;
    for (let i = 0; i < stateString.length; i++) {
      hash = ((hash << 5) + hash) + stateString.charCodeAt(i);
      hash = hash >>> 0; // Convert to unsigned 32-bit
    }
    return hash.toString(16);
  } catch {
    return '';
  }
}

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

  // Only update stored hash if command actually changed .git
  if (hashBefore !== hashAfter) {
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
  // No hash stored means we haven't done any git operations yet
  if (lastKnownHash === null) {
    return true;
  }

  const currentHash = await computeGitHash();
  return currentHash === lastKnownHash;
}
