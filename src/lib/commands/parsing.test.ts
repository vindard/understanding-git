/**
 * Unit tests for pure parsing functions.
 * These test calculations and local logic only - no I/O, no mocks.
 */
import { describe, it, expect } from 'vitest';
import { parseCommandLine, extractRedirection } from './index';
import { resolvePath } from './file-commands';
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
