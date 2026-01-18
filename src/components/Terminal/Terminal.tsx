import { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getCompletions } from '../../lib/completion/index';
import type { CommandResult } from '../../lib/commands/types';
import { findPrevWordBoundary, findNextWordBoundary } from './utils/word-navigation';
import { buildLineOutput } from './utils/line-output';
import { isMacPlatform, getShortcutHint, shouldShowHint, shouldPrioritizeAdvanceHint } from './utils/shortcut-hint';
import { cycleIndex } from './utils/completion-cycling';
import { computeGhostText } from './utils/ghost-text';
import '@xterm/xterm/css/xterm.css';
import styles from './Terminal.module.css';

interface TerminalProps {
  onCommand?: (command: string) => Promise<CommandResult>;
  canAdvanceLesson?: boolean;
}

export function Terminal({ onCommand, canAdvanceLesson }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const onCommandRef = useRef(onCommand);
  const canAdvanceLessonRef = useRef(canAdvanceLesson);
  const prevCanAdvanceLessonRef = useRef(canAdvanceLesson);
  const clearHintRef = useRef<(() => void) | null>(null);
  const fetchGhostTextRef = useRef<(() => void) | null>(null);

  // Keep refs updated with latest values
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    const prevValue = prevCanAdvanceLessonRef.current;
    canAdvanceLessonRef.current = canAdvanceLesson;
    prevCanAdvanceLessonRef.current = canAdvanceLesson;

    // When transitioning from "can advance" to "cannot advance", we moved to a new exercise
    // Re-fetch ghost text to show the new hint
    if (prevValue && !canAdvanceLesson && fetchGhostTextRef.current) {
      // Small delay to ensure LessonCompleter has been updated with new exercise
      setTimeout(() => {
        fetchGhostTextRef.current?.();
      }, 50);
    }

    // Clear hint when we can no longer advance (e.g., moved to next lesson)
    if (!canAdvanceLesson && clearHintRef.current) {
      clearHintRef.current();
    }
  }, [canAdvanceLesson]);

  const welcomeMessage = "\x1b[2mType 'help' to see available commands, or 'git init' to get started\x1b[0m";

  const writeOutput = useCallback((term: XTerm, output: string) => {
    if (!output) return;
    // Handle clear screen - redraw welcome message after clearing
    const isClearScreen = output.includes('\x1b[2J');
    if (isClearScreen) {
      term.write('\x1b[2J\x1b[H');  // Clear and move to home
      term.write(welcomeMessage + '\r\n\r\n');
      return;
    }
    const lines = output.split('\n');
    lines.forEach((line, i) => {
      term.write(line);
      if (i < lines.length - 1) {
        term.write('\r\n');
      }
    });
    term.write('\r\n');
  }, []);

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#264f78',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    let currentLine = '';
    let cursorPos = 0;
    let prevLineLength = 0;  // Track previous line length to clear properly
    const history: string[] = [];
    let historyIndex = -1;
    let hintVisible = false;

    // Ghost text state for inline completion preview
    let ghostText = '';
    let ghostReplaceFrom = 0;

    // Ghost cursor blink state (custom cursor when ghost text is at cursor position)
    let ghostCursorState: 'on' | 'off' = 'on';
    let ghostCursorBlinkInterval: ReturnType<typeof setInterval> | null = null;
    const CURSOR_BLINK_MS = 530; // Match typical terminal cursor blink rate

    // Shortcut hint for advancing to next lesson
    const shortcutHint = getShortcutHint(isMacPlatform());

    const showHint = () => {
      // Don't show advance hint if ghost text is visible
      if (ghostText) return;
      if (shouldShowHint(currentLine, canAdvanceLessonRef.current ?? false, hintVisible)) {
        // Write a space for cursor to sit on, then the dim hint
        term.write(` \x1b[2m${shortcutHint}\x1b[0m`);
        // Move cursor back to the space (before the hint text)
        term.write(`\x1b[${shortcutHint.length + 1}D`);
        hintVisible = true;
      }
    };

    const clearHint = () => {
      if (hintVisible) {
        // Clear the hint by overwriting with spaces (including the leading space)
        term.write(' '.repeat(shortcutHint.length + 1));
        term.write(`\x1b[${shortcutHint.length + 1}D`);
        hintVisible = false;
      }
    };

    // Store clearHint in ref so it can be called from outside this effect
    clearHintRef.current = clearHint;

    // Completion state
    let completionState: {
      suggestions: string[];
      index: number;
      replaceFrom: number;
      originalLine: string;
      originalCursorPos: number;
    } | null = null;

    const resetCompletion = () => {
      if (completionState) {
        // Clear the suggestions line below, stay on command line
        term.write('\r\n');        // Move to suggestions line
        term.write('\x1b[2K');     // Clear it
        term.write('\x1b[A');      // Move back up to command line
        term.write('\r$ ');        // Reposition
        term.write(currentLine);
        // Restore cursor position
        const moveBack = currentLine.length - cursorPos;
        if (moveBack > 0) {
          term.write(`\x1b[${moveBack}D`);
        }
      }
      completionState = null;
    };

    // Check if ghost cursor should be active (ghost text present and cursor at end)
    const shouldUseGhostCursor = () => ghostText && cursorPos === currentLine.length;

    const updateLine = () => {
      const useGhostCursor = shouldUseGhostCursor();
      const { output, newPrevLength } = buildLineOutput(
        currentLine,
        cursorPos,
        prevLineLength,
        ghostText,
        useGhostCursor ? ghostCursorState : undefined
      );
      term.write(output);
      prevLineLength = newPrevLength;
    };

    const startGhostCursorBlink = () => {
      if (ghostCursorBlinkInterval) return; // Already running

      // Hide native cursor
      term.write('\x1b[?25l');
      ghostCursorState = 'on';
      updateLine();

      ghostCursorBlinkInterval = setInterval(() => {
        ghostCursorState = ghostCursorState === 'on' ? 'off' : 'on';
        updateLine();
      }, CURSOR_BLINK_MS);
    };

    const stopGhostCursorBlink = () => {
      if (ghostCursorBlinkInterval) {
        clearInterval(ghostCursorBlinkInterval);
        ghostCursorBlinkInterval = null;
      }
      // Show native cursor
      term.write('\x1b[?25h');
      ghostCursorState = 'on';
    };

    const updateGhostCursorBlink = () => {
      if (shouldUseGhostCursor()) {
        startGhostCursorBlink();
      } else {
        stopGhostCursorBlink();
      }
    };

    const clearGhostText = () => {
      ghostText = '';
      ghostReplaceFrom = 0;
      stopGhostCursorBlink();
    };

    const fetchGhostText = () => {
      // Prioritize advance hint over ghost text at end of lesson
      if (shouldPrioritizeAdvanceHint(currentLine, canAdvanceLessonRef.current ?? false)) {
        if (ghostText) {
          clearGhostText();
          updateLine();
        }
        showHint();
        return;
      }

      // Capture current state for the async callback
      const capturedLine = currentLine;
      const capturedCursorPos = cursorPos;

      getCompletions(capturedLine, capturedCursorPos).then(({ suggestions, replaceFrom }) => {
        // Only apply if the line hasn't changed since we started fetching
        if (currentLine !== capturedLine || cursorPos !== capturedCursorPos) {
          return;
        }

        if (suggestions.length > 0) {
          const newGhost = computeGhostText(capturedLine, capturedCursorPos, suggestions[0], replaceFrom);
          ghostText = newGhost;
          ghostReplaceFrom = replaceFrom;
          updateLine();
          updateGhostCursorBlink();
        } else {
          if (ghostText) {
            clearGhostText();
            updateLine();
          }
          // No ghost text - show advance hint if applicable
          showHint();
        }
      });
    };

    // Store fetchGhostText in ref so it can be called from outside this effect
    fetchGhostTextRef.current = fetchGhostText;

    const acceptGhostText = (): boolean => {
      if (ghostText) {
        stopGhostCursorBlink();
        currentLine = currentLine.slice(0, cursorPos) + ghostText + currentLine.slice(cursorPos);
        cursorPos += ghostText.length;
        ghostText = '';
        ghostReplaceFrom = 0;
        updateLine();
        return true;
      }
      return false;
    };

    const applyCompletion = (completion: string, replaceFrom: number) => {
      const beforeReplace = currentLine.slice(0, replaceFrom);
      currentLine = beforeReplace + completion;
      cursorPos = currentLine.length;
    };

    const renderSuggestionsLine = (suggestions: string[], activeIndex: number): string => {
      return suggestions.map((suggestion, i) => {
        if (i === activeIndex) {
          return `\x1b[7m${suggestion}\x1b[0m`;
        }
        return suggestion;
      }).join('  ');
    };

    const showCompletionsInitial = (suggestions: string[], activeIndex: number) => {
      // Update command line in place, show suggestions below, return cursor to command line
      // Use single atomic write to prevent cursor flicker
      const clearLength = Math.max(currentLine.length, prevLineLength);
      const suggestionsLine = renderSuggestionsLine(suggestions, activeIndex);
      const output = '\r$ ' + ' '.repeat(clearLength) + '\r$ ' + currentLine +
        '\r\n' + suggestionsLine +
        '\x1b[A' + `\r$ ${currentLine}`;
      term.write(output);
      prevLineLength = currentLine.length;
    };

    const updateCompletionsInPlace = (suggestions: string[], activeIndex: number) => {
      // Update command line, then update suggestions line below
      // Use single atomic write to prevent cursor flicker
      const clearLength = Math.max(currentLine.length, prevLineLength);
      const suggestionsLine = renderSuggestionsLine(suggestions, activeIndex);
      const output = '\r$ ' + ' '.repeat(clearLength) + '\r$ ' + currentLine +
        '\r\n' + '\x1b[2K' + suggestionsLine +
        '\x1b[A' + `\r$ ${currentLine}`;
      term.write(output);
      prevLineLength = currentLine.length;
    };

    // Welcome message (dimmed)
    term.write(welcomeMessage + '\r\n\r\n');
    term.write('$ ');
    fetchGhostText();

    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.key === 'Enter') {
        resetCompletion();
        clearHint();
        clearGhostText();
        const cmd = currentLine.trim();
        const isClearCmd = cmd === 'clear';

        // Skip newline for clear command to avoid flicker
        if (!isClearCmd) {
          term.write('\r\n');
        }

        if (cmd) {
          history.push(cmd);
          historyIndex = history.length;
        }

        currentLine = '';
        cursorPos = 0;
        prevLineLength = 0;

        if (cmd && onCommandRef.current) {
          onCommandRef.current(cmd).then((result) => {
            writeOutput(term, result.output);
            term.write('$ ');
            fetchGhostText();
          }).catch((err) => {
            writeOutput(term, `Error: ${err.message}`);
            term.write('$ ');
            fetchGhostText();
          });
        } else {
          term.write('$ ');
          fetchGhostText();
        }
      } else if (domEvent.key === 'Backspace') {
        resetCompletion();
        clearGhostText();
        if (cursorPos > 0) {
          if (domEvent.metaKey) {
            // Cmd+Backspace: Delete from cursor to beginning of line
            currentLine = currentLine.slice(cursorPos);
            cursorPos = 0;
            updateLine();
          } else if (domEvent.altKey) {
            // Option+Backspace: Delete previous word
            const newPos = findPrevWordBoundary(currentLine, cursorPos);
            currentLine = currentLine.slice(0, newPos) + currentLine.slice(cursorPos);
            cursorPos = newPos;
            updateLine();
          } else {
            // Regular Backspace: Delete one character
            currentLine = currentLine.slice(0, cursorPos - 1) + currentLine.slice(cursorPos);
            cursorPos--;
            updateLine();
          }
          fetchGhostText();
        }
      } else if (domEvent.key === 'Delete') {
        resetCompletion();
        clearGhostText();
        if (cursorPos < currentLine.length) {
          currentLine = currentLine.slice(0, cursorPos) + currentLine.slice(cursorPos + 1);
          updateLine();
          fetchGhostText();
        }
      } else if (domEvent.key === 'ArrowLeft') {
        resetCompletion();
        clearGhostText();
        if (domEvent.altKey) {
          // Option+ArrowLeft: Jump to previous word boundary
          if (cursorPos > 0) {
            const newPos = findPrevWordBoundary(currentLine, cursorPos);
            const moveBy = cursorPos - newPos;
            if (moveBy > 0) {
              term.write(`\x1b[${moveBy}D`);
              cursorPos = newPos;
            }
          }
        } else if (cursorPos > 0) {
          // Regular ArrowLeft: Move one character
          cursorPos--;
          term.write('\x1b[D');
        }
        updateLine();
      } else if (domEvent.key === 'ArrowRight') {
        resetCompletion();
        if (domEvent.altKey) {
          // Option+ArrowRight: Jump to next word boundary
          clearGhostText();
          if (cursorPos < currentLine.length) {
            const newPos = findNextWordBoundary(currentLine, cursorPos);
            const moveBy = newPos - cursorPos;
            if (moveBy > 0) {
              term.write(`\x1b[${moveBy}C`);
              cursorPos = newPos;
            }
          }
          updateLine();
        } else if (cursorPos < currentLine.length) {
          // Regular ArrowRight: Move one character
          clearGhostText();
          cursorPos++;
          term.write('\x1b[C');
          updateLine();
        } else if (ghostText) {
          // At end of line with ghost text - accept it
          acceptGhostText();
          fetchGhostText();
        }
      // ArrowUp/ArrowDown handled in attachCustomKeyEventHandler
      } else if (domEvent.key === 'Home') {
        resetCompletion();
        clearGhostText();
        if (cursorPos > 0) {
          term.write(`\x1b[${cursorPos}D`);
          cursorPos = 0;
        }
        updateLine();
      } else if (domEvent.key === 'End') {
        resetCompletion();
        clearGhostText();
        if (cursorPos < currentLine.length) {
          term.write(`\x1b[${currentLine.length - cursorPos}C`);
          cursorPos = currentLine.length;
        }
        updateLine();
      } else if (domEvent.ctrlKey && domEvent.key === 'a') {
        // Ctrl+A: Move cursor to beginning of line
        resetCompletion();
        clearGhostText();
        if (cursorPos > 0) {
          term.write(`\x1b[${cursorPos}D`);
          cursorPos = 0;
        }
        updateLine();
      } else if (domEvent.ctrlKey && domEvent.key === 'e') {
        // Ctrl+E: Move cursor to end of line
        resetCompletion();
        clearGhostText();
        if (cursorPos < currentLine.length) {
          term.write(`\x1b[${currentLine.length - cursorPos}C`);
          cursorPos = currentLine.length;
        }
        updateLine();
      } else if (domEvent.ctrlKey && domEvent.key === 'u') {
        // Ctrl+U: Delete from cursor to beginning of line
        resetCompletion();
        clearGhostText();
        if (cursorPos > 0) {
          currentLine = currentLine.slice(cursorPos);
          cursorPos = 0;
          updateLine();
          fetchGhostText();
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'k') {
        // Ctrl+K: Delete from cursor to end of line
        resetCompletion();
        clearGhostText();
        if (cursorPos < currentLine.length) {
          currentLine = currentLine.slice(0, cursorPos);
          updateLine();
          fetchGhostText();
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'w') {
        // Ctrl+W: Delete previous word
        resetCompletion();
        clearGhostText();
        if (cursorPos > 0) {
          const newPos = findPrevWordBoundary(currentLine, cursorPos);
          currentLine = currentLine.slice(0, newPos) + currentLine.slice(cursorPos);
          cursorPos = newPos;
          updateLine();
          fetchGhostText();
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'l') {
        // Ctrl+L: Clear screen (preserve welcome message)
        resetCompletion();
        clearGhostText();
        term.write('\x1b[2J\x1b[H');
        term.write(welcomeMessage + '\r\n\r\n');
        term.write('$ ' + currentLine);
        // Restore cursor position
        const moveBack = currentLine.length - cursorPos;
        if (moveBack > 0) {
          term.write(`\x1b[${moveBack}D`);
        }
      } else if (domEvent.key === 'Tab') {
        domEvent.preventDefault();
        clearGhostText();

        if (completionState) {
          // Already in completion mode - cycle through suggestions
          // Tab = forward, Shift+Tab = backward
          const direction = domEvent.shiftKey ? 'backward' : 'forward';
          completionState.index = cycleIndex(
            completionState.index,
            completionState.suggestions.length,
            direction
          );
          const completion = completionState.suggestions[completionState.index];
          applyCompletion(completion, completionState.replaceFrom);
          updateCompletionsInPlace(completionState.suggestions, completionState.index);
        } else {
          // Start new completion
          getCompletions(currentLine, cursorPos).then(({ suggestions, replaceFrom }) => {
            if (suggestions.length === 0) {
              return;
            }

            if (suggestions.length === 1) {
              // Single completion - apply it directly
              applyCompletion(suggestions[0], replaceFrom);
              updateLine();
              // Fetch new ghost text after completion
              fetchGhostText();
            } else {
              // Multiple completions - enter completion mode
              completionState = {
                suggestions,
                index: 0,
                replaceFrom,
                originalLine: currentLine,
                originalCursorPos: cursorPos,
              };
              applyCompletion(suggestions[0], replaceFrom);
              showCompletionsInitial(suggestions, 0);
            }
          });
        }
      } else if (printable && key.length === 1) {
        resetCompletion();
        clearHint();
        clearGhostText();
        // Insert character at cursor position
        currentLine = currentLine.slice(0, cursorPos) + key + currentLine.slice(cursorPos);
        cursorPos++;
        updateLine();
        // Fetch new ghost text for inline preview
        fetchGhostText();
      }
    });

    // Intercept certain keys before xterm.js processes them
    // Without this, xterm sends escape sequences that interfere with our line editing
    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      // Let Cmd/Ctrl+Enter bubble up for global handling (next lesson shortcut)
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && e.type === 'keydown') {
        return false; // Don't let xterm handle it, let it bubble to window
      }
      // Handle ArrowUp/ArrowDown here to prevent xterm from processing them
      if (e.key === 'ArrowUp' && e.type === 'keydown') {
        resetCompletion();
        clearGhostText();
        if (history.length > 0 && historyIndex > 0) {
          historyIndex--;
          currentLine = history[historyIndex];
          cursorPos = currentLine.length;
          updateLine();
        }
        return false;
      }
      if (e.key === 'ArrowDown' && e.type === 'keydown') {
        resetCompletion();
        clearGhostText();
        if (historyIndex < history.length - 1) {
          historyIndex++;
          currentLine = history[historyIndex];
          cursorPos = currentLine.length;
          updateLine();
        } else if (historyIndex === history.length - 1) {
          historyIndex = history.length;
          currentLine = '';
          cursorPos = 0;
          updateLine();
        }
        return false;
      }
      if (e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        if (e.type === 'keydown') {
          clearGhostText();
          if (e.key === 'ArrowLeft' && cursorPos > 0) {
            // Cmd+ArrowLeft: Jump to beginning of line
            term.write(`\x1b[${cursorPos}D`);
            cursorPos = 0;
          } else if (e.key === 'ArrowRight' && cursorPos < currentLine.length) {
            // Cmd+ArrowRight: Jump to end of line
            term.write(`\x1b[${currentLine.length - cursorPos}C`);
            cursorPos = currentLine.length;
          }
          updateLine();
        }
        return false; // Prevent default handling
      }
      return true; // Allow normal handling
    });

    // Use ResizeObserver to handle container resizes (from allotment panes)
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      if (ghostCursorBlinkInterval) {
        clearInterval(ghostCursorBlinkInterval);
      }
      resizeObserver.disconnect();
      term.dispose();
      xtermRef.current = null;
    };
  }, [writeOutput]);

  return <div ref={terminalRef} className={styles.container} />;
}
