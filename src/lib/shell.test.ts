import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CWD } from './config';

// Mock the dependencies before importing
vi.mock('./git', () => ({
  gitInit: vi.fn(),
  gitAdd: vi.fn(),
  gitCommit: vi.fn(),
  gitStatus: vi.fn(),
  gitLog: vi.fn(),
  gitBranch: vi.fn(),
  gitCheckout: vi.fn(),
  gitListBranches: vi.fn(),
  gitCurrentBranch: vi.fn(),
}));

vi.mock('./fs', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn(),
  unlink: vi.fn(),
  rmdir: vi.fn(),
  resetFs: vi.fn(),
}));

import * as gitLib from './git';
import * as fsLib from './fs';
import { executeCommand } from './commands';

describe('Shell Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('echo command', () => {
    it('returns the text', async () => {
      const result = await executeCommand('echo hello world');
      expect(result).toEqual({ output: 'hello world', success: true });
    });

    it('handles empty echo', async () => {
      const result = await executeCommand('echo');
      expect(result).toEqual({ output: '', success: true });
    });

    it('writes text to file with > redirect', async () => {
      vi.mocked(fsLib.writeFile).mockResolvedValue(undefined);

      const result = await executeCommand('echo "# My Project" > README.md');

      expect(result.success).toBe(true);
      expect(fsLib.writeFile).toHaveBeenCalledWith(`${CWD}/README.md`, '# My Project');
    });

    it('handles unquoted text with > redirect', async () => {
      vi.mocked(fsLib.writeFile).mockResolvedValue(undefined);

      const result = await executeCommand('echo hello > test.txt');

      expect(result.success).toBe(true);
      expect(fsLib.writeFile).toHaveBeenCalledWith(`${CWD}/test.txt`, 'hello');
    });

    it('appends text to file with >> redirect', async () => {
      vi.mocked(fsLib.readFile).mockResolvedValue('existing content\n');
      vi.mocked(fsLib.writeFile).mockResolvedValue(undefined);

      const result = await executeCommand('echo new line >> test.txt');

      expect(result.success).toBe(true);
      expect(fsLib.writeFile).toHaveBeenCalledWith(`${CWD}/test.txt`, 'existing content\nnew line');
    });

    it('creates file with >> if it does not exist', async () => {
      vi.mocked(fsLib.readFile).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fsLib.writeFile).mockResolvedValue(undefined);

      const result = await executeCommand('echo first line >> newfile.txt');

      expect(result.success).toBe(true);
      expect(fsLib.writeFile).toHaveBeenCalledWith(`${CWD}/newfile.txt`, 'first line');
    });
  });

  describe('pwd command', () => {
    it('returns CWD', async () => {
      const result = await executeCommand('pwd');
      expect(result).toEqual({ output: CWD, success: true });
    });
  });

  describe('help command', () => {
    it('returns help text', async () => {
      const result = await executeCommand('help');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Understanding Git');
      expect(result.output).toContain('git init');
      expect(result.output).toContain('ls');
    });
  });

  describe('clear command', () => {
    it('returns clear escape sequence', async () => {
      const result = await executeCommand('clear');
      expect(result.success).toBe(true);
      expect(result.output).toBe('\x1b[2J\x1b[H');
    });
  });

  describe('reset command', () => {
    it('calls resetFs and returns success message', async () => {
      vi.mocked(fsLib.resetFs).mockResolvedValue(undefined);

      const result = await executeCommand('reset');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Environment reset');
      expect(fsLib.resetFs).toHaveBeenCalled();
    });
  });

  describe('unknown command', () => {
    it('returns error for unknown command', async () => {
      const result = await executeCommand('unknowncommand');
      expect(result.success).toBe(false);
      expect(result.output).toContain('Command not found: unknowncommand');
    });
  });

  describe('ls command', () => {
    it('lists files in /repo by default', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['file1.txt', 'file2.txt', 'dir']);

      const result = await executeCommand('ls');
      expect(result.success).toBe(true);
      expect(result.output).toBe('file1.txt\nfile2.txt\ndir');
      expect(fsLib.readdir).toHaveBeenCalledWith(CWD);
    });

    it('lists files in specified directory', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['nested.txt']);

      const result = await executeCommand('ls subdir');
      expect(result.success).toBe(true);
      expect(fsLib.readdir).toHaveBeenCalledWith(`${CWD}/subdir`);
    });

    it('handles absolute paths', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['file.txt']);

      await executeCommand('ls /other');
      expect(fsLib.readdir).toHaveBeenCalledWith('/other');
    });
  });

  describe('cat command', () => {
    it('displays file contents', async () => {
      vi.mocked(fsLib.readFile).mockResolvedValue('file content');

      const result = await executeCommand('cat README.md');
      expect(result.success).toBe(true);
      expect(result.output).toBe('file content');
      expect(fsLib.readFile).toHaveBeenCalledWith(`${CWD}/README.md`);
    });

    it('returns error when no file specified', async () => {
      const result = await executeCommand('cat');
      expect(result.success).toBe(false);
      expect(result.output).toContain('missing file operand');
    });
  });

  describe('tail command', () => {
    it('displays last 10 lines by default', async () => {
      const lines = Array.from({ length: 15 }, (_, i) => `line ${i + 1}`).join('\n');
      vi.mocked(fsLib.readFile).mockResolvedValue(lines);

      const result = await executeCommand('tail file.txt');

      expect(result.success).toBe(true);
      expect(result.output).toBe('line 6\nline 7\nline 8\nline 9\nline 10\nline 11\nline 12\nline 13\nline 14\nline 15');
      expect(fsLib.readFile).toHaveBeenCalledWith(`${CWD}/file.txt`);
    });

    it('displays all lines if file has fewer than 10 lines', async () => {
      vi.mocked(fsLib.readFile).mockResolvedValue('line 1\nline 2\nline 3');

      const result = await executeCommand('tail file.txt');

      expect(result.success).toBe(true);
      expect(result.output).toBe('line 1\nline 2\nline 3');
    });

    it('respects -n option for number of lines', async () => {
      const lines = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');
      vi.mocked(fsLib.readFile).mockResolvedValue(lines);

      const result = await executeCommand('tail -n 3 file.txt');

      expect(result.success).toBe(true);
      expect(result.output).toBe('line 8\nline 9\nline 10');
    });

    it('returns error when no file specified', async () => {
      const result = await executeCommand('tail');

      expect(result.success).toBe(false);
      expect(result.output).toContain('missing file operand');
    });

    it('returns error when file not found', async () => {
      vi.mocked(fsLib.readFile).mockRejectedValue(new Error('ENOENT'));

      const result = await executeCommand('tail nonexistent.txt');

      expect(result.success).toBe(false);
      expect(result.output).toContain('No such file');
    });
  });

  describe('mkdir command', () => {
    it('creates a directory', async () => {
      vi.mocked(fsLib.mkdir).mockResolvedValue(undefined);

      const result = await executeCommand('mkdir newdir');
      expect(result.success).toBe(true);
      expect(result.output).toBe('');
      expect(fsLib.mkdir).toHaveBeenCalledWith(`${CWD}/newdir`);
    });

    it('returns error when no directory specified', async () => {
      const result = await executeCommand('mkdir');
      expect(result.success).toBe(false);
      expect(result.output).toContain('missing operand');
    });
  });

  describe('touch command', () => {
    it('creates an empty file when file does not exist', async () => {
      vi.mocked(fsLib.readFile).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fsLib.writeFile).mockResolvedValue(undefined);

      const result = await executeCommand('touch newfile.txt');
      expect(result.success).toBe(true);
      expect(result.output).toBe('');
      expect(fsLib.writeFile).toHaveBeenCalledWith(`${CWD}/newfile.txt`, '');
    });

    it('does not overwrite existing file', async () => {
      vi.mocked(fsLib.readFile).mockResolvedValue('existing content');

      const result = await executeCommand('touch existing.txt');
      expect(result.success).toBe(true);
      expect(fsLib.writeFile).not.toHaveBeenCalled();
    });

    it('returns error when no file specified', async () => {
      const result = await executeCommand('touch');
      expect(result.success).toBe(false);
      expect(result.output).toContain('missing file operand');
    });
  });

  describe('rm command', () => {
    it('removes a file', async () => {
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });
      vi.mocked(fsLib.unlink).mockResolvedValue(undefined);

      const result = await executeCommand('rm file.txt');
      expect(result.success).toBe(true);
      expect(fsLib.unlink).toHaveBeenCalledWith(`${CWD}/file.txt`);
    });

    it('refuses to remove directory without -r flag', async () => {
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'dir' });

      const result = await executeCommand('rm mydir');
      expect(result.success).toBe(false);
      expect(result.output).toContain('Is a directory');
    });

    it('removes directory with -r flag', async () => {
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'dir' });
      vi.mocked(fsLib.readdir).mockResolvedValue([]);
      vi.mocked(fsLib.rmdir).mockResolvedValue(undefined);

      const result = await executeCommand('rm -r emptydir');
      expect(result.success).toBe(true);
      expect(fsLib.rmdir).toHaveBeenCalled();
    });

    it('removes directory with -rf flag', async () => {
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'dir' });
      vi.mocked(fsLib.readdir).mockResolvedValue([]);
      vi.mocked(fsLib.rmdir).mockResolvedValue(undefined);

      const result = await executeCommand('rm -rf emptydir');
      expect(result.success).toBe(true);
    });

    it('returns error when no file specified', async () => {
      const result = await executeCommand('rm');
      expect(result.success).toBe(false);
      expect(result.output).toContain('missing operand');
    });

    it('recursively removes directory with nested files', async () => {
      // Mock stat to return dir for directory, file for files
      vi.mocked(fsLib.stat).mockImplementation(async (path) => {
        if (path === `${CWD}/mydir` || path === `${CWD}/mydir/subdir`) {
          return { type: 'dir' };
        }
        return { type: 'file' };
      });

      // First call returns dir contents, second call returns nested dir contents
      vi.mocked(fsLib.readdir)
        .mockResolvedValueOnce(['file1.txt', 'subdir'])  // mydir contents
        .mockResolvedValueOnce(['nested.txt']);          // subdir contents

      vi.mocked(fsLib.unlink).mockResolvedValue(undefined);
      vi.mocked(fsLib.rmdir).mockResolvedValue(undefined);

      const result = await executeCommand('rm -r mydir');

      expect(result.success).toBe(true);
      // Should have deleted nested file, then subdir, then file1, then mydir
      expect(fsLib.unlink).toHaveBeenCalledWith(`${CWD}/mydir/subdir/nested.txt`);
      expect(fsLib.unlink).toHaveBeenCalledWith(`${CWD}/mydir/file1.txt`);
      expect(fsLib.rmdir).toHaveBeenCalledWith(`${CWD}/mydir/subdir`);
      expect(fsLib.rmdir).toHaveBeenCalledWith(`${CWD}/mydir`);
    });
  });

  describe('edge cases', () => {
    it('handles empty command gracefully', async () => {
      const result = await executeCommand('');
      expect(result.success).toBe(false);
      expect(result.output).toContain('Command not found');
    });

    it('handles whitespace-only command', async () => {
      const result = await executeCommand('   ');
      expect(result.success).toBe(false);
      expect(result.output).toContain('Command not found');
    });

    it('handles command with extra spaces between args', async () => {
      const result = await executeCommand('echo   hello    world');
      // Extra spaces are collapsed by split(/\s+/)
      expect(result.success).toBe(true);
      expect(result.output).toBe('hello world');
    });
  });

  describe('git init', () => {
    it('initializes a git repository', async () => {
      vi.mocked(gitLib.gitInit).mockResolvedValue(undefined);

      const result = await executeCommand('git init');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Initialized empty Git repository');
      expect(gitLib.gitInit).toHaveBeenCalled();
    });
  });

  describe('git add', () => {
    it('stages a file', async () => {
      vi.mocked(gitLib.gitAdd).mockResolvedValue(undefined);

      const result = await executeCommand('git add README.md');
      expect(result.success).toBe(true);
      expect(result.output).toBe('');
      expect(gitLib.gitAdd).toHaveBeenCalledWith('README.md');
    });

    it('returns error when no file specified', async () => {
      const result = await executeCommand('git add');
      expect(result.success).toBe(false);
      expect(result.output).toContain('Nothing specified');
    });
  });

  describe('git commit', () => {
    it('creates a commit with message', async () => {
      vi.mocked(gitLib.gitCommit).mockResolvedValue('abc1234567890');

      const result = await executeCommand('git commit -m "Initial commit"');
      expect(result.success).toBe(true);
      expect(result.output).toContain('[main abc1234]');
      expect(result.output).toContain('Initial commit');
      expect(gitLib.gitCommit).toHaveBeenCalledWith('Initial commit');
    });

    it('handles single-quoted message', async () => {
      vi.mocked(gitLib.gitCommit).mockResolvedValue('abc1234567890');

      const result = await executeCommand("git commit -m 'Add feature'");
      expect(result.success).toBe(true);
      expect(gitLib.gitCommit).toHaveBeenCalledWith('Add feature');
    });

    it('returns error when no message provided', async () => {
      const result = await executeCommand('git commit');
      expect(result.success).toBe(false);
      expect(result.output).toContain('Please provide a commit message');
    });

    it('returns error when -m flag but no message', async () => {
      const result = await executeCommand('git commit -m');
      expect(result.success).toBe(false);
    });
  });

  describe('git status', () => {
    it('shows clean working tree when no changes', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([]);

      const result = await executeCommand('git status');
      expect(result.success).toBe(true);
      expect(result.output).toContain('nothing to commit');
    });

    it('shows clean when all files are unchanged', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 1, 1, 1],
      ]);

      const result = await executeCommand('git status');
      expect(result.success).toBe(true);
      expect(result.output).toContain('nothing to commit');
    });

    it('shows untracked files with ??', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['newfile.txt', 0, 2, 0],
      ]);

      const result = await executeCommand('git status');
      expect(result.success).toBe(true);
      expect(result.output).toContain('??');
      expect(result.output).toContain('newfile.txt');
    });

    it('shows staged files with A', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 0, 2, 2],
      ]);

      const result = await executeCommand('git status');
      expect(result.success).toBe(true);
      expect(result.output).toContain('A');
      expect(result.output).toContain('README.md');
    });

    it('shows modified staged files with M', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 1, 2, 3],
      ]);

      const result = await executeCommand('git status');
      expect(result.success).toBe(true);
      expect(result.output).toContain('M');
    });

    it('shows modified working dir files with M', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 1, 2, 1],
      ]);

      const result = await executeCommand('git status');
      expect(result.success).toBe(true);
      expect(result.output).toContain('M');
    });
  });

  describe('git log', () => {
    it('shows commit history', async () => {
      vi.mocked(gitLib.gitLog).mockResolvedValue([
        { oid: 'abc1234', message: 'First commit', author: 'Git Learner' },
        { oid: 'def5678', message: 'Second commit', author: 'Git Learner' },
      ]);

      const result = await executeCommand('git log');
      expect(result.success).toBe(true);
      expect(result.output).toContain('commit abc1234');
      expect(result.output).toContain('First commit');
      expect(result.output).toContain('Git Learner');
    });

    it('shows message when no commits', async () => {
      vi.mocked(gitLib.gitLog).mockResolvedValue([]);

      const result = await executeCommand('git log');
      expect(result.success).toBe(true);
      expect(result.output).toContain('No commits yet');
    });
  });

  describe('git branch', () => {
    it('lists branches with current marked', async () => {
      vi.mocked(gitLib.gitListBranches).mockResolvedValue(['main', 'feature']);
      vi.mocked(gitLib.gitCurrentBranch).mockResolvedValue('main');

      const result = await executeCommand('git branch');
      expect(result.success).toBe(true);
      expect(result.output).toContain('* main');
      expect(result.output).toContain('feature');
    });

    it('creates a new branch', async () => {
      vi.mocked(gitLib.gitBranch).mockResolvedValue(undefined);

      const result = await executeCommand('git branch newbranch');
      expect(result.success).toBe(true);
      expect(result.output).toBe('');
      expect(gitLib.gitBranch).toHaveBeenCalledWith('newbranch');
    });
  });

  describe('git checkout', () => {
    it('switches to a branch', async () => {
      vi.mocked(gitLib.gitCheckout).mockResolvedValue(undefined);

      const result = await executeCommand('git checkout feature');
      expect(result.success).toBe(true);
      expect(result.output).toContain("Switched to branch 'feature'");
      expect(gitLib.gitCheckout).toHaveBeenCalledWith('feature');
    });

    it('returns error when no branch specified', async () => {
      const result = await executeCommand('git checkout');
      expect(result.success).toBe(false);
      expect(result.output).toContain('Please specify a branch');
    });
  });

  describe('unknown git subcommand', () => {
    it('returns error for unknown git subcommand', async () => {
      const result = await executeCommand('git unknown');
      expect(result.success).toBe(false);
      expect(result.output).toContain("'unknown' is not a git command");
    });
  });

  describe('error handling', () => {
    it('catches and displays errors', async () => {
      vi.mocked(gitLib.gitInit).mockRejectedValue(new Error('Git error'));

      const result = await executeCommand('git init');
      expect(result.success).toBe(false);
      expect(result.output).toContain('Error');
      expect(result.output).toContain('Git error');
    });
  });
});
