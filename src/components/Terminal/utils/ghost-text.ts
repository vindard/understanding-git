/**
 * Compute the ghost text to display for inline completion preview.
 * Ghost text shows the portion of the completion that extends beyond what's already typed.
 */
export function computeGhostText(
  currentLine: string,
  cursorPos: number,
  suggestion: string,
  replaceFrom: number
): string {
  // The suggestion replaces text from replaceFrom to cursorPos
  // Ghost text is the part of the suggestion that extends beyond cursorPos
  const textBeingReplaced = currentLine.slice(replaceFrom, cursorPos);

  // If suggestion doesn't start with what we're replacing, no ghost text
  if (!suggestion.startsWith(textBeingReplaced)) {
    return '';
  }

  // Ghost text is the remaining part of the suggestion after what's typed
  return suggestion.slice(textBeingReplaced.length);
}
