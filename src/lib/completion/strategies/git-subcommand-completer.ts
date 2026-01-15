import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';

const GIT_SUBCOMMANDS = ['init', 'add', 'commit', 'status', 'log', 'branch', 'checkout'];

export class GitSubcommandCompleter implements CompletionStrategy {
  canHandle(context: CompletionContext): boolean {
    // Handle "git <partial>" (completing git subcommand when typing)
    return context.cmd === 'git' &&
           context.parts.length === 2 &&
           !context.endsWithSpace;
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const partial = context.parts[1];
    const suggestions = GIT_SUBCOMMANDS.filter(sub => sub.startsWith(partial));
    const replaceFrom = context.lineUpToCursor.lastIndexOf(partial);
    return {
      suggestions,
      replaceFrom,
      replaceTo: context.cursorPos,
    };
  }
}
