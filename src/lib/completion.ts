import * as fsLib from './fs';
import * as gitLib from './git';

const CWD = '/repo';

// Available shell commands
const COMMANDS = ['git', 'ls', 'cat', 'echo', 'pwd', 'mkdir', 'touch', 'rm', 'reset', 'clear', 'help'];

// Git subcommands
const GIT_SUBCOMMANDS = ['init', 'add', 'commit', 'status', 'log', 'branch', 'checkout'];

// Commands that take file path arguments
const PATH_COMMANDS = ['ls', 'cat', 'mkdir', 'touch', 'rm'];

// Git subcommands that take file path arguments
const GIT_PATH_SUBCOMMANDS = ['add'];

// Git subcommands that take branch arguments
const GIT_BRANCH_SUBCOMMANDS = ['checkout'];

export interface CompletionResult {
  suggestions: string[];
  replaceFrom: number;  // Start index in the line to replace
  replaceTo: number;    // End index in the line to replace
}

/**
 * Get completions for the current command line
 */
export async function getCompletions(line: string, cursorPos: number): Promise<CompletionResult> {
  // Only complete up to cursor position
  const lineUpToCursor = line.slice(0, cursorPos);
  const parts = lineUpToCursor.split(/\s+/);

  // Empty line or completing first word - complete commands
  if (parts.length === 0 || (parts.length === 1 && !lineUpToCursor.endsWith(' '))) {
    const partial = parts[0] || '';
    const suggestions = COMMANDS.filter(cmd => cmd.startsWith(partial));
    return {
      suggestions,
      replaceFrom: 0,
      replaceTo: cursorPos,
    };
  }

  const cmd = parts[0];

  // Handle git subcommand completion
  if (cmd === 'git') {
    // Completing git subcommand (second word)
    if (parts.length === 2 && !lineUpToCursor.endsWith(' ')) {
      const partial = parts[1];
      const suggestions = GIT_SUBCOMMANDS.filter(sub => sub.startsWith(partial));
      const replaceFrom = lineUpToCursor.lastIndexOf(partial);
      return {
        suggestions,
        replaceFrom,
        replaceTo: cursorPos,
      };
    }

    // Completing after git subcommand
    if (parts.length >= 2) {
      const gitSubcmd = parts[1];

      // Git add - complete file paths
      if (GIT_PATH_SUBCOMMANDS.includes(gitSubcmd)) {
        const partial = parts[parts.length - 1] || '';
        const isNewArg = lineUpToCursor.endsWith(' ');
        const pathToComplete = isNewArg ? '' : partial;

        const suggestions = await completeFilePath(pathToComplete);
        const replaceFrom = isNewArg ? cursorPos : lineUpToCursor.lastIndexOf(partial);
        return {
          suggestions,
          replaceFrom,
          replaceTo: cursorPos,
        };
      }

      // Git checkout - complete branch names
      if (GIT_BRANCH_SUBCOMMANDS.includes(gitSubcmd)) {
        const partial = parts[parts.length - 1] || '';
        const isNewArg = lineUpToCursor.endsWith(' ');
        const branchToComplete = isNewArg ? '' : partial;

        const suggestions = await completeBranch(branchToComplete);
        const replaceFrom = isNewArg ? cursorPos : lineUpToCursor.lastIndexOf(partial);
        return {
          suggestions,
          replaceFrom,
          replaceTo: cursorPos,
        };
      }
    }

    return { suggestions: [], replaceFrom: cursorPos, replaceTo: cursorPos };
  }

  // Handle file path completion for other commands
  if (PATH_COMMANDS.includes(cmd)) {
    const partial = parts[parts.length - 1] || '';
    const isNewArg = lineUpToCursor.endsWith(' ');
    const pathToComplete = isNewArg ? '' : partial;

    const suggestions = await completeFilePath(pathToComplete);
    const replaceFrom = isNewArg ? cursorPos : lineUpToCursor.lastIndexOf(partial);
    return {
      suggestions,
      replaceFrom,
      replaceTo: cursorPos,
    };
  }

  return { suggestions: [], replaceFrom: cursorPos, replaceTo: cursorPos };
}

/**
 * Complete file/directory paths
 */
async function completeFilePath(partial: string): Promise<string[]> {
  try {
    // Determine the directory to list and the prefix to match
    let dirPath: string;
    let prefix: string;

    if (partial.includes('/')) {
      const lastSlash = partial.lastIndexOf('/');
      const dirPart = partial.slice(0, lastSlash) || '/';
      prefix = partial.slice(lastSlash + 1);
      dirPath = dirPart.startsWith('/') ? dirPart : `${CWD}/${dirPart}`;
    } else {
      dirPath = CWD;
      prefix = partial;
    }

    const entries = await fsLib.readdir(dirPath);
    const matching = entries.filter(entry => entry.startsWith(prefix));

    // Check if each match is a directory and add trailing slash
    const suggestions: string[] = [];
    for (const entry of matching) {
      const fullPath = `${dirPath}/${entry}`.replace('//', '/');
      try {
        const stats = await fsLib.stat(fullPath);
        if (stats.type === 'dir') {
          suggestions.push(entry + '/');
        } else {
          suggestions.push(entry);
        }
      } catch {
        suggestions.push(entry);
      }
    }

    // If partial had a path prefix, include it in suggestions
    if (partial.includes('/')) {
      const pathPrefix = partial.slice(0, partial.lastIndexOf('/') + 1);
      return suggestions.map(s => pathPrefix + s);
    }

    return suggestions;
  } catch {
    return [];
  }
}

/**
 * Complete branch names
 */
async function completeBranch(partial: string): Promise<string[]> {
  try {
    const branches = await gitLib.gitListBranches();
    return branches.filter(branch => branch.startsWith(partial));
  } catch {
    return [];
  }
}
