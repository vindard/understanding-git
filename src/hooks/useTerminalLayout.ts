import { useState, useRef, useCallback } from 'react';

export interface UseTerminalLayoutReturn {
  isTerminalExpanded: boolean;
  isTerminalFullscreen: boolean;
  terminalSizes: number[];
  savedSizes: number[];
  handleTerminalExpandToggle: () => void;
  handleTerminalFullscreenToggle: () => void;
  handleVerticalSizeChange: (sizes: number[]) => void;
}

export function useTerminalLayout(): UseTerminalLayoutReturn {
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [isTerminalFullscreen, setIsTerminalFullscreen] = useState(false);
  const [terminalSizes, setTerminalSizes] = useState<number[]>([]);
  const [savedSizes, setSavedSizes] = useState<number[]>([]);
  const wasExpandedBeforeFullscreenRef = useRef(false);

  const handleTerminalExpandToggle = useCallback(() => {
    if (!isTerminalExpanded) {
      // Save current sizes before expanding
      setSavedSizes(terminalSizes);
    }
    setIsTerminalExpanded(!isTerminalExpanded);
  }, [isTerminalExpanded, terminalSizes]);

  const handleTerminalFullscreenToggle = useCallback(() => {
    if (!isTerminalFullscreen) {
      // Save current expansion state before going fullscreen
      wasExpandedBeforeFullscreenRef.current = isTerminalExpanded;
      // When going fullscreen, also expand within center pane
      if (!isTerminalExpanded) {
        setSavedSizes(terminalSizes);
        setIsTerminalExpanded(true);
      }
    } else {
      // Restore previous expansion state when exiting fullscreen
      setIsTerminalExpanded(wasExpandedBeforeFullscreenRef.current);
    }
    setIsTerminalFullscreen(!isTerminalFullscreen);
  }, [isTerminalExpanded, isTerminalFullscreen, terminalSizes]);

  const handleVerticalSizeChange = useCallback((sizes: number[]) => {
    if (!isTerminalExpanded) {
      setTerminalSizes(sizes);
    }
  }, [isTerminalExpanded]);

  return {
    isTerminalExpanded,
    isTerminalFullscreen,
    terminalSizes,
    savedSizes,
    handleTerminalExpandToggle,
    handleTerminalFullscreenToggle,
    handleVerticalSizeChange,
  };
}
