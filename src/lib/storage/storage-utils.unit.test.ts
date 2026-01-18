import { describe, it, expect } from 'vitest';
import {
  serializeProgress,
  deserializeProgress,
  isValidStoredProgress,
  getStorageKey,
  createStoredProgress,
} from './storage-utils';
import type { StoredProgress } from './types';

describe('storage-utils pure functions', () => {
  describe('getStorageKey', () => {
    it('returns key with progress prefix and userId', () => {
      expect(getStorageKey('user123')).toBe('progress:user123');
    });

    it('handles anonymous user', () => {
      expect(getStorageKey('anonymous')).toBe('progress:anonymous');
    });

    it('handles empty string userId', () => {
      expect(getStorageKey('')).toBe('progress:');
    });
  });

  describe('createStoredProgress', () => {
    it('creates progress with all fields', () => {
      const result = createStoredProgress(
        'lesson-2',
        1,
        ['ex-1', 'ex-2'],
        2,
      );

      expect(result.lessonId).toBe('lesson-2');
      expect(result.lessonIndex).toBe(1);
      expect(result.completedExercises).toEqual(['ex-1', 'ex-2']);
      expect(result.currentExerciseIndex).toBe(2);
      expect(typeof result.lastUpdated).toBe('number');
      expect(result.lastUpdated).toBeGreaterThan(0);
    });

    it('sets lastUpdated to current timestamp', () => {
      const before = Date.now();
      const result = createStoredProgress('lesson-1', 0, [], 0);
      const after = Date.now();

      expect(result.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(result.lastUpdated).toBeLessThanOrEqual(after);
    });

    it('handles empty completedExercises array', () => {
      const result = createStoredProgress('lesson-1', 0, [], 0);
      expect(result.completedExercises).toEqual([]);
    });
  });

  describe('serializeProgress', () => {
    it('serializes progress to JSON string', () => {
      const progress: StoredProgress = {
        lessonId: 'lesson-3',
        lessonIndex: 2,
        completedExercises: ['ex-1'],
        currentExerciseIndex: 1,
        lastUpdated: 1234567890,
      };

      const result = serializeProgress(progress);
      expect(typeof result).toBe('string');

      const parsed = JSON.parse(result);
      expect(parsed.lessonId).toBe('lesson-3');
      expect(parsed.lessonIndex).toBe(2);
      expect(parsed.completedExercises).toEqual(['ex-1']);
      expect(parsed.currentExerciseIndex).toBe(1);
      expect(parsed.lastUpdated).toBe(1234567890);
    });

    it('handles empty completedExercises', () => {
      const progress: StoredProgress = {
        lessonId: 'lesson-1',
        lessonIndex: 0,
        completedExercises: [],
        currentExerciseIndex: 0,
        lastUpdated: 1000,
      };

      const result = serializeProgress(progress);
      const parsed = JSON.parse(result);
      expect(parsed.completedExercises).toEqual([]);
    });
  });

  describe('deserializeProgress', () => {
    it('deserializes valid JSON to StoredProgress', () => {
      const json = JSON.stringify({
        lessonId: 'lesson-2',
        lessonIndex: 1,
        completedExercises: ['ex-1', 'ex-2'],
        currentExerciseIndex: 2,
        lastUpdated: 9876543210,
      });

      const result = deserializeProgress(json);

      expect(result).not.toBeNull();
      expect(result!.lessonId).toBe('lesson-2');
      expect(result!.lessonIndex).toBe(1);
      expect(result!.completedExercises).toEqual(['ex-1', 'ex-2']);
      expect(result!.currentExerciseIndex).toBe(2);
      expect(result!.lastUpdated).toBe(9876543210);
    });

    it('returns null for invalid JSON', () => {
      const result = deserializeProgress('not valid json');
      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      const result = deserializeProgress('');
      expect(result).toBeNull();
    });

    it('returns null for JSON missing required fields', () => {
      const json = JSON.stringify({ lessonId: 'lesson-1' });
      const result = deserializeProgress(json);
      expect(result).toBeNull();
    });

    it('returns null for JSON with wrong types', () => {
      const json = JSON.stringify({
        lessonId: 123, // should be string
        lessonIndex: 'one', // should be number
        completedExercises: 'not-array',
        currentExerciseIndex: 0,
        lastUpdated: 1000,
      });

      const result = deserializeProgress(json);
      expect(result).toBeNull();
    });
  });

  describe('isValidStoredProgress', () => {
    it('returns true for valid StoredProgress object', () => {
      const valid: StoredProgress = {
        lessonId: 'lesson-1',
        lessonIndex: 0,
        completedExercises: [],
        currentExerciseIndex: 0,
        lastUpdated: Date.now(),
      };

      expect(isValidStoredProgress(valid)).toBe(true);
    });

    it('returns true for progress with completed exercises', () => {
      const valid: StoredProgress = {
        lessonId: 'lesson-5',
        lessonIndex: 4,
        completedExercises: ['ex-1', 'ex-2', 'ex-3'],
        currentExerciseIndex: 3,
        lastUpdated: 1234567890,
      };

      expect(isValidStoredProgress(valid)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isValidStoredProgress(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isValidStoredProgress(undefined)).toBe(false);
    });

    it('returns false for non-object', () => {
      expect(isValidStoredProgress('string')).toBe(false);
      expect(isValidStoredProgress(123)).toBe(false);
      expect(isValidStoredProgress([])).toBe(false);
    });

    it('returns false when lessonId is not a string', () => {
      const invalid = {
        lessonId: 123,
        lessonIndex: 0,
        completedExercises: [],
        currentExerciseIndex: 0,
        lastUpdated: Date.now(),
      };

      expect(isValidStoredProgress(invalid)).toBe(false);
    });

    it('returns false when lessonIndex is not a number', () => {
      const invalid = {
        lessonId: 'lesson-1',
        lessonIndex: '0',
        completedExercises: [],
        currentExerciseIndex: 0,
        lastUpdated: Date.now(),
      };

      expect(isValidStoredProgress(invalid)).toBe(false);
    });

    it('returns false when completedExercises is not an array', () => {
      const invalid = {
        lessonId: 'lesson-1',
        lessonIndex: 0,
        completedExercises: 'not-array',
        currentExerciseIndex: 0,
        lastUpdated: Date.now(),
      };

      expect(isValidStoredProgress(invalid)).toBe(false);
    });

    it('returns false when completedExercises contains non-strings', () => {
      const invalid = {
        lessonId: 'lesson-1',
        lessonIndex: 0,
        completedExercises: [1, 2, 3],
        currentExerciseIndex: 0,
        lastUpdated: Date.now(),
      };

      expect(isValidStoredProgress(invalid)).toBe(false);
    });

    it('returns false when currentExerciseIndex is not a number', () => {
      const invalid = {
        lessonId: 'lesson-1',
        lessonIndex: 0,
        completedExercises: [],
        currentExerciseIndex: 'zero',
        lastUpdated: Date.now(),
      };

      expect(isValidStoredProgress(invalid)).toBe(false);
    });

    it('returns false when lastUpdated is not a number', () => {
      const invalid = {
        lessonId: 'lesson-1',
        lessonIndex: 0,
        completedExercises: [],
        currentExerciseIndex: 0,
        lastUpdated: '1234567890',
      };

      expect(isValidStoredProgress(invalid)).toBe(false);
    });

    it('returns false when required field is missing', () => {
      const missingLessonId = {
        lessonIndex: 0,
        completedExercises: [],
        currentExerciseIndex: 0,
        lastUpdated: Date.now(),
      };

      const missingLessonIndex = {
        lessonId: 'lesson-1',
        completedExercises: [],
        currentExerciseIndex: 0,
        lastUpdated: Date.now(),
      };

      expect(isValidStoredProgress(missingLessonId)).toBe(false);
      expect(isValidStoredProgress(missingLessonIndex)).toBe(false);
    });
  });

  describe('round-trip serialization', () => {
    it('serialize then deserialize returns equivalent object', () => {
      const original: StoredProgress = {
        lessonId: 'lesson-4',
        lessonIndex: 3,
        completedExercises: ['ex-a', 'ex-b'],
        currentExerciseIndex: 2,
        lastUpdated: 1609459200000,
      };

      const json = serializeProgress(original);
      const restored = deserializeProgress(json);

      expect(restored).toEqual(original);
    });
  });
});
