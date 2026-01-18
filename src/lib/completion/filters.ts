/**
 * Pure functions for completion filtering and formatting.
 * These operate on already-fetched data, making them easy to unit test.
 */

/**
 * Filter entries by prefix match.
 */
export function filterByPrefix(entries: string[], prefix: string): string[] {
  return entries.filter(entry => entry.startsWith(prefix));
}

/**
 * Filter out hidden files (starting with .).
 */
export function filterHidden(entries: string[], hideHidden: boolean): string[] {
  if (!hideHidden) return entries;
  return entries.filter(entry => !entry.startsWith('.'));
}

/**
 * Exclude .git directory from suggestions (for git add).
 */
export function excludeGitDir(suggestions: string[]): string[] {
  return suggestions.filter(s => s !== '.git/' && !s.startsWith('.git/'));
}

/**
 * Exclude entries already present in command arguments.
 */
export function excludeAlreadyAdded(suggestions: string[], existingArgs: string[]): string[] {
  const existing = new Set(existingArgs);
  return suggestions.filter(s =>
    !existing.has(s) && !existing.has(s.replace(/\/$/, ''))
  );
}

/**
 * Format entry with trailing slash if it's a directory.
 */
export function formatAsFileOrDir(entry: string, isDir: boolean): string {
  return isDir ? entry + '/' : entry;
}

/**
 * Add path prefix to suggestions (for nested path completion).
 */
export function addPathPrefix(suggestions: string[], pathPrefix: string): string[] {
  if (!pathPrefix) return suggestions;
  return suggestions.map(s => pathPrefix + s);
}

/**
 * Parse a partial path into directory and prefix components.
 */
export function parsePartialPath(partial: string): { dirPart: string; prefix: string; hasPath: boolean } {
  if (!partial.includes('/')) {
    return { dirPart: '', prefix: partial, hasPath: false };
  }
  const lastSlash = partial.lastIndexOf('/');
  return {
    dirPart: partial.slice(0, lastSlash) || '/',
    prefix: partial.slice(lastSlash + 1),
    hasPath: true,
  };
}

/**
 * Get the path prefix to prepend to suggestions.
 */
export function getPathPrefix(partial: string): string {
  if (!partial.includes('/')) return '';
  return partial.slice(0, partial.lastIndexOf('/') + 1);
}

/**
 * Calculate replaceFrom position for completion.
 */
export function calculateReplaceFrom(
  endsWithSpace: boolean,
  cursorPos: number,
  lineUpToCursor: string,
  partial: string
): number {
  return endsWithSpace ? cursorPos : lineUpToCursor.lastIndexOf(partial);
}

// Command classification helpers

const PATH_COMMANDS = ['ls', 'cat', 'mkdir', 'touch', 'rm', 'head', 'tail'];
const GIT_PATH_SUBCOMMANDS = ['add'];
const GIT_BRANCH_SUBCOMMANDS = ['checkout'];

/**
 * Check if command should have file path completion.
 */
export function shouldCompleteFilePath(cmd: string, parts: string[]): boolean {
  if (PATH_COMMANDS.includes(cmd)) {
    return true;
  }
  if (cmd === 'git' && parts.length >= 2) {
    return GIT_PATH_SUBCOMMANDS.includes(parts[1]);
  }
  return false;
}

/**
 * Check if command should have branch completion.
 */
export function shouldCompleteBranch(cmd: string, parts: string[]): boolean {
  if (cmd === 'git' && parts.length >= 2) {
    return GIT_BRANCH_SUBCOMMANDS.includes(parts[1]);
  }
  return false;
}

/**
 * Check if we should complete git subcommands.
 */
export function shouldCompleteGitSubcommand(cmd: string, parts: string[], endsWithSpace: boolean): boolean {
  if (cmd !== 'git') return false;
  const nonEmptyParts = parts.filter(p => p !== '');
  // "git " with trailing space - ready to complete subcommand
  if (nonEmptyParts.length === 1 && endsWithSpace) return true;
  // "git <partial>" - typing subcommand
  if (parts.length === 2 && !endsWithSpace) return true;
  return false;
}

/**
 * Check if we should complete commands (first word).
 */
export function shouldCompleteCommand(parts: string[], endsWithSpace: boolean): boolean {
  return parts.length === 0 || (parts.length === 1 && !endsWithSpace);
}

/**
 * Check if hidden files should be excluded for this command.
 */
export function shouldHideHidden(cmd: string): boolean {
  return cmd === 'touch';
}

/**
 * Check if this is a git add command.
 */
export function isGitAdd(cmd: string, parts: string[]): boolean {
  return cmd === 'git' && parts[1] === 'add';
}

/**
 * Get existing arguments from parts (for excluding already-added files).
 */
export function getExistingArgs(parts: string[], isGitAddCmd: boolean): string[] {
  return parts.slice(isGitAddCmd ? 2 : 1);
}
