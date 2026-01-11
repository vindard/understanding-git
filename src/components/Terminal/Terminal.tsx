import { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getCompletions } from '../../lib/completion';
import '@xterm/xterm/css/xterm.css';
import styles from './Terminal.module.css';

interface CommandResult {
  output: string;
  success: boolean;
}

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

  const writeOutput = useCallback((term: XTerm, output: string) => {
    if (!output) return;
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
    const history: string[] = [];
    let historyIndex = -1;

    const clearLine = () => {
      // Move cursor to start of input and clear
      term.write('\r$ ' + ' '.repeat(currentLine.length) + '\r$ ');
    };

    const redrawLine = () => {
      term.write(currentLine);
      // Move cursor back to correct position
      const moveBack = currentLine.length - cursorPos;
      if (moveBack > 0) {
        term.write(`\x1b[${moveBack}D`);
      }
    };

    term.write('$ ');

    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.key === 'Enter') {
        term.write('\r\n');
        const cmd = currentLine.trim();

        if (cmd) {
          history.push(cmd);
          historyIndex = history.length;
        }

        currentLine = '';
        cursorPos = 0;

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
        if (cursorPos > 0) {
          currentLine = currentLine.slice(0, cursorPos - 1) + currentLine.slice(cursorPos);
          cursorPos--;
          clearLine();
          redrawLine();
        }
      } else if (domEvent.key === 'Delete') {
        if (cursorPos < currentLine.length) {
          currentLine = currentLine.slice(0, cursorPos) + currentLine.slice(cursorPos + 1);
          clearLine();
          redrawLine();
        }
      } else if (domEvent.key === 'ArrowLeft') {
        if (cursorPos > 0) {
          cursorPos--;
          term.write('\x1b[D');
        }
      } else if (domEvent.key === 'ArrowRight') {
        if (cursorPos < currentLine.length) {
          cursorPos++;
          term.write('\x1b[C');
        }
      } else if (domEvent.key === 'ArrowUp') {
        if (history.length > 0 && historyIndex > 0) {
          historyIndex--;
          clearLine();
          currentLine = history[historyIndex];
          cursorPos = currentLine.length;
          redrawLine();
        }
      } else if (domEvent.key === 'ArrowDown') {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          clearLine();
          currentLine = history[historyIndex];
          cursorPos = currentLine.length;
          redrawLine();
        } else if (historyIndex === history.length - 1) {
          historyIndex = history.length;
          clearLine();
          currentLine = '';
          cursorPos = 0;
        }
      } else if (domEvent.key === 'Home') {
        if (cursorPos > 0) {
          term.write(`\x1b[${cursorPos}D`);
          cursorPos = 0;
        }
      } else if (domEvent.key === 'End') {
        if (cursorPos < currentLine.length) {
          term.write(`\x1b[${currentLine.length - cursorPos}C`);
          cursorPos = currentLine.length;
        }
      } else if (domEvent.key === 'Tab') {
        domEvent.preventDefault();
        // Handle tab completion asynchronously
        getCompletions(currentLine, cursorPos).then(({ suggestions, replaceFrom }) => {
          if (suggestions.length === 0) {
            // No completions - do nothing
            return;
          }

          if (suggestions.length === 1) {
            // Single completion - apply it
            const completion = suggestions[0];
            const beforeReplace = currentLine.slice(0, replaceFrom);
            const afterCursor = currentLine.slice(cursorPos);
            currentLine = beforeReplace + completion + afterCursor;
            cursorPos = beforeReplace.length + completion.length;
            clearLine();
            redrawLine();
          } else {
            // Multiple completions - show them
            term.write('\r\n');
            term.write(suggestions.join('  '));
            term.write('\r\n$ ');
            term.write(currentLine);
            // Move cursor back to correct position
            const moveBack = currentLine.length - cursorPos;
            if (moveBack > 0) {
              term.write(`\x1b[${moveBack}D`);
            }
          }
        });
      } else if (printable && key.length === 1) {
        // Insert character at cursor position
        currentLine = currentLine.slice(0, cursorPos) + key + currentLine.slice(cursorPos);
        cursorPos++;
        clearLine();
        redrawLine();
      }
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
