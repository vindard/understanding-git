import { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getCompletions } from '../../lib/completion/index';
import type { CommandResult } from '../../lib/commands/types';
import { findPrevWordBoundary, findNextWordBoundary } from './utils/word-navigation';
import '@xterm/xterm/css/xterm.css';
import styles from './Terminal.module.css';

interface TerminalProps {
  onCommand?: (command: string) => Promise<CommandResult>;
}

export function Terminal({ onCommand }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const onCommandRef = useRef(onCommand);

  // Keep ref updated with latest callback
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

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

    const updateLine = () => {
      // Combine clear and redraw into a single atomic write to prevent cursor flicker
      const clearLength = Math.max(currentLine.length, prevLineLength);
      let output = '\r$ ' + ' '.repeat(clearLength) + '\r$ ' + currentLine;
      const moveBack = currentLine.length - cursorPos;
      if (moveBack > 0) {
        output += `\x1b[${moveBack}D`;
      }
      term.write(output);
      prevLineLength = currentLine.length;
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

    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.key === 'Enter') {
        resetCompletion();
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
          }).catch((err) => {
            writeOutput(term, `Error: ${err.message}`);
            term.write('$ ');
          });
        } else {
          term.write('$ ');
        }
      } else if (domEvent.key === 'Backspace') {
        resetCompletion();
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
        }
      } else if (domEvent.key === 'Delete') {
        resetCompletion();
        if (cursorPos < currentLine.length) {
          currentLine = currentLine.slice(0, cursorPos) + currentLine.slice(cursorPos + 1);
          updateLine();
        }
      } else if (domEvent.key === 'ArrowLeft') {
        resetCompletion();
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
      } else if (domEvent.key === 'ArrowRight') {
        resetCompletion();
        if (domEvent.altKey) {
          // Option+ArrowRight: Jump to next word boundary
          if (cursorPos < currentLine.length) {
            const newPos = findNextWordBoundary(currentLine, cursorPos);
            const moveBy = newPos - cursorPos;
            if (moveBy > 0) {
              term.write(`\x1b[${moveBy}C`);
              cursorPos = newPos;
            }
          }
        } else if (cursorPos < currentLine.length) {
          // Regular ArrowRight: Move one character
          cursorPos++;
          term.write('\x1b[C');
        }
      } else if (domEvent.key === 'ArrowUp') {
        resetCompletion();
        if (history.length > 0 && historyIndex > 0) {
          historyIndex--;
          currentLine = history[historyIndex];
          cursorPos = currentLine.length;
          updateLine();
        }
      } else if (domEvent.key === 'ArrowDown') {
        resetCompletion();
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
      } else if (domEvent.key === 'Home') {
        resetCompletion();
        if (cursorPos > 0) {
          term.write(`\x1b[${cursorPos}D`);
          cursorPos = 0;
        }
      } else if (domEvent.key === 'End') {
        resetCompletion();
        if (cursorPos < currentLine.length) {
          term.write(`\x1b[${currentLine.length - cursorPos}C`);
          cursorPos = currentLine.length;
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'a') {
        // Ctrl+A: Move cursor to beginning of line
        resetCompletion();
        if (cursorPos > 0) {
          term.write(`\x1b[${cursorPos}D`);
          cursorPos = 0;
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'e') {
        // Ctrl+E: Move cursor to end of line
        resetCompletion();
        if (cursorPos < currentLine.length) {
          term.write(`\x1b[${currentLine.length - cursorPos}C`);
          cursorPos = currentLine.length;
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'u') {
        // Ctrl+U: Delete from cursor to beginning of line
        resetCompletion();
        if (cursorPos > 0) {
          currentLine = currentLine.slice(cursorPos);
          cursorPos = 0;
          updateLine();
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'k') {
        // Ctrl+K: Delete from cursor to end of line
        resetCompletion();
        if (cursorPos < currentLine.length) {
          currentLine = currentLine.slice(0, cursorPos);
          updateLine();
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'w') {
        // Ctrl+W: Delete previous word
        resetCompletion();
        if (cursorPos > 0) {
          const newPos = findPrevWordBoundary(currentLine, cursorPos);
          currentLine = currentLine.slice(0, newPos) + currentLine.slice(cursorPos);
          cursorPos = newPos;
          updateLine();
        }
      } else if (domEvent.ctrlKey && domEvent.key === 'l') {
        // Ctrl+L: Clear screen (preserve welcome message)
        resetCompletion();
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

        if (completionState) {
          // Already in completion mode - cycle to next
          completionState.index = (completionState.index + 1) % completionState.suggestions.length;
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
        // Insert character at cursor position
        currentLine = currentLine.slice(0, cursorPos) + key + currentLine.slice(cursorPos);
        cursorPos++;
        updateLine();
      }
    });

    // Handle Cmd+Arrow using xterm's custom key handler (browser intercepts these before onKey)
    // Only intercept when Cmd is the only modifier (allow Shift+Cmd+Arrow etc. to pass through)
    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if (e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        if (e.type === 'keydown') {
          if (e.key === 'ArrowLeft' && cursorPos > 0) {
            // Cmd+ArrowLeft: Jump to beginning of line
            term.write(`\x1b[${cursorPos}D`);
            cursorPos = 0;
          } else if (e.key === 'ArrowRight' && cursorPos < currentLine.length) {
            // Cmd+ArrowRight: Jump to end of line
            term.write(`\x1b[${currentLine.length - cursorPos}C`);
            cursorPos = currentLine.length;
          }
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
      resizeObserver.disconnect();
      term.dispose();
      xtermRef.current = null;
    };
  }, [writeOutput]);

  return <div ref={terminalRef} className={styles.container} />;
}
