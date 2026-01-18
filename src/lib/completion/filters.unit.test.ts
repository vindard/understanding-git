import { describe, it, expect } from 'vitest';
import {
  filterByPrefix,
  filterHidden,
  excludeGitDir,
  excludeAlreadyAdded,
  formatAsFileOrDir,
  addPathPrefix,
  parsePartialPath,
  getPathPrefix,
  calculateReplaceFrom,
  shouldCompleteFilePath,
  shouldCompleteBranch,
  shouldCompleteGitSubcommand,
  shouldCompleteCommand,
  shouldHideHidden,
  isGitAdd,
  getExistingArgs,
} from './filters';

describe('Completion Filters', () => {
  describe('filterByPrefix', () => {
    it('filters entries that start with prefix', () => {
      const entries = ['README.md', 'README.txt', 'index.js'];
      expect(filterByPrefix(entries, 'README')).toEqual(['README.md', 'README.txt']);
    });

    it('returns all entries for empty prefix', () => {
      const entries = ['a.txt', 'b.txt'];
      expect(filterByPrefix(entries, '')).toEqual(['a.txt', 'b.txt']);
    });

    it('returns empty array when no matches', () => {
      const entries = ['a.txt', 'b.txt'];
      expect(filterByPrefix(entries, 'xyz')).toEqual([]);
    });

    it('is case-sensitive', () => {
      const entries = ['README.md', 'readme.txt'];
      expect(filterByPrefix(entries, 'README')).toEqual(['README.md']);
    });
  });

  describe('filterHidden', () => {
    it('removes hidden files when hideHidden is true', () => {
      const entries = ['file.txt', '.gitignore', '.env', 'src'];
      expect(filterHidden(entries, true)).toEqual(['file.txt', 'src']);
    });

    it('keeps all files when hideHidden is false', () => {
      const entries = ['file.txt', '.gitignore'];
      expect(filterHidden(entries, false)).toEqual(['file.txt', '.gitignore']);
    });
  });

  describe('excludeGitDir', () => {
    it('removes .git/ from suggestions', () => {
      const suggestions = ['README.md', '.git/', 'src/'];
      expect(excludeGitDir(suggestions)).toEqual(['README.md', 'src/']);
    });

    it('removes paths starting with .git/', () => {
      const suggestions = ['README.md', '.git/HEAD', '.git/config'];
      expect(excludeGitDir(suggestions)).toEqual(['README.md']);
    });

    it('keeps .gitignore', () => {
      const suggestions = ['.git/', '.gitignore'];
      expect(excludeGitDir(suggestions)).toEqual(['.gitignore']);
    });
  });

  describe('excludeAlreadyAdded', () => {
    it('removes files already in command', () => {
      const suggestions = ['file1.txt', 'file2.txt', 'file3.txt'];
      const existing = ['file1.txt'];
      expect(excludeAlreadyAdded(suggestions, existing)).toEqual(['file2.txt', 'file3.txt']);
    });

    it('handles directories with trailing slash', () => {
      const suggestions = ['src/', 'lib/'];
      const existing = ['src'];
      expect(excludeAlreadyAdded(suggestions, existing)).toEqual(['lib/']);
    });

    it('returns all when nothing already added', () => {
      const suggestions = ['a.txt', 'b.txt'];
      expect(excludeAlreadyAdded(suggestions, [])).toEqual(['a.txt', 'b.txt']);
    });
  });

  describe('formatAsFileOrDir', () => {
    it('adds trailing slash for directories', () => {
      expect(formatAsFileOrDir('src', true)).toBe('src/');
    });

    it('keeps files unchanged', () => {
      expect(formatAsFileOrDir('file.txt', false)).toBe('file.txt');
    });
  });

  describe('addPathPrefix', () => {
    it('prepends path prefix to all suggestions', () => {
      const suggestions = ['index.ts', 'utils.ts'];
      expect(addPathPrefix(suggestions, 'src/')).toEqual(['src/index.ts', 'src/utils.ts']);
    });

    it('returns unchanged for empty prefix', () => {
      const suggestions = ['a.txt', 'b.txt'];
      expect(addPathPrefix(suggestions, '')).toEqual(['a.txt', 'b.txt']);
    });
  });

  describe('parsePartialPath', () => {
    it('parses simple filename', () => {
      expect(parsePartialPath('README')).toEqual({
        dirPart: '',
        prefix: 'README',
        hasPath: false,
      });
    });

    it('parses path with directory', () => {
      expect(parsePartialPath('src/index')).toEqual({
        dirPart: 'src',
        prefix: 'index',
        hasPath: true,
      });
    });

    it('parses path ending with slash', () => {
      expect(parsePartialPath('src/')).toEqual({
        dirPart: 'src',
        prefix: '',
        hasPath: true,
      });
    });

    it('parses nested path', () => {
      expect(parsePartialPath('src/lib/utils')).toEqual({
        dirPart: 'src/lib',
        prefix: 'utils',
        hasPath: true,
      });
    });

    it('handles root path', () => {
      expect(parsePartialPath('/file')).toEqual({
        dirPart: '/',
        prefix: 'file',
        hasPath: true,
      });
    });
  });

  describe('getPathPrefix', () => {
    it('returns empty for simple filename', () => {
      expect(getPathPrefix('README')).toBe('');
    });

    it('returns directory prefix for path', () => {
      expect(getPathPrefix('src/index')).toBe('src/');
    });

    it('returns full path for nested', () => {
      expect(getPathPrefix('src/lib/utils')).toBe('src/lib/');
    });
  });

  describe('calculateReplaceFrom', () => {
    it('returns cursor position when ends with space', () => {
      expect(calculateReplaceFrom(true, 10, 'git add ', '')).toBe(10);
    });

    it('finds position of partial in line', () => {
      expect(calculateReplaceFrom(false, 8, 'cat READ', 'READ')).toBe(4);
    });
  });

  describe('shouldCompleteFilePath', () => {
    it('returns true for ls', () => {
      expect(shouldCompleteFilePath('ls', ['ls', ''])).toBe(true);
    });

    it('returns true for cat', () => {
      expect(shouldCompleteFilePath('cat', ['cat', ''])).toBe(true);
    });

    it('returns true for touch', () => {
      expect(shouldCompleteFilePath('touch', ['touch', ''])).toBe(true);
    });

    it('returns true for git add', () => {
      expect(shouldCompleteFilePath('git', ['git', 'add', ''])).toBe(true);
    });

    it('returns false for git commit', () => {
      expect(shouldCompleteFilePath('git', ['git', 'commit', ''])).toBe(false);
    });

    it('returns false for echo', () => {
      expect(shouldCompleteFilePath('echo', ['echo', ''])).toBe(false);
    });
  });

  describe('shouldCompleteBranch', () => {
    it('returns true for git checkout', () => {
      expect(shouldCompleteBranch('git', ['git', 'checkout', ''])).toBe(true);
    });

    it('returns false for git add', () => {
      expect(shouldCompleteBranch('git', ['git', 'add', ''])).toBe(false);
    });

    it('returns false for non-git commands', () => {
      expect(shouldCompleteBranch('ls', ['ls', ''])).toBe(false);
    });
  });

  describe('shouldCompleteGitSubcommand', () => {
    it('returns true for "git " with space', () => {
      expect(shouldCompleteGitSubcommand('git', ['git', ''], true)).toBe(true);
    });

    it('returns true for "git co" partial', () => {
      expect(shouldCompleteGitSubcommand('git', ['git', 'co'], false)).toBe(true);
    });

    it('returns false for non-git command', () => {
      expect(shouldCompleteGitSubcommand('ls', ['ls', ''], true)).toBe(false);
    });

    it('returns false when already have subcommand', () => {
      expect(shouldCompleteGitSubcommand('git', ['git', 'add', ''], true)).toBe(false);
    });
  });

  describe('shouldCompleteCommand', () => {
    it('returns true for empty parts', () => {
      expect(shouldCompleteCommand([], false)).toBe(true);
    });

    it('returns true for partial command', () => {
      expect(shouldCompleteCommand(['gi'], false)).toBe(true);
    });

    it('returns false after space', () => {
      expect(shouldCompleteCommand(['git'], true)).toBe(false);
    });

    it('returns false for multiple parts', () => {
      expect(shouldCompleteCommand(['git', 'add'], false)).toBe(false);
    });
  });

  describe('shouldHideHidden', () => {
    it('returns true for touch', () => {
      expect(shouldHideHidden('touch')).toBe(true);
    });

    it('returns false for other commands', () => {
      expect(shouldHideHidden('ls')).toBe(false);
      expect(shouldHideHidden('cat')).toBe(false);
      expect(shouldHideHidden('rm')).toBe(false);
    });
  });

  describe('isGitAdd', () => {
    it('returns true for git add', () => {
      expect(isGitAdd('git', ['git', 'add'])).toBe(true);
    });

    it('returns false for git commit', () => {
      expect(isGitAdd('git', ['git', 'commit'])).toBe(false);
    });

    it('returns false for non-git', () => {
      expect(isGitAdd('ls', ['ls'])).toBe(false);
    });
  });

  describe('getExistingArgs', () => {
    it('gets args after command for regular commands', () => {
      expect(getExistingArgs(['rm', 'file1.txt', 'file2.txt', ''], false)).toEqual([
        'file1.txt',
        'file2.txt',
        '',
      ]);
    });

    it('gets args after subcommand for git add', () => {
      expect(getExistingArgs(['git', 'add', 'file1.txt', ''], true)).toEqual(['file1.txt', '']);
    });
  });
});
