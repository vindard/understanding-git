/**
 * Unit tests for pure parsing functions.
 * These test calculations and local logic only - no I/O, no mocks.
 */
import { describe, it, expect } from 'vitest';
import { parseCommandLine, extractRedirection } from './index';
import {
  resolvePath,
  parseHeadTailArgs,
  getFirstNLines,
  getLastNLines,
  parseRmArgs,
} from './file-commands';
import { CWD } from '../config';

describe('parseCommandLine', () => {
  it('parses simple command', () => {
    expect(parseCommandLine('git status')).toEqual(['git', 'status']);
  });

  it('parses command with multiple arguments', () => {
    expect(parseCommandLine('git commit -m message')).toEqual([
      'git',
      'commit',
      '-m',
      'message',
    ]);
  });

  it('handles double-quoted strings', () => {
    expect(parseCommandLine('echo "hello world"')).toEqual([
      'echo',
      'hello world',
    ]);
  });

  it('handles single-quoted strings', () => {
    expect(parseCommandLine("echo 'hello world'")).toEqual([
      'echo',
      'hello world',
    ]);
  });

  it('handles quoted string with special characters', () => {
    expect(parseCommandLine('git commit -m "Add feature: foo"')).toEqual([
      'git',
      'commit',
      '-m',
      'Add feature: foo',
    ]);
  });

  it('handles multiple spaces between arguments', () => {
    expect(parseCommandLine('git   status')).toEqual(['git', 'status']);
  });

  it('handles empty input', () => {
    expect(parseCommandLine('')).toEqual([]);
  });

  it('handles whitespace-only input', () => {
    expect(parseCommandLine('   ')).toEqual([]);
  });

  it('treats tabs as non-whitespace (only splits on spaces)', () => {
    // Note: parseCommandLine only splits on spaces, tabs are treated as part of tokens
    expect(parseCommandLine('  \t  ')).toEqual(['\t']);
  });

  it('handles single command with no arguments', () => {
    expect(parseCommandLine('pwd')).toEqual(['pwd']);
  });

  it('handles redirection operators as separate tokens', () => {
    expect(parseCommandLine('echo hello > file.txt')).toEqual([
      'echo',
      'hello',
      '>',
      'file.txt',
    ]);
  });

  it('handles append redirection', () => {
    expect(parseCommandLine('echo hello >> file.txt')).toEqual([
      'echo',
      'hello',
      '>>',
      'file.txt',
    ]);
  });
});

describe('extractRedirection', () => {
  it('extracts overwrite redirection', () => {
    const result = extractRedirection(['echo', 'hello', '>', 'file.txt']);
    expect(result).toEqual({
      parts: ['echo', 'hello'],
      outputFile: 'file.txt',
      append: false,
    });
  });

  it('extracts append redirection', () => {
    const result = extractRedirection(['echo', 'hello', '>>', 'file.txt']);
    expect(result).toEqual({
      parts: ['echo', 'hello'],
      outputFile: 'file.txt',
      append: true,
    });
  });

  it('returns original parts when no redirection', () => {
    const result = extractRedirection(['git', 'status']);
    expect(result).toEqual({
      parts: ['git', 'status'],
      outputFile: null,
      append: false,
    });
  });

  it('handles redirection at start of args', () => {
    const result = extractRedirection(['>', 'file.txt']);
    expect(result).toEqual({
      parts: [],
      outputFile: 'file.txt',
      append: false,
    });
  });

  it('handles missing output file', () => {
    const result = extractRedirection(['echo', 'hello', '>']);
    expect(result).toEqual({
      parts: ['echo', 'hello'],
      outputFile: null,
      append: false,
    });
  });

  it('prefers append over overwrite when both present', () => {
    // >> comes first in the check, so it takes precedence
    const result = extractRedirection(['echo', '>>', 'a.txt', '>', 'b.txt']);
    expect(result).toEqual({
      parts: ['echo'],
      outputFile: 'a.txt',
      append: true,
    });
  });
});

describe('resolvePath', () => {
  it('returns absolute path unchanged', () => {
    expect(resolvePath('/absolute/path')).toBe('/absolute/path');
  });

  it('prepends CWD to relative path', () => {
    expect(resolvePath('README.md')).toBe(`${CWD}/README.md`);
  });

  it('prepends CWD to nested relative path', () => {
    expect(resolvePath('src/lib/file.ts')).toBe(`${CWD}/src/lib/file.ts`);
  });

  it('handles path starting with dot', () => {
    expect(resolvePath('./file.txt')).toBe(`${CWD}/./file.txt`);
  });
});

describe('parseHeadTailArgs', () => {
  it('returns default 10 lines when no -n option', () => {
    const result = parseHeadTailArgs(['file.txt']);
    expect(result).toEqual({ numLines: 10, filePath: 'file.txt' });
  });

  it('parses -n option', () => {
    const result = parseHeadTailArgs(['-n', '5', 'file.txt']);
    expect(result).toEqual({ numLines: 5, filePath: 'file.txt' });
  });

  it('handles -n option after file', () => {
    const result = parseHeadTailArgs(['file.txt', '-n', '3']);
    expect(result).toEqual({ numLines: 3, filePath: 'file.txt' });
  });

  it('returns undefined filePath when no file specified', () => {
    const result = parseHeadTailArgs(['-n', '5']);
    expect(result).toEqual({ numLines: 5, filePath: undefined });
  });

  it('returns undefined filePath for empty args', () => {
    const result = parseHeadTailArgs([]);
    expect(result).toEqual({ numLines: 10, filePath: undefined });
  });

  it('ignores unknown flags', () => {
    const result = parseHeadTailArgs(['-x', 'file.txt']);
    expect(result).toEqual({ numLines: 10, filePath: 'file.txt' });
  });
});

describe('getFirstNLines', () => {
  it('returns first N lines', () => {
    const content = 'line1\nline2\nline3\nline4\nline5';
    expect(getFirstNLines(content, 3)).toBe('line1\nline2\nline3');
  });

  it('returns all lines if fewer than N', () => {
    const content = 'line1\nline2';
    expect(getFirstNLines(content, 10)).toBe('line1\nline2');
  });

  it('handles empty content', () => {
    expect(getFirstNLines('', 5)).toBe('');
  });

  it('handles single line', () => {
    expect(getFirstNLines('only line', 5)).toBe('only line');
  });

  it('handles N=0', () => {
    expect(getFirstNLines('line1\nline2', 0)).toBe('');
  });
});

describe('getLastNLines', () => {
  it('returns last N lines', () => {
    const content = 'line1\nline2\nline3\nline4\nline5';
    expect(getLastNLines(content, 3)).toBe('line3\nline4\nline5');
  });

  it('returns all lines if fewer than N', () => {
    const content = 'line1\nline2';
    expect(getLastNLines(content, 10)).toBe('line1\nline2');
  });

  it('handles empty content', () => {
    expect(getLastNLines('', 5)).toBe('');
  });

  it('handles single line', () => {
    expect(getLastNLines('only line', 5)).toBe('only line');
  });

  it('handles N=0', () => {
    // slice(-0) returns entire array, which may be unexpected
    // but this matches current implementation behavior
    expect(getLastNLines('line1\nline2', 0)).toBe('line1\nline2');
  });
});

describe('parseRmArgs', () => {
  it('parses without recursive flag', () => {
    const result = parseRmArgs(['file.txt']);
    expect(result).toEqual({ recursive: false, targets: ['file.txt'] });
  });

  it('parses with -r flag', () => {
    const result = parseRmArgs(['-r', 'dir']);
    expect(result).toEqual({ recursive: true, targets: ['dir'] });
  });

  it('parses with -rf flag', () => {
    const result = parseRmArgs(['-rf', 'dir']);
    expect(result).toEqual({ recursive: true, targets: ['dir'] });
  });

  it('handles multiple targets without flag', () => {
    const result = parseRmArgs(['file1.txt', 'file2.txt']);
    expect(result).toEqual({ recursive: false, targets: ['file1.txt', 'file2.txt'] });
  });

  it('handles multiple targets with flag', () => {
    const result = parseRmArgs(['-r', 'dir1', 'dir2']);
    expect(result).toEqual({ recursive: true, targets: ['dir1', 'dir2'] });
  });

  it('returns empty targets for empty args', () => {
    const result = parseRmArgs([]);
    expect(result).toEqual({ recursive: false, targets: [] });
  });
});
