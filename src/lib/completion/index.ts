import type { CompletionContext, CompletionResult, CompletionStrategy } from './types';

// Import commands module to ensure registry is populated before completion
// strategies try to access it
import '../commands';

import { CommandCompleter } from './strategies/command-completer';
import { GitSubcommandCompleter } from './strategies/git-subcommand-completer';
import { FilePathCompleter } from './strategies/file-path-completer';
import { BranchCompleter } from './strategies/branch-completer';

export type { CompletionResult } from './types';

// Register strategies in order of priority
const strategies: CompletionStrategy[] = [
  new CommandCompleter(),
  new GitSubcommandCompleter(),
  new BranchCompleter(),     // Must come before FilePathCompleter for git checkout
  new FilePathCompleter(),
];

function createContext(line: string, cursorPos: number): CompletionContext {
  const lineUpToCursor = line.slice(0, cursorPos);
  const parts = lineUpToCursor.split(/\s+/);
  const cmd = parts[0] || '';
  const endsWithSpace = lineUpToCursor.endsWith(' ');

  return {
    line,
    lineUpToCursor,
    cursorPos,
    parts,
    cmd,
    endsWithSpace,
  };
}

export async function getCompletions(line: string, cursorPos: number): Promise<CompletionResult> {
  const context = createContext(line, cursorPos);

  for (const strategy of strategies) {
    if (strategy.canHandle(context)) {
      return await strategy.complete(context);
    }
  }

  // No strategy matched - return empty result
  return { suggestions: [], replaceFrom: cursorPos, replaceTo: cursorPos };
}
