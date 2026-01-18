import { getGitSubcommandNames } from '../../commands/registry';
import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';
import { filterByPrefix, calculateReplaceFrom, shouldCompleteGitSubcommand } from '../filters';

export class GitSubcommandCompleter implements CompletionStrategy {
  canHandle(context: CompletionContext): boolean {
    return shouldCompleteGitSubcommand(context.cmd, context.parts, context.endsWithSpace);
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const nonEmptyParts = context.parts.filter(p => p !== '');
    const partial = context.endsWithSpace ? '' : (nonEmptyParts[1] || '');

    // Fetch available git subcommands (from registry, not external service)
    const gitSubcommands = getGitSubcommandNames();

    // Apply pure filtering
    const suggestions = filterByPrefix(gitSubcommands, partial);

    const replaceFrom = calculateReplaceFrom(
      context.endsWithSpace,
      context.cursorPos,
      context.lineUpToCursor,
      partial
    );

    return {
      suggestions,
      replaceFrom,
      replaceTo: context.cursorPos,
    };
  }
}
