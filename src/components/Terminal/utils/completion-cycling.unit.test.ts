/**
 * Unit tests for completion cycling utilities.
 * Tests the pure function for cycling through autocomplete suggestions.
 */

import { describe, it, expect } from 'vitest';
import { cycleIndex } from './completion-cycling';

describe('cycleIndex', () => {
  describe('forward cycling (Tab)', () => {
    it('moves from first to second item', () => {
      expect(cycleIndex(0, 5, 'forward')).toBe(1);
    });

    it('moves from middle to next item', () => {
      expect(cycleIndex(2, 5, 'forward')).toBe(3);
    });

    it('wraps from last item to first', () => {
      expect(cycleIndex(4, 5, 'forward')).toBe(0);
    });

    it('works with single item (stays at 0)', () => {
      expect(cycleIndex(0, 1, 'forward')).toBe(0);
    });

    it('works with two items', () => {
      expect(cycleIndex(0, 2, 'forward')).toBe(1);
      expect(cycleIndex(1, 2, 'forward')).toBe(0);
    });
  });

  describe('backward cycling (Shift+Tab)', () => {
    it('moves from second to first item', () => {
      expect(cycleIndex(1, 5, 'backward')).toBe(0);
    });

    it('moves from middle to previous item', () => {
      expect(cycleIndex(3, 5, 'backward')).toBe(2);
    });

    it('wraps from first item to last', () => {
      expect(cycleIndex(0, 5, 'backward')).toBe(4);
    });

    it('works with single item (stays at 0)', () => {
      expect(cycleIndex(0, 1, 'backward')).toBe(0);
    });

    it('works with two items', () => {
      expect(cycleIndex(0, 2, 'backward')).toBe(1);
      expect(cycleIndex(1, 2, 'backward')).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('handles large lists', () => {
      expect(cycleIndex(99, 100, 'forward')).toBe(0);
      expect(cycleIndex(0, 100, 'backward')).toBe(99);
    });
  });
});
