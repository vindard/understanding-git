/**
 * Build the terminal output string for updating the current command line.
 * Used when navigating history or modifying the current input.
 *
 * @param ghostCursorState - When ghost text is present at cursor position:
 *   - 'on': First ghost char shown with reverse video (block cursor effect)
 *   - 'off': First ghost char shown in dim (grey)
 *   - undefined: No custom cursor handling (native cursor used)
 */
export function buildLineOutput(
  currentLine: string,
  cursorPos: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevLineLength: number,
  ghostText: string = '',
  ghostCursorState?: 'on' | 'off'
): { output: string; newPrevLength: number } {
  // Use ANSI escape sequence to clear line instead of space padding
  // \r moves cursor to start, \x1b[2K clears entire line
  let output = '\r\x1b[2K$ ' + currentLine;

  // Add ghost text in grey after the current line (at cursor position)
  if (ghostText) {
    if (ghostCursorState && cursorPos === currentLine.length) {
      // Custom ghost cursor: first char gets special treatment
      const firstChar = ghostText[0];
      const restOfGhost = ghostText.slice(1);

      if (ghostCursorState === 'on') {
        // Cursor ON: reverse video on first char (white bg, dark text)
        output += `\x1b[7m${firstChar}\x1b[27m`;
      } else {
        // Cursor OFF: first char in dim (grey)
        output += `\x1b[2m${firstChar}\x1b[22m`;
      }

      // Rest of ghost text always dim
      if (restOfGhost) {
        output += `\x1b[2m${restOfGhost}\x1b[0m`;
      } else {
        output += '\x1b[0m';
      }
    } else {
      // Standard ghost text rendering (native cursor handles cursor display)
      output += `\x1b[2m${ghostText}\x1b[0m`;
    }
  }

  // Move cursor back to correct position (account for ghost text too)
  const totalLength = currentLine.length + ghostText.length;
  const moveBack = totalLength - cursorPos;
  if (moveBack > 0) {
    output += `\x1b[${moveBack}D`;
  }

  return { output, newPrevLength: currentLine.length + ghostText.length };
}
