import { resetFs } from '../fs';
import { CWD } from '../config';
import {
  registerCommand,
  getCommandsByCategory,
  getGitSubcommands,
} from './registry';
import { colors } from './colors';
import type { CommandResult } from './types';

function formatHelpOutput(): string {
  const { dim, reset, yellow, cyan } = colors;

  // Build help sections from registry data
  const fileCommands = getCommandsByCategory('file');
  const shellCommands = getCommandsByCategory('shell');
  const gitSubcommands = getGitSubcommands();

  const sections = [
    {
      title: 'File commands',
      commands: fileCommands.map(cmd => {
        const usage = cmd.usage ? ` ${cmd.usage}` : '';
        return [`${cmd.name}${usage}`, cmd.description];
      }),
    },
    {
      title: 'Other commands',
      commands: shellCommands.map(cmd => {
        const usage = cmd.usage ? ` ${cmd.usage}` : '';
        return [`${cmd.name}${usage}`, cmd.description];
      }),
    },
    {
      title: 'Git commands',
      commands: gitSubcommands.map(sub => {
        const usage = sub.usage ? ` ${sub.usage}` : '';
        return [`git ${sub.name}${usage}`, sub.description];
      }),
    },
  ];

  const lines: string[] = [];
  lines.push(`${yellow}Understanding Git${reset} - Interactive Git Learning Environment\n`);

  for (const section of sections) {
    lines.push(`${dim}${section.title}${reset}`);
    for (const [cmd, desc] of section.commands) {
      lines.push(`   ${cyan}${cmd.padEnd(22)}${reset} ${desc}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

async function handleEchoCommand(args: string[]): Promise<CommandResult> {
  return { output: args.join(' '), success: true };
}

async function handlePwdCommand(): Promise<CommandResult> {
  return { output: CWD, success: true };
}

async function handleHelpCommand(): Promise<CommandResult> {
  return { output: formatHelpOutput(), success: true };
}

async function handleResetCommand(): Promise<CommandResult> {
  await resetFs();
  return { output: 'Environment reset. Run "git init" to start fresh.', success: true };
}

async function handleClearCommand(): Promise<CommandResult> {
  // Return escape sequence to clear screen and move cursor to top
  return { output: '\x1b[2J\x1b[H', success: true };
}

// Register shell commands
registerCommand({
  name: 'echo',
  description: 'Display text',
  usage: '<text>',
  handler: handleEchoCommand,
  category: 'shell',
});

registerCommand({
  name: 'pwd',
  description: 'Print working directory',
  handler: handlePwdCommand,
  category: 'shell',
});

registerCommand({
  name: 'clear',
  description: 'Clear the terminal screen',
  handler: handleClearCommand,
  category: 'shell',
});

registerCommand({
  name: 'reset',
  description: 'Reset the environment to start fresh',
  handler: handleResetCommand,
  category: 'shell',
});

registerCommand({
  name: 'help',
  description: 'Show this help message',
  handler: handleHelpCommand,
  category: 'shell',
});
