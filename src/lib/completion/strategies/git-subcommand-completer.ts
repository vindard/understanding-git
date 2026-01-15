import { getGitSubcommandNames } from '../../commands/registry';
import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';

export class GitSubcommandCompleter implements CompletionStrategy {
  canHandle(context: CompletionContext): boolean {
    // Handle "git <partial>" (completing git subcommand when typing)
    return context.cmd === 'git' &&
           context.parts.length === 2 &&
           !context.endsWithSpace;
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const partial = context.parts[1];
    const gitSubcommands = getGitSubcommandNames();
    const suggestions = gitSubcommands.filter(sub => sub.startsWith(partial));
    const replaceFrom = context.lineUpToCursor.lastIndexOf(partial);
    return {
      suggestions,
      replaceFrom,
      replaceTo: context.cursorPos,
    };
  }
}
