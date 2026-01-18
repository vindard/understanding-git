import { describe, it, expect, vi } from 'vitest';
import type { CompletionContext } from '../types';

// Mock fs to prevent indexedDB errors
vi.mock('../../fs', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
}));

import * as fsLib from '../../fs';
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

  describe('complete', () => {
    it('excludes .git directory for git add', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['.git', 'README.md', 'src']);
      vi.mocked(fsLib.stat).mockImplementation(async (path) => {
        if (path.includes('.git') || path.includes('src')) return { type: 'dir' };
        return { type: 'file' };
      });

      const context = createContext({
        line: 'git add ',
        lineUpToCursor: 'git add ',
        cursorPos: 8,
        cmd: 'git',
        parts: ['git', 'add', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);

      expect(result.suggestions).not.toContain('.git/');
      expect(result.suggestions).toContain('README.md');
      expect(result.suggestions).toContain('src/');
    });

    it('excludes files already in command for git add', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['README.md', 'index.js', 'style.css']);
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });

      const context = createContext({
        line: 'git add README.md ',
        lineUpToCursor: 'git add README.md ',
        cursorPos: 18,
        cmd: 'git',
        parts: ['git', 'add', 'README.md', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);

      expect(result.suggestions).not.toContain('README.md');
      expect(result.suggestions).toContain('index.js');
      expect(result.suggestions).toContain('style.css');
    });

    it('excludes files already in command for other commands', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['file1.txt', 'file2.txt', 'file3.txt']);
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });

      const context = createContext({
        line: 'rm file1.txt ',
        lineUpToCursor: 'rm file1.txt ',
        cursorPos: 13,
        cmd: 'rm',
        parts: ['rm', 'file1.txt', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);

      expect(result.suggestions).not.toContain('file1.txt');
      expect(result.suggestions).toContain('file2.txt');
      expect(result.suggestions).toContain('file3.txt');
    });

    it('returns empty when all files already added', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['README.md']);
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });

      const context = createContext({
        line: 'git add README.md ',
        lineUpToCursor: 'git add README.md ',
        cursorPos: 18,
        cmd: 'git',
        parts: ['git', 'add', 'README.md', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);

      expect(result.suggestions).toEqual([]);
    });
  });
});
