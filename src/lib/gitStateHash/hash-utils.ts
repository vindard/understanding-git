/**
 * Pure hash utility functions.
 * No I/O, no side effects - fully unit testable.
 */

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
