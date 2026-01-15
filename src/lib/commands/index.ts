import { colors } from './colors';
import { handleGitCommand } from './git-commands';
import {
  handleLsCommand,
  handleCatCommand,
  handleMkdirCommand,
  handleTouchCommand,
  handleRmCommand,
} from './file-commands';
import {
  handleEchoCommand,
  handlePwdCommand,
  handleHelpCommand,
  handleResetCommand,
  handleClearCommand,
} from './shell-commands';
import type { CommandResult } from './types';

export type { CommandResult } from './types';

export async function executeCommand(command: string): Promise<CommandResult> {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  try {
    switch (cmd) {
      case 'git':
        return await handleGitCommand(args);
      case 'ls':
        return await handleLsCommand(args);
      case 'cat':
        return await handleCatCommand(args);
      case 'echo':
        return await handleEchoCommand(args);
      case 'pwd':
        return await handlePwdCommand();
      case 'mkdir':
        return await handleMkdirCommand(args);
      case 'touch':
        return await handleTouchCommand(args);
      case 'rm':
        return await handleRmCommand(args);
      case 'help':
        return await handleHelpCommand();
      case 'reset':
        return await handleResetCommand();
      case 'clear':
        return await handleClearCommand();
      default:
        return { output: `Command not found: ${cmd}`, success: false };
    }
  } catch (error) {
    return {
      output: `${colors.red}Error: ${error instanceof Error ? error.message : String(error)}${colors.reset}`,
      success: false,
    };
  }
}
