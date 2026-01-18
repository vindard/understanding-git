/**
 * Unit tests for lesson progress utility functions.
 */

import { describe, it, expect } from 'vitest';
import { getPrerequisiteExerciseIds, findExerciseById } from './lesson-progress-utils';
import type { Lesson } from '../types/lesson';

// Mock lessons for testing - simplified structure
const createMockLesson = (id: string, exerciseIds: string[]): Lesson => ({
  id,
  title: `Lesson ${id}`,
  description: `Description for ${id}`,
  exercises: exerciseIds.map(exId => ({
    id: exId,
    instruction: `Do ${exId}`,
    hint: `Hint for ${exId}`,
    validate: async () => true,
    successMessage: `Completed ${exId}`,
  })),
});

const mockLessons: Lesson[] = [
  createMockLesson('lesson-1', ['1-1', '1-2']),
  createMockLesson('lesson-2', ['2-1', '2-2', '2-3', '2-4']),
  createMockLesson('lesson-3', ['3-1', '3-2']),
  createMockLesson('lesson-4', ['4-1', '4-2', '4-3']),
  createMockLesson('lesson-5', ['5-1', '5-2', '5-3']),
  createMockLesson('lesson-6', ['6-1', '6-2', '6-3', '6-4', '6-5']),
];

describe('getPrerequisiteExerciseIds', () => {
  describe('returns first exercise from each previous lesson', () => {
    it('returns empty array when skipping to lesson 1 (index 0)', () => {
      const result = getPrerequisiteExerciseIds(mockLessons, 0);
      expect(result).toEqual([]);
    });

    it('returns ["1-1"] when skipping to lesson 2 (index 1)', () => {
      const result = getPrerequisiteExerciseIds(mockLessons, 1);
      expect(result).toEqual(['1-1']);
    });

    it('returns ["1-1", "2-1"] when skipping to lesson 3 (index 2)', () => {
      const result = getPrerequisiteExerciseIds(mockLessons, 2);
      expect(result).toEqual(['1-1', '2-1']);
    });

    it('returns ["1-1", "2-1", "3-1"] when skipping to lesson 4 (index 3)', () => {
      const result = getPrerequisiteExerciseIds(mockLessons, 3);
      expect(result).toEqual(['1-1', '2-1', '3-1']);
    });

    it('returns first 5 exercise IDs when skipping to lesson 6 (index 5)', () => {
      const result = getPrerequisiteExerciseIds(mockLessons, 5);
      expect(result).toEqual(['1-1', '2-1', '3-1', '4-1', '5-1']);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for negative index', () => {
      const result = getPrerequisiteExerciseIds(mockLessons, -1);
      expect(result).toEqual([]);
    });

    it('handles empty lessons array', () => {
      const result = getPrerequisiteExerciseIds([], 3);
      expect(result).toEqual([]);
    });

    it('handles index beyond lessons length', () => {
      const result = getPrerequisiteExerciseIds(mockLessons, 10);
      // Should return first exercise from all 6 lessons
      expect(result).toEqual(['1-1', '2-1', '3-1', '4-1', '5-1', '6-1']);
    });

    it('handles lesson with no exercises', () => {
      const lessonsWithEmpty: Lesson[] = [
        createMockLesson('lesson-1', ['1-1']),
        createMockLesson('lesson-2', []), // Empty exercises
        createMockLesson('lesson-3', ['3-1']),
      ];
      const result = getPrerequisiteExerciseIds(lessonsWithEmpty, 3);
      // Should skip the empty lesson
      expect(result).toEqual(['1-1', '3-1']);
    });
  });

  describe('documents the bug fix', () => {
    it('only returns FIRST exercise IDs, not all (fixes transient validator bug)', () => {
      // Bug: Previously returned ALL exercise IDs from previous lessons
      // This caused transient validators like fileStaged (exercise 2-3, 2-4)
      // to fail after commit, even when state was restored

      const result = getPrerequisiteExerciseIds(mockLessons, 3); // Skip to lesson 4

      // Should NOT include 2-2, 2-3, 2-4 (which have transient validators)
      expect(result).not.toContain('2-2');
      expect(result).not.toContain('2-3');
      expect(result).not.toContain('2-4');

      // Should only include first exercises (which have persistent validators)
      expect(result).toEqual(['1-1', '2-1', '3-1']);
    });

    it('returns non-empty array after skip (fixes empty completedExercises bug)', () => {
      // Bug: Previously skipToLesson set completedExercises: []
      // This meant no validators ran during integrity checks

      const result = getPrerequisiteExerciseIds(mockLessons, 4); // Skip to lesson 5

      // Should have exercises to validate, not empty
      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(['1-1', '2-1', '3-1', '4-1']);
    });
  });
});

describe('findExerciseById', () => {
  describe('finds exercises across all lessons', () => {
    it('finds exercise in first lesson', () => {
      const result = findExerciseById(mockLessons, '1-1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('1-1');
    });

    it('finds exercise in middle lesson', () => {
      const result = findExerciseById(mockLessons, '3-2');
      expect(result).toBeDefined();
      expect(result?.id).toBe('3-2');
    });

    it('finds exercise in last lesson', () => {
      const result = findExerciseById(mockLessons, '6-5');
      expect(result).toBeDefined();
      expect(result?.id).toBe('6-5');
    });

    it('finds middle exercise in a lesson with many exercises', () => {
      const result = findExerciseById(mockLessons, '2-3');
      expect(result).toBeDefined();
      expect(result?.id).toBe('2-3');
    });
  });

  describe('returns undefined for non-existent exercises', () => {
    it('returns undefined for non-existent ID', () => {
      const result = findExerciseById(mockLessons, 'non-existent');
      expect(result).toBeUndefined();
    });

    it('returns undefined for empty lessons array', () => {
      const result = findExerciseById([], '1-1');
      expect(result).toBeUndefined();
    });
  });

  describe('documents the bug fix', () => {
    it('searches ALL lessons, not just current lesson (fixes cross-lesson search bug)', () => {
      // Bug: Previously checkStateIntegrity only searched currentLesson.exercises
      // After skip, completedExercises contains IDs from previous lessons,
      // so searching only currentLesson would never find them

      // Simulate: we're on lesson 4, but need to find exercise from lesson 2
      const exerciseFromLesson2 = findExerciseById(mockLessons, '2-1');

      // Should find it even though it's not in "current" lesson
      expect(exerciseFromLesson2).toBeDefined();
      expect(exerciseFromLesson2?.id).toBe('2-1');
    });
  });
});
