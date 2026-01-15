import * as gitLib from '../git';
import { CWD } from '../config';
import { registerCommand, registerGitSubcommand } from './registry';
import { colors } from './colors';
import type { CommandResult } from './types';

async function handleGitCommand(args: string[]): Promise<CommandResult> {
  const subcommand = args[0];

  switch (subcommand) {
    case 'init':
      await gitLib.gitInit();
      return { output: `Initialized empty Git repository in ${CWD}/.git/`, success: true };

    case 'add':
      if (!args[1]) {
        return { output: 'Nothing specified, nothing added.', success: false };
      }
      await gitLib.gitAdd(args[1]);
      return { output: '', success: true };

    case 'commit': {
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
    }

    case 'status': {
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
    }

    case 'log': {
      const commits = await gitLib.gitLog();
      if (commits.length === 0) {
        return { output: 'No commits yet', success: true };
      }
      const logLines = commits.map(
        (c) => `${colors.yellow}commit ${c.oid}${colors.reset}\nAuthor: ${c.author}\n\n    ${c.message}`
      );
      return { output: logLines.join('\n\n'), success: true };
    }

    case 'branch': {
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
    }

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

// Register the git command
registerCommand({
  name: 'git',
  description: 'Git version control',
  handler: handleGitCommand,
  category: 'git',
});

// Register git subcommands for completion and documentation
registerGitSubcommand({ name: 'init', description: 'Create an empty Git repository' });
registerGitSubcommand({ name: 'status', description: 'Show the working tree status' });
registerGitSubcommand({ name: 'add', description: 'Add file contents to the staging area', usage: '<file>' });
registerGitSubcommand({ name: 'commit', description: 'Record changes to the repository', usage: '-m <msg>' });
registerGitSubcommand({ name: 'log', description: 'Show commit logs' });
registerGitSubcommand({ name: 'branch', description: 'List branches or create a new branch', usage: '[name]' });
registerGitSubcommand({ name: 'checkout', description: 'Switch to a branch', usage: '<branch>' });
