import { getGitSubcommandNames } from '../../commands/registry';
import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';

export class GitSubcommandCompleter implements CompletionStrategy {
  canHandle(context: CompletionContext): boolean {
    // Handle "git " (ready to complete subcommand) or "git <partial>" (typing subcommand)
    if (context.cmd !== 'git') return false;

    // "git " with trailing space - ready to complete subcommand
    const nonEmptyParts = context.parts.filter(p => p !== '');
    if (nonEmptyParts.length === 1 && context.endsWithSpace) return true;

    // "git <partial>" - typing subcommand
    if (context.parts.length === 2 && !context.endsWithSpace) return true;

    return false;
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const nonEmptyParts = context.parts.filter(p => p !== '');
    const partial = context.endsWithSpace ? '' : (nonEmptyParts[1] || '');
    const gitSubcommands = getGitSubcommandNames();
    const suggestions = gitSubcommands.filter(sub => sub.startsWith(partial));
    const replaceFrom = context.endsWithSpace
      ? context.cursorPos
      : context.lineUpToCursor.lastIndexOf(partial);
    return {
      suggestions,
      replaceFrom,
      replaceTo: context.cursorPos,
    };
  }
}
