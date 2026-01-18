import type { CompletionContext, CompletionResult, CompletionStrategy } from './types';
import type { Exercise } from '../../types/lesson';

// Import commands module to ensure registry is populated before completion
// strategies try to access it
import '../commands';

import { CommandCompleter } from './strategies/command-completer';
import { GitSubcommandCompleter } from './strategies/git-subcommand-completer';
import { FilePathCompleter } from './strategies/file-path-completer';
import { BranchCompleter } from './strategies/branch-completer';
import { lessonCompleter } from './strategies/lesson-completer';

export type { CompletionResult } from './types';

// Regular strategies (excluding lesson completer which is handled specially)
const strategies: CompletionStrategy[] = [
  new CommandCompleter(),
  new GitSubcommandCompleter(),
  new BranchCompleter(),     // Must come before FilePathCompleter for git checkout
  new FilePathCompleter(),
];

/**
 * Set the current exercise for lesson-aware completions.
 * Call this when the current exercise changes.
 */
export function setCurrentExercise(exercise: Exercise | null): void {
  lessonCompleter.setExercise(exercise);
}

/**
 * Parse a command line into parts, respecting quoted strings.
 * For example: 'echo "# My Project" > README.md' becomes ['echo', '"# My Project"', '>', 'README.md']
 * Returns both the parts and whether the input ends in an unclosed quote.
 */
function parseCommandLine(input: string): { parts: string[]; inQuote: boolean } {
  const parts: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const char of input) {
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

  return { parts, inQuote };
}

function createContext(line: string, cursorPos: number): CompletionContext {
  const lineUpToCursor = line.slice(0, cursorPos);
  const { parts, inQuote } = parseCommandLine(lineUpToCursor);
  const cmd = parts[0] || '';
  // Only consider ending with space if we're not in an unclosed quote
  const endsWithSpace = lineUpToCursor.endsWith(' ') && !inQuote;

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

  // First, try to get lesson-specific suggestion
  let lessonResult: CompletionResult | null = null;
  if (lessonCompleter.canHandle(context)) {
    lessonResult = await lessonCompleter.complete(context);
  }

  // Then get suggestions from other strategies
  let otherResult: CompletionResult | null = null;
  for (const strategy of strategies) {
    if (strategy.canHandle(context)) {
      otherResult = await strategy.complete(context);
      break;
    }
  }

  // Merge results: lesson suggestions first, then others (deduplicated)
  if (lessonResult && lessonResult.suggestions.length > 0) {
    if (otherResult && otherResult.suggestions.length > 0) {
      // Merge: lesson first, then others that aren't duplicates
      const lessonSet = new Set(lessonResult.suggestions);
      const merged = [
        ...lessonResult.suggestions,
        ...otherResult.suggestions.filter(s => !lessonSet.has(s)),
      ];
      return {
        suggestions: merged,
        replaceFrom: lessonResult.replaceFrom,
        replaceTo: lessonResult.replaceTo,
      };
    }
    return lessonResult;
  }

  if (otherResult) {
    return otherResult;
  }

  // No strategy matched - return empty result
  return { suggestions: [], replaceFrom: cursorPos, replaceTo: cursorPos };
}
