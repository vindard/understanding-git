import * as gitLib from './git';
import * as fsLib from './fs';

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
          output: 'Available commands: git, ls, cat, echo, pwd, mkdir, touch, help',
          success: true,
        };
      default:
        return { output: `Command not found: ${cmd}`, success: false };
    }
  } catch (error) {
    return {
      output: `Error: ${error instanceof Error ? error.message : String(error)}`,
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
        const sha = await gitLib.gitCommit(args.slice(2).join(' '));
        return { output: `[main ${sha.slice(0, 7)}] ${args.slice(2).join(' ')}`, success: true };
      }
      return { output: 'Please provide a commit message with -m', success: false };

    case 'status':
      const status = await gitLib.gitStatus();
      if (status.length === 0) {
        return { output: 'nothing to commit, working tree clean', success: true };
      }
      const statusLines = status.map(([filepath, head, workdir, stage]) => {
        if (head === 0 && workdir === 2 && stage === 0) return `?? ${filepath}`;
        if (head === 1 && workdir === 1 && stage === 1) return `   ${filepath}`;
        if (stage === 2) return `A  ${filepath}`;
        if (workdir === 2) return ` M ${filepath}`;
        return `   ${filepath}`;
      });
      return { output: statusLines.join('\n'), success: true };

    case 'log':
      const commits = await gitLib.gitLog();
      if (commits.length === 0) {
        return { output: 'No commits yet', success: true };
      }
      const logLines = commits.map(
        (c) => `commit ${c.oid}\nAuthor: ${c.author}\n\n    ${c.message}`
      );
      return { output: logLines.join('\n\n'), success: true };

    case 'branch':
      if (args[1]) {
        await gitLib.gitBranch(args[1]);
        return { output: '', success: true };
      }
      const branches = await gitLib.gitListBranches();
      const current = await gitLib.gitCurrentBranch();
      const branchList = branches.map((b) => (b === current ? `* ${b}` : `  ${b}`));
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
  const path = args[0] || '/repo';
  const files = await fsLib.readdir(path);
  return { output: files.join('\n'), success: true };
}

async function handleCatCommand(args: string[]): Promise<CommandResult> {
  if (!args[0]) {
    return { output: 'cat: missing file operand', success: false };
  }
  const content = await fsLib.readFile(args[0]);
  return { output: content, success: true };
}

async function handleMkdirCommand(args: string[]): Promise<CommandResult> {
  if (!args[0]) {
    return { output: 'mkdir: missing operand', success: false };
  }
  await fsLib.mkdir(args[0]);
  return { output: '', success: true };
}

async function handleTouchCommand(args: string[]): Promise<CommandResult> {
  if (!args[0]) {
    return { output: 'touch: missing file operand', success: false };
  }
  try {
    await fsLib.readFile(args[0]);
  } catch {
    await fsLib.writeFile(args[0], '');
  }
  return { output: '', success: true };
}
