/**
 * Unit tests for setup-scripts.ts
 *
 * Tests pure functions that define lesson setup command sequences.
 */
import { describe, it, expect } from 'vitest';
import {
  LESSON_SETUP_SCRIPTS,
  getSetupScript,
  isValidLessonId,
  getAllLessonIds,
} from './setup-scripts';

describe('setup-scripts', () => {
  describe('LESSON_SETUP_SCRIPTS', () => {
    it('defines scripts for all 6 lessons', () => {
      expect(Object.keys(LESSON_SETUP_SCRIPTS)).toHaveLength(6);
    });

    it('lesson-1 has empty script (starts fresh)', () => {
      expect(LESSON_SETUP_SCRIPTS['lesson-1']).toEqual([]);
    });

    it('lesson-2 starts with git init', () => {
      expect(LESSON_SETUP_SCRIPTS['lesson-2']).toEqual(['git init']);
    });

    it('lesson-3 starts with repo and staged file', () => {
      expect(LESSON_SETUP_SCRIPTS['lesson-3']).toEqual([
        'git init',
        'touch README.md',
        'git add README.md',
      ]);
    });

    it('lesson-4 starts with first commit', () => {
      expect(LESSON_SETUP_SCRIPTS['lesson-4']).toEqual([
        'git init',
        'touch README.md',
        'git add README.md',
        'git commit -m "Initial commit"',
      ]);
    });

    it('lesson-5 starts with two commits', () => {
      expect(LESSON_SETUP_SCRIPTS['lesson-5']).toEqual([
        'git init',
        'touch README.md',
        'git add README.md',
        'git commit -m "Initial commit"',
        'echo "# My Project" > README.md',
        'git add README.md',
        'git commit -m "Update README with title"',
      ]);
    });

    it('lesson-6 starts with three commits and files', () => {
      expect(LESSON_SETUP_SCRIPTS['lesson-6']).toEqual([
        'git init',
        'touch README.md',
        'git add README.md',
        'git commit -m "Initial commit"',
        'echo "# My Project" > README.md',
        'git add README.md',
        'git commit -m "Update README with title"',
        'touch index.html style.css',
        'git add .',
        'git commit -m "Add HTML and CSS files"',
      ]);
    });

    it('each lesson builds on the previous one', () => {
      // lesson-2 contains lesson-1 commands + more
      const l1 = LESSON_SETUP_SCRIPTS['lesson-1'];
      const l2 = LESSON_SETUP_SCRIPTS['lesson-2'];
      expect(l2.slice(0, l1.length)).toEqual(l1);

      // lesson-3 contains lesson-2 commands + more
      const l3 = LESSON_SETUP_SCRIPTS['lesson-3'];
      expect(l3.slice(0, l2.length)).toEqual(l2);

      // lesson-4 contains lesson-3 commands + more
      const l4 = LESSON_SETUP_SCRIPTS['lesson-4'];
      expect(l4.slice(0, l3.length)).toEqual(l3);

      // lesson-5 contains lesson-4 commands + more
      const l5 = LESSON_SETUP_SCRIPTS['lesson-5'];
      expect(l5.slice(0, l4.length)).toEqual(l4);

      // lesson-6 contains lesson-5 commands + more
      const l6 = LESSON_SETUP_SCRIPTS['lesson-6'];
      expect(l6.slice(0, l5.length)).toEqual(l5);
    });
  });

  describe('getSetupScript', () => {
    it('returns empty array for lesson-1', () => {
      expect(getSetupScript('lesson-1')).toEqual([]);
    });

    it('returns correct script for lesson-4', () => {
      const script = getSetupScript('lesson-4');
      expect(script).toHaveLength(4);
      expect(script[0]).toBe('git init');
      expect(script[3]).toBe('git commit -m "Initial commit"');
    });

    it('returns empty array for invalid lesson id', () => {
      expect(getSetupScript('lesson-99')).toEqual([]);
      expect(getSetupScript('invalid')).toEqual([]);
      expect(getSetupScript('')).toEqual([]);
    });

    it('returns a copy, not the original array', () => {
      const script1 = getSetupScript('lesson-3');
      const script2 = getSetupScript('lesson-3');
      expect(script1).toEqual(script2);
      expect(script1).not.toBe(script2);
    });
  });

  describe('isValidLessonId', () => {
    it('returns true for valid lesson ids', () => {
      expect(isValidLessonId('lesson-1')).toBe(true);
      expect(isValidLessonId('lesson-2')).toBe(true);
      expect(isValidLessonId('lesson-3')).toBe(true);
      expect(isValidLessonId('lesson-4')).toBe(true);
      expect(isValidLessonId('lesson-5')).toBe(true);
      expect(isValidLessonId('lesson-6')).toBe(true);
    });

    it('returns false for invalid lesson ids', () => {
      expect(isValidLessonId('lesson-0')).toBe(false);
      expect(isValidLessonId('lesson-7')).toBe(false);
      expect(isValidLessonId('invalid')).toBe(false);
      expect(isValidLessonId('')).toBe(false);
    });
  });

  describe('getAllLessonIds', () => {
    it('returns all lesson ids in order', () => {
      expect(getAllLessonIds()).toEqual([
        'lesson-1',
        'lesson-2',
        'lesson-3',
        'lesson-4',
        'lesson-5',
        'lesson-6',
      ]);
    });

    it('returns a copy, not the original array', () => {
      const ids1 = getAllLessonIds();
      const ids2 = getAllLessonIds();
      expect(ids1).toEqual(ids2);
      expect(ids1).not.toBe(ids2);
    });
  });
});
