/**
 * Build the terminal output string for updating the current command line.
 * Used when navigating history or modifying the current input.
 */
export function buildLineOutput(
  currentLine: string,
  cursorPos: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevLineLength: number,
  ghostText: string = ''
): { output: string; newPrevLength: number } {
  // Use ANSI escape sequence to clear line instead of space padding
  // \r moves cursor to start, \x1b[2K clears entire line
  let output = '\r\x1b[2K$ ' + currentLine;

  // Add ghost text in grey after the current line (at cursor position)
  if (ghostText) {
    // Save cursor, write ghost text in dim, restore cursor
    output += `\x1b[2m${ghostText}\x1b[0m`;
  }

  // Move cursor back to correct position (account for ghost text too)
  const totalLength = currentLine.length + ghostText.length;
  const moveBack = totalLength - cursorPos;
  if (moveBack > 0) {
    output += `\x1b[${moveBack}D`;
  }

  return { output, newPrevLength: currentLine.length + ghostText.length };
}
