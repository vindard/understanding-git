import { describe, it, expect, vi } from 'vitest';
import type { CompletionContext } from '../types';

// Mock fs to prevent indexedDB errors
vi.mock('../../fs', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
}));

import { FilePathCompleter } from './file-path-completer';

function createContext(overrides: Partial<CompletionContext>): CompletionContext {
  return {
    line: '',
    lineUpToCursor: '',
    cursorPos: 0,
    parts: [],
    cmd: '',
    endsWithSpace: false,
    ...overrides,
  };
}

describe('FilePathCompleter', () => {
  const completer = new FilePathCompleter();

  describe('canHandle', () => {
    it('returns true for ls command', () => {
      const context = createContext({ cmd: 'ls', parts: ['ls', ''] });
      expect(completer.canHandle(context)).toBe(true);
    });

    it('returns true for cat command', () => {
      const context = createContext({ cmd: 'cat', parts: ['cat', ''] });
      expect(completer.canHandle(context)).toBe(true);
    });

    it('returns true for mkdir command', () => {
      const context = createContext({ cmd: 'mkdir', parts: ['mkdir', ''] });
      expect(completer.canHandle(context)).toBe(true);
    });

    it('returns true for touch command', () => {
      const context = createContext({ cmd: 'touch', parts: ['touch', ''] });
      expect(completer.canHandle(context)).toBe(true);
    });

    it('returns true for rm command', () => {
      const context = createContext({ cmd: 'rm', parts: ['rm', ''] });
      expect(completer.canHandle(context)).toBe(true);
    });

    it('returns true for git add', () => {
      const context = createContext({ cmd: 'git', parts: ['git', 'add', ''] });
      expect(completer.canHandle(context)).toBe(true);
    });

    it('returns false for git commit', () => {
      const context = createContext({ cmd: 'git', parts: ['git', 'commit', ''] });
      expect(completer.canHandle(context)).toBe(false);
    });

    it('returns false for unknown command', () => {
      const context = createContext({ cmd: 'echo', parts: ['echo', ''] });
      expect(completer.canHandle(context)).toBe(false);
    });
  });
});
