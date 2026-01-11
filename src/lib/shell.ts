import * as gitLib from './git';
import * as fsLib from './fs';
import { resetFs } from './fs';

const CWD = '/repo';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function resolvePath(path: string): string {
  if (path.startsWith('/')) {
    return path;
  }
  return `${CWD}/${path}`;
}

export interface CommandResult {
  output: string;
  success: boolean;
}

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
        return { output: args.join(' '), success: true };
      case 'pwd':
        return { output: '/repo', success: true };
      case 'mkdir':
        return await handleMkdirCommand(args);
      case 'touch':
        return await handleTouchCommand(args);
      case 'help':
        return {
          output: 'Available commands: git, ls, cat, echo, pwd, mkdir, touch, reset, clear, help',
          success: true,
        };
      case 'reset':
        await resetFs();
        return { output: 'Environment reset. Run "git init" to start fresh.', success: true };
      case 'clear':
        // Return escape sequence to clear screen and move cursor to top
        return { output: '\x1b[2J\x1b[H', success: true };
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

async function handleGitCommand(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];

  switch (subcommand) {
    case 'init':
      await gitLib.gitInit();
      return { output: 'Initialized empty Git repository in /repo/.git/', success: true };

    case 'add':
      if (!args[1]) {
        return { output: 'Nothing specified, nothing added.', success: false };
      }
      await gitLib.gitAdd(args[1]);
      return { output: '', success: true };

    case 'commit':
      if (args[1] === '-m' && args[2]) {
        // Join message and strip surrounding quotes
        let message = args.slice(2).join(' ');
        if ((message.startsWith('"') && message.endsWith('"')) ||
            (message.startsWith("'") && message.endsWith("'"))) {
          message = message.slice(1, -1);
        }
        const sha = await gitLib.gitCommit(message);
        return { output: `[main ${sha.slice(0, 7)}] ${message}`, success: true };
      }
      return { output: 'Please provide a commit message with -m', success: false };

    case 'status':
      const status = await gitLib.gitStatus();
      if (status.length === 0) {
        return { output: 'nothing to commit, working tree clean', success: true };
      }
      // Filter out clean files (head=1, workdir=1, stage=1 means unchanged)
      const changedFiles = status.filter(([, head, workdir, stage]) => {
        return !(head === 1 && workdir === 1 && stage === 1);
      });
      if (changedFiles.length === 0) {
        return { output: 'nothing to commit, working tree clean', success: true };
      }
      const statusLines = changedFiles.map(([filepath, head, workdir, stage]) => {
        // Untracked files - red
        if (head === 0 && workdir === 2 && stage === 0) {
          return `${colors.red}?? ${filepath}${colors.reset}`;
        }
        // Staged (added) - green
        if (stage === 2) {
          return `${colors.green}A  ${filepath}${colors.reset}`;
        }
        // Staged (modified) - green
        if (stage === 3) {
          return `${colors.green}M  ${filepath}${colors.reset}`;
        }
        // Modified in working dir - red
        if (workdir === 2 && stage === 1) {
          return `${colors.red} M ${filepath}${colors.reset}`;
        }
        return `${colors.red}?? ${filepath}${colors.reset}`;
      });
      return { output: statusLines.join('\n'), success: true };

    case 'log':
      const commits = await gitLib.gitLog();
      if (commits.length === 0) {
        return { output: 'No commits yet', success: true };
      }
      const logLines = commits.map(
        (c) => `${colors.yellow}commit ${c.oid}${colors.reset}\nAuthor: ${c.author}\n\n    ${c.message}`
      );
      return { output: logLines.join('\n\n'), success: true };

    case 'branch':
      if (args[1]) {
        await gitLib.gitBranch(args[1]);
        return { output: '', success: true };
      }
      const branches = await gitLib.gitListBranches();
      const current = await gitLib.gitCurrentBranch();
      const branchList = branches.map((b) =>
        b === current
          ? `${colors.green}* ${b}${colors.reset}`
          : `  ${b}`
      );
      return { output: branchList.join('\n'), success: true };

    case 'checkout':
      if (!args[1]) {
        return { output: 'Please specify a branch', success: false };
      }
      await gitLib.gitCheckout(args[1]);
      return { output: `Switched to branch '${args[1]}'`, success: true };

    default:
      return { output: `git: '${subcommand}' is not a git command.`, success: false };
  }
}

async function handleLsCommand(args: string[]): Promise<CommandResult> {
  const path = args[0] ? resolvePath(args[0]) : CWD;
  const files = await fsLib.readdir(path);
  return { output: files.join('\n'), success: true };
}

async function handleCatCommand(args: string[]): Promise<CommandResult> {
  if (!args[0]) {
    return { output: 'cat: missing file operand', success: false };
  }
  const path = resolvePath(args[0]);
  const content = await fsLib.readFile(path);
  return { output: content, success: true };
}

async function handleMkdirCommand(args: string[]): Promise<CommandResult> {
  if (!args[0]) {
    return { output: 'mkdir: missing operand', success: false };
  }
  const path = resolvePath(args[0]);
  await fsLib.mkdir(path);
  return { output: '', success: true };
}

async function handleTouchCommand(args: string[]): Promise<CommandResult> {
  if (!args[0]) {
    return { output: 'touch: missing file operand', success: false };
  }
  const path = resolvePath(args[0]);
  try {
    await fsLib.readFile(path);
  } catch {
    await fsLib.writeFile(path, '');
  }
  return { output: '', success: true };
}
