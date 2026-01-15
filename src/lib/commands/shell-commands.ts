import { resetFs } from '../fs';
import { colors } from './colors';
import type { CommandResult } from './types';

function formatHelpOutput(): string {
  const { dim, reset, yellow, cyan } = colors;

  const sections = [
    {
      title: 'File commands',
      commands: [
        ['ls', 'List directory contents'],
        ['cat <file>', 'Display file contents'],
        ['touch <file>', 'Create an empty file'],
        ['mkdir <dir>', 'Create a directory'],
        ['rm <file>', 'Remove a file'],
        ['echo <text>', 'Display text'],
        ['pwd', 'Print working directory'],
      ],
    },
    {
      title: 'Other commands',
      commands: [
        ['clear', 'Clear the terminal screen'],
        ['reset', 'Reset the environment to start fresh'],
        ['help', 'Show this help message'],
      ],
    },
    {
      title: 'Git commands',
      commands: [
        ['git init', 'Create an empty Git repository'],
        ['git status', 'Show the working tree status'],
        ['git add <file>', 'Add file contents to the staging area'],
        ['git commit -m <msg>', 'Record changes to the repository'],
        ['git log', 'Show commit logs'],
        ['git branch [name]', 'List branches or create a new branch'],
        ['git checkout <branch>', 'Switch to a branch'],
      ],
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

export async function handleEchoCommand(args: string[]): Promise<CommandResult> {
  return { output: args.join(' '), success: true };
}

export async function handlePwdCommand(): Promise<CommandResult> {
  return { output: '/repo', success: true };
}

export async function handleHelpCommand(): Promise<CommandResult> {
  return { output: formatHelpOutput(), success: true };
}

export async function handleResetCommand(): Promise<CommandResult> {
  await resetFs();
  return { output: 'Environment reset. Run "git init" to start fresh.', success: true };
}

export async function handleClearCommand(): Promise<CommandResult> {
  // Return escape sequence to clear screen and move cursor to top
  return { output: '\x1b[2J\x1b[H', success: true };
}
