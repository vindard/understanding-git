import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';
import type { Exercise } from '../../../types/lesson';

/**
 * Extracts command suggestions from the current lesson exercise hint.
 * For example, if the hint says "Type: touch README.md" and user types "touch ",
 * this will suggest "README.md".
 */
export class LessonCompleter implements CompletionStrategy {
  private exercise: Exercise | null = null;

  setExercise(exercise: Exercise | null): void {
    this.exercise = exercise;
  }

  canHandle(context: CompletionContext): boolean {
    if (!this.exercise?.hint) return false;

    const hintParts = this.parseHint(this.exercise.hint);
    if (!hintParts) return false;

    // Handle command completion (user typing partial command)
    if (context.parts.length <= 1 && !context.endsWithSpace) {
      const partial = context.parts[0] || '';
      return hintParts.cmd.startsWith(partial) && hintParts.cmd !== partial;
    }

    // Handle argument completion (command matches, ready for args)
    const readyForArg = context.parts.length > 1 || (context.parts.length === 1 && context.endsWithSpace);
    if (!readyForArg || context.cmd !== hintParts.cmd) {
      return false;
    }

    // For git commands, also verify the subcommand matches
    if (context.cmd === 'git' && hintParts.args.length > 0) {
      const userSubcmd = context.parts[1] || '';
      const hintSubcmd = hintParts.args[0];
      // If user has typed a complete subcommand that doesn't match, reject
      if (userSubcmd && !hintSubcmd.startsWith(userSubcmd)) {
        return false;
      }
    }

    return true;
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const hintParts = this.parseHint(this.exercise!.hint!);
    if (!hintParts) {
      return { suggestions: [], replaceFrom: context.cursorPos, replaceTo: context.cursorPos };
    }

    // Handle command completion
    if (context.parts.length <= 1 && !context.endsWithSpace) {
      const partial = context.parts[0] || '';
      if (hintParts.cmd.startsWith(partial) && hintParts.cmd !== partial) {
        return {
          suggestions: [hintParts.cmd],
          replaceFrom: 0,
          replaceTo: context.cursorPos,
        };
      }
    }

    // For git commands, verify the subcommand matches before suggesting args
    if (context.cmd === 'git' && hintParts.args.length > 0) {
      const userSubcmd = context.parts[1] || '';
      const hintSubcmd = hintParts.args[0];
      // If user has typed a subcommand that doesn't match hint, return empty
      if (userSubcmd && !hintSubcmd.startsWith(userSubcmd)) {
        return { suggestions: [], replaceFrom: context.cursorPos, replaceTo: context.cursorPos };
      }
    }

    // Filter out empty parts (trailing space creates empty string in parts array)
    const nonEmptyParts = context.parts.filter(p => p !== '');

    // Determine which argument position user is completing
    // parts[0] is the command, so argIndex 0 = first argument
    const argIndex = context.endsWithSpace
      ? nonEmptyParts.length - 1   // Completing next argument
      : nonEmptyParts.length - 2;  // Completing current (partial) argument

    // Only suggest if we have an argument at this position in the hint
    if (argIndex < 0 || argIndex >= hintParts.args.length) {
      return { suggestions: [], replaceFrom: context.cursorPos, replaceTo: context.cursorPos };
    }

    const partial = context.endsWithSpace ? '' : (nonEmptyParts[nonEmptyParts.length - 1] || '');
    const expectedArg = hintParts.args[argIndex];

    // Only suggest if the expected argument matches the partial
    if (!expectedArg.startsWith(partial) || expectedArg === partial) {
      return { suggestions: [], replaceFrom: context.cursorPos, replaceTo: context.cursorPos };
    }

    const replaceFrom = context.endsWithSpace
      ? context.cursorPos
      : context.lineUpToCursor.lastIndexOf(partial);

    return {
      suggestions: [expectedArg],
      replaceFrom,
      replaceTo: context.cursorPos,
    };
  }

  /**
   * Parse hint string like "Type: touch README.md" or "Type: git add README.md"
   * Returns the command and its arguments
   */
  private parseHint(hint: string): { cmd: string; args: string[] } | null {
    // Remove "Type: " prefix if present
    let cleaned = hint.replace(/^Type:\s*/i, '').trim();
    if (!cleaned) return null;

    // Strip parenthetical comments like "(or use the editor)" from the end
    cleaned = cleaned.replace(/\s+\([^)]*\)\s*$/, '').trim();
    if (!cleaned) return null;

    // Handle quoted strings (for commit messages etc.)
    const parts: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (const char of cleaned) {
      if ((char === '"' || char === "'") && !inQuote) {
        inQuote = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuote) {
        inQuote = false;
        current += char;
        parts.push(current);
        current = '';
        quoteChar = '';
      } else if (char === ' ' && !inQuote) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    if (current) {
      parts.push(current);
    }

    if (parts.length === 0) return null;

    return {
      cmd: parts[0],
      args: parts.slice(1),
    };
  }
}

// Singleton instance for use across the completion system
export const lessonCompleter = new LessonCompleter();
