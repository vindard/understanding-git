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

// Import command modules to trigger their registration
// Order matters: file and git commands should register before shell
// commands that depend on them (like help)
import './file-commands';
import './git-commands';
import './shell-commands';

export type { CommandResult } from './types';

export async function executeCommand(command: string): Promise<CommandResult> {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  try {
    const commandDef = getCommand(cmd);
    if (commandDef) {
      return await commandDef.handler(args);
    }
    return { output: `Command not found: ${cmd}`, success: false };
  } catch (error) {
    return {
      output: `${colors.red}Error: ${error instanceof Error ? error.message : String(error)}${colors.reset}`,
      success: false,
    };
  }
}
