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

    // Only handle if user's command matches the hint's command
    // Check parts.length > 1 OR (parts.length === 1 AND ends with space, meaning ready for first arg)
    const readyForArg = context.parts.length > 1 || (context.parts.length === 1 && context.endsWithSpace);
    return context.cmd === hintParts.cmd && readyForArg;
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const hintParts = this.parseHint(this.exercise!.hint!);
    if (!hintParts) {
      return { suggestions: [], replaceFrom: context.cursorPos, replaceTo: context.cursorPos };
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
    const cleaned = hint.replace(/^Type:\s*/i, '').trim();
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
