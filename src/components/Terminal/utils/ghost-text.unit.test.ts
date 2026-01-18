import { describe, it, expect } from 'vitest';
import { computeGhostText } from './ghost-text';

describe('computeGhostText', () => {
  it('returns remaining part of suggestion after typed text', () => {
    // User typed "gi", suggestion is "git", replaceFrom is 0
    const result = computeGhostText('gi', 2, 'git', 0);
    expect(result).toBe('t');
  });

  it('returns ghost text for single character command', () => {
    // User typed "g", suggestion is "git", replaceFrom is 0
    const result = computeGhostText('g', 1, 'git', 0);
    expect(result).toBe('it');
  });

  it('returns full suggestion when nothing typed yet', () => {
    // User typed "git " (space), suggestion is "init", replaceFrom is 4
    const result = computeGhostText('git ', 4, 'init', 4);
    expect(result).toBe('init');
  });

  it('returns remaining part for partial match', () => {
    // User typed "git ini", suggestion is "init", replaceFrom is 4
    const result = computeGhostText('git ini', 7, 'init', 4);
    expect(result).toBe('t');
  });

  it('returns empty string when suggestion does not match', () => {
    // User typed "xyz", suggestion is "abc"
    const result = computeGhostText('xyz', 3, 'abc', 0);
    expect(result).toBe('');
  });

  it('handles file path completion', () => {
    // User typed "cat READ", suggestion is "README.md", replaceFrom is 4
    const result = computeGhostText('cat READ', 8, 'README.md', 4);
    expect(result).toBe('ME.md');
  });

  it('handles nested path completion', () => {
    // User typed "cat src/i", suggestion is "src/index.ts", replaceFrom is 4
    const result = computeGhostText('cat src/i', 9, 'src/index.ts', 4);
    expect(result).toBe('ndex.ts');
  });

  it('returns empty when cursor is not at end of current text being typed', () => {
    // User typed "git" but cursor is at position 2 (between g and t)
    // This is an edge case - typically ghost text is at end
    const result = computeGhostText('git', 2, 'git', 0);
    expect(result).toBe('t');
  });
});
