/**
 * Detects if the current platform is Mac
 */
export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Returns the keyboard shortcut hint text for advancing to the next lesson
 */
export function getShortcutHint(isMac: boolean): string {
  return isMac ? "'⌘ + Enter' for next lesson" : "'Ctrl + Enter' for next lesson";
}

/**
 * Determines if the shortcut hint should be shown
 */
export function shouldShowHint(
  currentLine: string,
  canAdvanceLesson: boolean,
  hintVisible: boolean
): boolean {
  return currentLine === '' && canAdvanceLesson && !hintVisible;
}

/**
 * Determines if the advance hint should take priority over ghost text.
 * When the user can advance to the next lesson and the line is empty,
 * we should show the "Cmd+Enter for next lesson" hint instead of ghost text.
 */
export function shouldPrioritizeAdvanceHint(
  currentLine: string,
  canAdvanceLesson: boolean
): boolean {
  return currentLine === '' && canAdvanceLesson;
}
