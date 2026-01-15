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
