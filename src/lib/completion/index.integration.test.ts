/**
 * Integration tests for the completion service.
 * Tests getCompletions with real filesystem and git operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getCompletions } from './index';
import { executeCommand } from '../commands';
import * as fsLib from '../fs';
import { CWD } from '../config';

describe('Completion Service', () => {
  beforeEach(async () => {
    await fsLib.resetFs();
  });

  describe('command completion', () => {
    it('completes partial command at start of line', async () => {
      const result = await getCompletions('gi', 2);

      expect(result.suggestions).toContain('git');
      expect(result.replaceFrom).toBe(0);
    });

    it('completes empty line with all commands', async () => {
      const result = await getCompletions('', 0);

      expect(result.suggestions).toContain('git');
      expect(result.suggestions).toContain('ls');
      expect(result.suggestions).toContain('cat');
      expect(result.suggestions).toContain('echo');
    });

    it('filters commands by prefix', async () => {
      const result = await getCompletions('c', 1);

      expect(result.suggestions).toContain('cat');
      expect(result.suggestions).toContain('clear');
      expect(result.suggestions).not.toContain('git');
      expect(result.suggestions).not.toContain('ls');
    });

    it('returns empty for non-matching prefix', async () => {
      const result = await getCompletions('xyz', 3);

      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('git subcommand completion', () => {
    it('completes git subcommand after "git "', async () => {
      const result = await getCompletions('git ', 4);

      expect(result.suggestions).toContain('init');
      expect(result.suggestions).toContain('add');
      expect(result.suggestions).toContain('commit');
      expect(result.suggestions).toContain('status');
      expect(result.suggestions).toContain('log');
      expect(result.suggestions).toContain('branch');
      expect(result.suggestions).toContain('checkout');
    });

    it('filters git subcommands by partial', async () => {
      const result = await getCompletions('git ch', 6);

      expect(result.suggestions).toContain('checkout');
      expect(result.suggestions).not.toContain('commit');
      expect(result.suggestions).not.toContain('init');
      expect(result.suggestions).not.toContain('add');
    });

    it('completes "git s" with status', async () => {
      const result = await getCompletions('git s', 5);

      expect(result.suggestions).toContain('status');
    });
  });

  describe('file path completion', () => {
    it('completes files in current directory', async () => {
      await fsLib.writeFile(`${CWD}/README.md`, '# Test');
      await fsLib.writeFile(`${CWD}/index.ts`, 'export {}');

      const result = await getCompletions('cat ', 4);

      expect(result.suggestions).toContain('README.md');
      expect(result.suggestions).toContain('index.ts');
    });

    it('completes partial filename', async () => {
      await fsLib.writeFile(`${CWD}/README.md`, '# Test');
      await fsLib.writeFile(`${CWD}/RELEASE.md`, '# Release');
      await fsLib.writeFile(`${CWD}/index.ts`, 'export {}');

      const result = await getCompletions('cat RE', 6);

      expect(result.suggestions).toContain('README.md');
      expect(result.suggestions).toContain('RELEASE.md');
      expect(result.suggestions).not.toContain('index.ts');
    });

    it('completes directories with trailing slash', async () => {
      await fsLib.mkdir(`${CWD}/src`);
      await fsLib.writeFile(`${CWD}/file.txt`, 'content');

      const result = await getCompletions('ls ', 3);

      expect(result.suggestions).toContain('src/');
      expect(result.suggestions).toContain('file.txt');
    });

    it('completes files in subdirectory', async () => {
      await fsLib.mkdir(`${CWD}/src`);
      await fsLib.writeFile(`${CWD}/src/index.ts`, 'export {}');
      await fsLib.writeFile(`${CWD}/src/utils.ts`, 'export {}');

      const result = await getCompletions('cat src/', 8);

      expect(result.suggestions).toContain('src/index.ts');
      expect(result.suggestions).toContain('src/utils.ts');
    });

    it('completes partial path in subdirectory', async () => {
      await fsLib.mkdir(`${CWD}/src`);
      await fsLib.writeFile(`${CWD}/src/index.ts`, 'export {}');
      await fsLib.writeFile(`${CWD}/src/utils.ts`, 'export {}');

      const result = await getCompletions('cat src/i', 9);

      expect(result.suggestions).toContain('src/index.ts');
      expect(result.suggestions).not.toContain('src/utils.ts');
    });

    it('hides hidden files for touch command', async () => {
      await fsLib.writeFile(`${CWD}/.hidden`, 'secret');
      await fsLib.writeFile(`${CWD}/visible.txt`, 'content');

      const result = await getCompletions('touch ', 6);

      expect(result.suggestions).toContain('visible.txt');
      expect(result.suggestions).not.toContain('.hidden');
    });

    it('shows hidden files for most commands', async () => {
      await fsLib.writeFile(`${CWD}/.hidden`, 'secret');
      await fsLib.writeFile(`${CWD}/visible.txt`, 'content');

      const result = await getCompletions('cat ', 4);

      expect(result.suggestions).toContain('visible.txt');
      expect(result.suggestions).toContain('.hidden');
    });

    it('excludes .git directory for git add', async () => {
      await executeCommand('git init');
      await fsLib.writeFile(`${CWD}/file.txt`, 'content');

      const result = await getCompletions('git add ', 8);

      expect(result.suggestions).toContain('file.txt');
      expect(result.suggestions).not.toContain('.git/');
    });

    it('excludes already-added files for git add', async () => {
      await executeCommand('git init');
      await fsLib.writeFile(`${CWD}/added.txt`, 'content');
      await fsLib.writeFile(`${CWD}/pending.txt`, 'content');

      const result = await getCompletions('git add added.txt ', 18);

      expect(result.suggestions).toContain('pending.txt');
      expect(result.suggestions).not.toContain('added.txt');
    });

    it('works with head command', async () => {
      await fsLib.writeFile(`${CWD}/file.txt`, 'content');

      const result = await getCompletions('head ', 5);

      expect(result.suggestions).toContain('file.txt');
    });

    it('works with tail command', async () => {
      await fsLib.writeFile(`${CWD}/file.txt`, 'content');

      const result = await getCompletions('tail ', 5);

      expect(result.suggestions).toContain('file.txt');
    });

    it('works with rm command', async () => {
      await fsLib.writeFile(`${CWD}/delete-me.txt`, 'content');

      const result = await getCompletions('rm ', 3);

      expect(result.suggestions).toContain('delete-me.txt');
    });

    it('returns empty for nonexistent directory', async () => {
      const result = await getCompletions('cat nonexistent/', 17);

      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('branch completion', () => {
    it('completes branch names for git checkout', async () => {
      await executeCommand('git init');
      await fsLib.writeFile(`${CWD}/README.md`, '# Test');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Initial"');
      await executeCommand('git branch feature');
      await executeCommand('git branch bugfix');

      const result = await getCompletions('git checkout ', 13);

      // isomorphic-git uses "master" as default branch
      expect(result.suggestions).toContain('master');
      expect(result.suggestions).toContain('feature');
      expect(result.suggestions).toContain('bugfix');
    });

    it('filters branches by partial name', async () => {
      await executeCommand('git init');
      await fsLib.writeFile(`${CWD}/README.md`, '# Test');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Initial"');
      await executeCommand('git branch feature-one');
      await executeCommand('git branch feature-two');
      await executeCommand('git branch bugfix');

      const result = await getCompletions('git checkout f', 14);

      expect(result.suggestions).toContain('feature-one');
      expect(result.suggestions).toContain('feature-two');
      expect(result.suggestions).not.toContain('bugfix');
      expect(result.suggestions).not.toContain('main');
    });

    it('returns empty when no branches match', async () => {
      await executeCommand('git init');
      await fsLib.writeFile(`${CWD}/README.md`, '# Test');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Initial"');

      const result = await getCompletions('git checkout xyz', 16);

      expect(result.suggestions).toHaveLength(0);
    });

    it('returns empty before git init', async () => {
      const result = await getCompletions('git checkout ', 13);

      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('replaceFrom calculation', () => {
    it('replaces from start for command completion', async () => {
      const result = await getCompletions('gi', 2);

      expect(result.replaceFrom).toBe(0);
      expect(result.replaceTo).toBe(2);
    });

    it('replaces partial word for file completion', async () => {
      await fsLib.writeFile(`${CWD}/README.md`, '# Test');

      const result = await getCompletions('cat READ', 8);

      expect(result.replaceFrom).toBe(4); // After "cat "
      expect(result.replaceTo).toBe(8);
    });

    it('inserts at cursor when ending with space', async () => {
      await fsLib.writeFile(`${CWD}/file.txt`, 'content');

      const result = await getCompletions('cat ', 4);

      expect(result.replaceFrom).toBe(4);
      expect(result.replaceTo).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('handles empty directory', async () => {
      const result = await getCompletions('ls ', 3);

      expect(result.suggestions).toHaveLength(0);
    });

    it('handles command with multiple spaces', async () => {
      await fsLib.writeFile(`${CWD}/file.txt`, 'content');

      const result = await getCompletions('cat  ', 5);

      expect(result.suggestions).toContain('file.txt');
    });

    it('does not complete after complete command', async () => {
      // After a complete git status command, no more completions
      const result = await getCompletions('git status ', 11);

      // Should return file completions or empty, not git subcommands
      expect(result.suggestions).not.toContain('init');
      expect(result.suggestions).not.toContain('add');
    });
  });
});
