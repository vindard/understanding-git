import { getCommandNames } from '../../commands/registry';
import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';
import { filterByPrefix, shouldCompleteCommand } from '../filters';

export class CommandCompleter implements CompletionStrategy {
  canHandle(context: CompletionContext): boolean {
    return shouldCompleteCommand(context.parts, context.endsWithSpace);
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const partial = context.parts[0] || '';

    // Fetch available commands (from registry, not external service)
    const commands = getCommandNames();

    // Apply pure filtering
    const suggestions = filterByPrefix(commands, partial);

    return {
      suggestions,
      replaceFrom: 0,
      replaceTo: context.cursorPos,
    };
  }
}
