/**
 * Build the terminal output string for updating the current command line.
 * Used when navigating history or modifying the current input.
 */
export function buildLineOutput(
  currentLine: string,
  cursorPos: number,
  prevLineLength: number
): { output: string; newPrevLength: number } {
  // Current implementation: clear with spaces then redraw
  // BUG: This can cause terminal content to clear when prevLineLength is large
  const clearLength = Math.max(currentLine.length, prevLineLength);
  let output = '\r$ ' + ' '.repeat(clearLength) + '\r$ ' + currentLine;
  const moveBack = currentLine.length - cursorPos;
  if (moveBack > 0) {
    output += `\x1b[${moveBack}D`;
  }
  return { output, newPrevLength: currentLine.length };
}
