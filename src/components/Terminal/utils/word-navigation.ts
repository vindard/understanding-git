/**
 * Find the position of the previous word boundary.
 * Word boundaries include spaces and special characters: / | . - _
 */
export function findPrevWordBoundary(line: string, cursorPos: number): number {
  let newPos = cursorPos - 1;
  // Skip any trailing spaces/delimiters
  while (newPos > 0 && /[\s\/|.\-_]/.test(line[newPos])) {
    newPos--;
  }
  // Move until we hit a delimiter or start of line
  while (newPos > 0 && !/[\s\/|.\-_]/.test(line[newPos - 1])) {
    newPos--;
  }
  return newPos;
}

/**
 * Find the position of the next word boundary.
 * Word boundaries include spaces and special characters: / | . - _
 */
export function findNextWordBoundary(line: string, cursorPos: number): number {
  let newPos = cursorPos;
  // Skip current word characters
  while (newPos < line.length && !/[\s\/|.\-_]/.test(line[newPos])) {
    newPos++;
  }
  // Skip any spaces/delimiters
  while (newPos < line.length && /[\s\/|.\-_]/.test(line[newPos])) {
    newPos++;
  }
  return newPos;
}
