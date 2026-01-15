import { getCommandNames } from '../../commands/registry';
import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';

export class CommandCompleter implements CompletionStrategy {
  canHandle(context: CompletionContext): boolean {
    // Handle empty line or completing first word (before space)
    return context.parts.length === 0 ||
           (context.parts.length === 1 && !context.endsWithSpace);
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const partial = context.parts[0] || '';
    const commands = getCommandNames();
    const suggestions = commands.filter(cmd => cmd.startsWith(partial));
    return {
      suggestions,
      replaceFrom: 0,
      replaceTo: context.cursorPos,
    };
  }
}
