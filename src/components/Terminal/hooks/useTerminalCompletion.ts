import { useRef, useCallback } from 'react';
import { getCompletions } from '../../../lib/completion';

export interface CompletionState {
  suggestions: string[];
  index: number;
  replaceFrom: number;
  originalLine: string;
  originalCursorPos: number;
}

export interface UseTerminalCompletionReturn {
  completionState: CompletionState | null;
  resetCompletion: () => void;
  cycleCompletion: () => { completion: string; suggestions: string[]; index: number } | null;
  startCompletion: (line: string, cursorPos: number) => Promise<{
    type: 'single' | 'multiple';
    completion: string;
    suggestions: string[];
    replaceFrom: number;
  } | null>;
  applyCompletion: (completion: string, replaceFrom: number, currentLine: string) => {
    newLine: string;
    newCursorPos: number;
  };
}

export function useTerminalCompletion(): UseTerminalCompletionReturn {
  const completionStateRef = useRef<CompletionState | null>(null);

  const resetCompletion = useCallback(() => {
    completionStateRef.current = null;
  }, []);

  const cycleCompletion = useCallback(() => {
    if (!completionStateRef.current) return null;

    const state = completionStateRef.current;
    state.index = (state.index + 1) % state.suggestions.length;
    const completion = state.suggestions[state.index];

    return {
      completion,
      suggestions: state.suggestions,
      index: state.index,
    };
  }, []);

  const startCompletion = useCallback(async (line: string, cursorPos: number) => {
    const { suggestions, replaceFrom } = await getCompletions(line, cursorPos);

    if (suggestions.length === 0) {
      return null;
    }

    if (suggestions.length === 1) {
      return {
        type: 'single' as const,
        completion: suggestions[0],
        suggestions,
        replaceFrom,
      };
    }

    // Multiple completions - enter completion mode
    completionStateRef.current = {
      suggestions,
      index: 0,
      replaceFrom,
      originalLine: line,
      originalCursorPos: cursorPos,
    };

    return {
      type: 'multiple' as const,
      completion: suggestions[0],
      suggestions,
      replaceFrom,
    };
  }, []);

  const applyCompletion = useCallback((
    completion: string,
    replaceFrom: number,
    currentLine: string
  ) => {
    const beforeReplace = currentLine.slice(0, replaceFrom);
    const newLine = beforeReplace + completion;
    return {
      newLine,
      newCursorPos: newLine.length,
    };
  }, []);

  return {
    get completionState() { return completionStateRef.current; },
    resetCompletion,
    cycleCompletion,
    startCompletion,
    applyCompletion,
  };
}
