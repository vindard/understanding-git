import { describe, it, expect } from 'vitest';
import { getShortcutHint, shouldShowHint, shouldPrioritizeAdvanceHint } from './shortcut-hint';

describe('shortcut-hint', () => {
  describe('getShortcutHint', () => {
    it('returns Mac shortcut hint when isMac is true', () => {
      const hint = getShortcutHint(true);
      expect(hint).toBe("'⌘ + Enter' for next lesson");
    });

    it('returns Windows/Linux shortcut hint when isMac is false', () => {
      const hint = getShortcutHint(false);
      expect(hint).toBe("'Ctrl + Enter' for next lesson");
    });
  });

  describe('shouldShowHint', () => {
    it('returns true when line is empty, can advance, and hint not visible', () => {
      expect(shouldShowHint('', true, false)).toBe(true);
    });

    it('returns false when line is not empty', () => {
      expect(shouldShowHint('git', true, false)).toBe(false);
    });

    it('returns false when cannot advance lesson', () => {
      expect(shouldShowHint('', false, false)).toBe(false);
    });

    it('returns false when hint is already visible', () => {
      expect(shouldShowHint('', true, true)).toBe(false);
    });

    it('returns false when line has content even with single character', () => {
      expect(shouldShowHint('a', true, false)).toBe(false);
    });

    it('returns false when all conditions are negative', () => {
      expect(shouldShowHint('git status', false, true)).toBe(false);
    });
  });

  describe('shouldPrioritizeAdvanceHint', () => {
    it('returns true when line is empty and can advance lesson', () => {
      // This ensures the advance hint is shown instead of ghost text at lesson end
      expect(shouldPrioritizeAdvanceHint('', true)).toBe(true);
    });

    it('returns false when line is not empty even if can advance', () => {
      // Ghost text should be shown when user is typing
      expect(shouldPrioritizeAdvanceHint('git', true)).toBe(false);
    });

    it('returns false when cannot advance lesson', () => {
      // Ghost text should be shown during normal lesson progress
      expect(shouldPrioritizeAdvanceHint('', false)).toBe(false);
    });

    it('returns false when line has content and cannot advance', () => {
      expect(shouldPrioritizeAdvanceHint('git status', false)).toBe(false);
    });
  });
});
