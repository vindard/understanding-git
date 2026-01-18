/**
 * Integration tests for storage service with localStorage adapter.
 * Tests save/load/clear operations and adapter swapping.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveProgress,
  loadProgress,
  clearProgress,
  setStorageAdapter,
  resetStorageAdapter,
  createStoredProgress,
  DEFAULT_USER_ID,
} from './index';
import type { StorageAdapter, StoredProgress } from './types';

describe('Storage Service Integration', () => {
  beforeEach(() => {
    // Clear localStorage and reset adapter before each test
    localStorage.clear();
    resetStorageAdapter();
  });

  describe('saveProgress', () => {
    it('saves progress to localStorage', async () => {
      const progress = createStoredProgress('lesson-2', 1, ['ex-1'], 1);

      await saveProgress(progress);

      const stored = localStorage.getItem(`progress:${DEFAULT_USER_ID}`);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.lessonId).toBe('lesson-2');
      expect(parsed.lessonIndex).toBe(1);
      expect(parsed.completedExercises).toEqual(['ex-1']);
    });

    it('saves progress for specific userId', async () => {
      const progress = createStoredProgress('lesson-3', 2, [], 0);

      await saveProgress(progress, 'user-123');

      const stored = localStorage.getItem('progress:user-123');
      expect(stored).not.toBeNull();

      // Should not be in default user's storage
      const defaultStored = localStorage.getItem(`progress:${DEFAULT_USER_ID}`);
      expect(defaultStored).toBeNull();
    });

    it('overwrites existing progress', async () => {
      const progress1 = createStoredProgress('lesson-1', 0, [], 0);
      const progress2 = createStoredProgress('lesson-4', 3, ['ex-a', 'ex-b'], 2);

      await saveProgress(progress1);
      await saveProgress(progress2);

      const loaded = await loadProgress();
      expect(loaded?.lessonId).toBe('lesson-4');
      expect(loaded?.lessonIndex).toBe(3);
    });
  });

  describe('loadProgress', () => {
    it('returns null when no progress saved', async () => {
      const result = await loadProgress();
      expect(result).toBeNull();
    });

    it('loads saved progress', async () => {
      const progress = createStoredProgress('lesson-5', 4, ['ex-1', 'ex-2', 'ex-3'], 3);
      await saveProgress(progress);

      const loaded = await loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded!.lessonId).toBe('lesson-5');
      expect(loaded!.lessonIndex).toBe(4);
      expect(loaded!.completedExercises).toEqual(['ex-1', 'ex-2', 'ex-3']);
      expect(loaded!.currentExerciseIndex).toBe(3);
    });

    it('loads progress for specific userId', async () => {
      const progress = createStoredProgress('lesson-2', 1, [], 0);
      await saveProgress(progress, 'custom-user');

      // Default user should have no progress
      const defaultLoaded = await loadProgress();
      expect(defaultLoaded).toBeNull();

      // Custom user should have progress
      const customLoaded = await loadProgress('custom-user');
      expect(customLoaded).not.toBeNull();
      expect(customLoaded!.lessonId).toBe('lesson-2');
    });

    it('returns null for corrupted localStorage data', async () => {
      localStorage.setItem(`progress:${DEFAULT_USER_ID}`, 'not valid json');

      const loaded = await loadProgress();
      expect(loaded).toBeNull();
    });

    it('returns null for invalid progress structure', async () => {
      localStorage.setItem(`progress:${DEFAULT_USER_ID}`, JSON.stringify({ incomplete: true }));

      const loaded = await loadProgress();
      expect(loaded).toBeNull();
    });
  });

  describe('clearProgress', () => {
    it('removes progress from localStorage', async () => {
      const progress = createStoredProgress('lesson-3', 2, [], 0);
      await saveProgress(progress);

      // Verify saved
      expect(await loadProgress()).not.toBeNull();

      await clearProgress();

      expect(await loadProgress()).toBeNull();
    });

    it('clears progress for specific userId', async () => {
      const progress1 = createStoredProgress('lesson-1', 0, [], 0);
      const progress2 = createStoredProgress('lesson-2', 1, [], 0);

      await saveProgress(progress1, 'user-a');
      await saveProgress(progress2, 'user-b');

      await clearProgress('user-a');

      // user-a cleared
      expect(await loadProgress('user-a')).toBeNull();
      // user-b intact
      expect(await loadProgress('user-b')).not.toBeNull();
    });

    it('does nothing when no progress exists', async () => {
      // Should not throw
      await expect(clearProgress()).resolves.toBeUndefined();
    });
  });

  describe('setStorageAdapter', () => {
    it('switches to custom adapter', async () => {
      const savedCalls: Array<{ userId: string; progress: StoredProgress }> = [];
      let storedProgress: StoredProgress | null = null;

      const mockAdapter: StorageAdapter = {
        async save(userId, progress) {
          savedCalls.push({ userId, progress });
          storedProgress = progress;
        },
        async load() {
          return storedProgress;
        },
        async clear() {
          storedProgress = null;
        },
      };

      setStorageAdapter(mockAdapter);

      const progress = createStoredProgress('lesson-1', 0, [], 0);
      await saveProgress(progress);

      expect(savedCalls.length).toBe(1);
      expect(savedCalls[0].userId).toBe(DEFAULT_USER_ID);

      // Load should use mock adapter
      const loaded = await loadProgress();
      expect(loaded).not.toBeNull();
      expect(loaded!.lessonId).toBe('lesson-1');

      // localStorage should NOT be used
      const lsValue = localStorage.getItem(`progress:${DEFAULT_USER_ID}`);
      expect(lsValue).toBeNull();
    });

    it('uses new adapter after switch', async () => {
      // Save with default localStorage adapter
      const progress1 = createStoredProgress('lesson-1', 0, [], 0);
      await saveProgress(progress1);

      // Switch to in-memory adapter
      let memoryStore: StoredProgress | null = null;
      const inMemoryAdapter: StorageAdapter = {
        async save(_userId, progress) {
          memoryStore = progress;
        },
        async load() {
          return memoryStore;
        },
        async clear() {
          memoryStore = null;
        },
      };

      setStorageAdapter(inMemoryAdapter);

      // Save new progress - should go to memory, not localStorage
      const progress2 = createStoredProgress('lesson-2', 1, [], 0);
      await saveProgress(progress2);

      // Load from new adapter
      const loaded = await loadProgress();
      expect(loaded!.lessonId).toBe('lesson-2');

      // localStorage still has old progress (adapter was switched)
      const lsValue = JSON.parse(localStorage.getItem(`progress:${DEFAULT_USER_ID}`)!);
      expect(lsValue.lessonId).toBe('lesson-1');
    });
  });

  describe('default adapter initialization', () => {
    it('uses localStorage adapter by default', async () => {
      // First call should auto-initialize localStorage adapter
      const progress = createStoredProgress('lesson-1', 0, [], 0);
      await saveProgress(progress);

      // Verify it went to localStorage
      const stored = localStorage.getItem(`progress:${DEFAULT_USER_ID}`);
      expect(stored).not.toBeNull();
    });
  });

  describe('round-trip operations', () => {
    it('save then load returns equivalent progress', async () => {
      const original = createStoredProgress('lesson-6', 5, ['a', 'b', 'c'], 2);
      await saveProgress(original);

      const loaded = await loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded!.lessonId).toBe(original.lessonId);
      expect(loaded!.lessonIndex).toBe(original.lessonIndex);
      expect(loaded!.completedExercises).toEqual(original.completedExercises);
      expect(loaded!.currentExerciseIndex).toBe(original.currentExerciseIndex);
      // lastUpdated may differ slightly due to serialization timing
      expect(loaded!.lastUpdated).toBe(original.lastUpdated);
    });

    it('multiple users can have independent progress', async () => {
      const progress1 = createStoredProgress('lesson-1', 0, [], 0);
      const progress2 = createStoredProgress('lesson-3', 2, ['ex-1'], 1);
      const progress3 = createStoredProgress('lesson-5', 4, ['ex-a', 'ex-b'], 2);

      await saveProgress(progress1, 'alice');
      await saveProgress(progress2, 'bob');
      await saveProgress(progress3, 'charlie');

      expect((await loadProgress('alice'))!.lessonId).toBe('lesson-1');
      expect((await loadProgress('bob'))!.lessonId).toBe('lesson-3');
      expect((await loadProgress('charlie'))!.lessonId).toBe('lesson-5');
    });
  });
});
