/**
 * Build the terminal output string for updating the current command line.
 * Used when navigating history or modifying the current input.
 */
export function buildLineOutput(
  currentLine: string,
  cursorPos: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevLineLength: number
): { output: string; newPrevLength: number } {
  // Use ANSI escape sequence to clear line instead of space padding
  // \r moves cursor to start, \x1b[2K clears entire line
  let output = '\r\x1b[2K$ ' + currentLine;
  const moveBack = currentLine.length - cursorPos;
  if (moveBack > 0) {
    output += `\x1b[${moveBack}D`;
  }
  return { output, newPrevLength: currentLine.length };
}
