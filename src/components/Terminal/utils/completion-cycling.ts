/**
 * Pure utilities for cycling through completion suggestions.
 */

export type CycleDirection = 'forward' | 'backward';

/**
 * Calculate the next index when cycling through a list of suggestions.
 * @param currentIndex - Current position in the list
 * @param totalItems - Total number of items in the list
 * @param direction - 'forward' (Tab) or 'backward' (Shift+Tab)
 * @returns The new index after cycling
 */
export function cycleIndex(
  currentIndex: number,
  totalItems: number,
  direction: CycleDirection
): number {
  if (direction === 'forward') {
    return (currentIndex + 1) % totalItems;
  } else {
    return (currentIndex - 1 + totalItems) % totalItems;
  }
}
