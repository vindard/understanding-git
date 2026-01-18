/**
 * Command Dispatcher
 *
 * This module serves as the entry point for command execution.
 * It imports command modules (which self-register) and uses
 * the registry for dispatch, eliminating the need for a switch statement.
 */

import { colors } from './colors';
import { getCommand } from './registry';
import type { CommandResult } from './types';
import { writeFile, readFile } from '../fs';
import { CWD } from '../config';

// Import command modules to trigger their registration
// Order matters: file and git commands should register before shell
// commands that depend on them (like help)
import './file-commands';
import './git-commands';
import './shell-commands';

export type { CommandResult } from './types';

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

export async function executeCommand(command: string): Promise<CommandResult> {
  const allParts = parseCommandLine(command.trim());
  const cmd = allParts[0];

  // Extract redirection before processing
  const { parts: partsWithoutRedirect, outputFile, append } = extractRedirection(allParts.slice(1));
  const args = partsWithoutRedirect;

  try {
    const commandDef = getCommand(cmd);
    if (commandDef) {
      const result = await commandDef.handler(args);

      // Handle output redirection
      if (outputFile && result.success) {
        const filePath = outputFile.startsWith('/') ? outputFile : `${CWD}/${outputFile}`;

        if (append) {
          // Append mode: read existing content and append new content
          let existingContent = '';
          try {
            existingContent = await readFile(filePath);
          } catch {
            // File doesn't exist, start with empty content
          }
          await writeFile(filePath, existingContent + result.output);
        } else {
          // Overwrite mode
          await writeFile(filePath, result.output);
        }

        return { output: '', success: true };
      }

      return result;
    }
    return { output: `Command not found: ${cmd}`, success: false };
  } catch (error) {
    return {
      output: `${colors.red}Error: ${error instanceof Error ? error.message : String(error)}${colors.reset}`,
      success: false,
    };
  }
}
