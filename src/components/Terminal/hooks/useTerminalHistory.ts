import { useRef, useCallback } from 'react';

export interface UseTerminalHistoryReturn {
  addToHistory: (command: string) => void;
  navigateUp: () => string | null;
  navigateDown: () => string | null;
  resetNavigation: () => void;
}

export function useTerminalHistory(): UseTerminalHistoryReturn {
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const addToHistory = useCallback((command: string) => {
    if (command.trim()) {
      historyRef.current.push(command);
      historyIndexRef.current = historyRef.current.length;
    }
  }, []);

  const navigateUp = useCallback((): string | null => {
    if (historyRef.current.length > 0 && historyIndexRef.current > 0) {
      historyIndexRef.current--;
      return historyRef.current[historyIndexRef.current];
    }
    return null;
  }, []);

  const navigateDown = useCallback((): string | null => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      return historyRef.current[historyIndexRef.current];
    } else if (historyIndexRef.current === historyRef.current.length - 1) {
      historyIndexRef.current = historyRef.current.length;
      return ''; // Return empty string to clear line
    }
    return null;
  }, []);

  const resetNavigation = useCallback(() => {
    historyIndexRef.current = historyRef.current.length;
  }, []);

  return {
    addToHistory,
    navigateUp,
    navigateDown,
    resetNavigation,
  };
}
