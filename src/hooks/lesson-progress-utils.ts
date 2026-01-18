/**
 * Pure utility functions for lesson progress logic.
 * No React, no I/O - fully unit testable.
 */

import type { Lesson } from '../types/lesson';

/**
 * Get exercise IDs that should be marked as "completed" after skipping to a lesson.
 *
 * Returns the FIRST exercise ID from each previous lesson. First exercises
 * validate "starting prerequisites" (e.g., repoInitialized, fileExists) which
 * persist across lessons, unlike transient validators (e.g., fileStaged which
 * clears after commit).
 *
 * @param lessons - All lessons in order
 * @param targetLessonIndex - Index of the lesson being skipped to
 * @returns Array of exercise IDs to mark as completed
 */
export function getPrerequisiteExerciseIds(
  lessons: Lesson[],
  targetLessonIndex: number
): string[] {
  if (targetLessonIndex <= 0) {
    return [];
  }

  return lessons
    .slice(0, targetLessonIndex)
    .map(lesson => lesson.exercises[0]?.id)
    .filter((id): id is string => id !== undefined);
}

/**
 * Find an exercise by ID across all lessons.
 *
 * Used by integrity checking to find validators for exercises that may
 * belong to previous lessons (after skip).
 *
 * @param lessons - All lessons to search
 * @param exerciseId - The exercise ID to find
 * @returns The exercise if found, undefined otherwise
 */
export function findExerciseById(
  lessons: Lesson[],
  exerciseId: string
): Lesson['exercises'][number] | undefined {
  for (const lesson of lessons) {
    const exercise = lesson.exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      return exercise;
    }
  }
  return undefined;
}
