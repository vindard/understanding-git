/**
 * Pure command parsing functions.
 * No I/O, no side effects - fully unit testable.
 */

import { CWD } from '../config';

/**
 * Parse a command line into parts, respecting quoted strings.
 * Quotes are removed from the parsed values.
 */
export function parseCommandLine(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const char of input) {
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
      // Don't include the opening quote in the result
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      // Don't include the closing quote, but push the content
      if (current) {
        parts.push(current);
        current = '';
      }
      quoteChar = '';
    } else if (char === ' ' && !inQuote) {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current) {
    parts.push(current);
  }

  return parts;
}

/**
 * Extract output redirection from parsed parts.
 * Returns the parts without redirection, the output file path, and whether to append.
 */
export function extractRedirection(parts: string[]): { parts: string[]; outputFile: string | null; append: boolean } {
  // Check for append (>>) first
  const appendIndex = parts.indexOf('>>');
  if (appendIndex !== -1) {
    const outputFile = parts[appendIndex + 1] || null;
    const newParts = parts.slice(0, appendIndex);
    return { parts: newParts, outputFile, append: true };
  }

  // Check for overwrite (>)
  const redirectIndex = parts.indexOf('>');
  if (redirectIndex !== -1) {
    const outputFile = parts[redirectIndex + 1] || null;
    const newParts = parts.slice(0, redirectIndex);
    return { parts: newParts, outputFile, append: false };
  }

  return { parts, outputFile: null, append: false };
}

/**
 * Resolve a path relative to CWD.
 * Absolute paths are returned unchanged.
 */
export function resolvePath(path: string): string {
  if (path.startsWith('/')) {
    return path;
  }
  return `${CWD}/${path}`;
}

/**
 * Parse head/tail command arguments.
 * Returns the number of lines and file path.
 */
export function parseHeadTailArgs(args: string[]): { numLines: number; filePath: string | undefined } {
  let numLines = 10;
  let filePath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n' && args[i + 1]) {
      numLines = parseInt(args[i + 1], 10);
      i++; // Skip the next argument
    } else if (!args[i].startsWith('-')) {
      filePath = args[i];
    }
  }

  return { numLines, filePath };
}

/**
 * Get the first N lines from content.
 */
export function getFirstNLines(content: string, n: number): string {
  const lines = content.split('\n');
  return lines.slice(0, n).join('\n');
}

/**
 * Get the last N lines from content.
 */
export function getLastNLines(content: string, n: number): string {
  const lines = content.split('\n');
  return lines.slice(-n).join('\n');
}

/**
 * Parse rm command arguments.
 * Returns whether recursive flag is set and the target paths.
 */
export function parseRmArgs(args: string[]): { recursive: boolean; targets: string[] } {
  const recursive = args[0] === '-r' || args[0] === '-rf';
  const targets = recursive ? args.slice(1) : args;
  return { recursive, targets };
}
