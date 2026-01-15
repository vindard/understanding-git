import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';

const COMMANDS = ['git', 'ls', 'cat', 'echo', 'pwd', 'mkdir', 'touch', 'rm', 'reset', 'clear', 'help'];

export class CommandCompleter implements CompletionStrategy {
  canHandle(context: CompletionContext): boolean {
    // Handle empty line or completing first word (before space)
    return context.parts.length === 0 ||
           (context.parts.length === 1 && !context.endsWithSpace);
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const partial = context.parts[0] || '';
    const suggestions = COMMANDS.filter(cmd => cmd.startsWith(partial));
    return {
      suggestions,
      replaceFrom: 0,
      replaceTo: context.cursorPos,
    };
  }
}
