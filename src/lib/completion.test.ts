import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CWD } from './config';

// Mock the dependencies
vi.mock('./fs', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
}));

vi.mock('./git', () => ({
  gitListBranches: vi.fn(),
}));

import * as fsLib from './fs';
import * as gitLib from './git';
import { getCompletions, setCurrentExercise } from './completion/index';

describe('Tab Completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('command completion (empty line or first word)', () => {
    it('suggests all commands on empty line', async () => {
      const result = await getCompletions('', 0);

      expect(result.suggestions).toContain('git');
      expect(result.suggestions).toContain('ls');
      expect(result.suggestions).toContain('cat');
      expect(result.suggestions).toContain('echo');
      expect(result.suggestions).toContain('pwd');
      expect(result.suggestions).toContain('mkdir');
      expect(result.suggestions).toContain('touch');
      expect(result.suggestions).toContain('rm');
      expect(result.suggestions).toContain('reset');
      expect(result.suggestions).toContain('clear');
      expect(result.suggestions).toContain('help');
      expect(result.replaceFrom).toBe(0);
      expect(result.replaceTo).toBe(0);
    });

    it('filters commands by partial input', async () => {
      const result = await getCompletions('g', 1);

      expect(result.suggestions).toEqual(['git']);
      expect(result.replaceFrom).toBe(0);
      expect(result.replaceTo).toBe(1);
    });

    it('filters commands starting with c', async () => {
      const result = await getCompletions('c', 1);

      expect(result.suggestions).toContain('cat');
      expect(result.suggestions).toContain('clear');
      expect(result.suggestions).not.toContain('git');
    });

    it('returns empty when no match', async () => {
      const result = await getCompletions('xyz', 3);

      expect(result.suggestions).toEqual([]);
    });
  });

  describe('git subcommand completion', () => {
    it('filters git subcommands by partial input', async () => {
      const result = await getCompletions('git c', 5);

      expect(result.suggestions).toContain('commit');
      expect(result.suggestions).toContain('checkout');
      expect(result.suggestions).not.toContain('add');
      expect(result.suggestions).not.toContain('init');
    });

    it('suggests only matching subcommand', async () => {
      const result = await getCompletions('git st', 6);

      expect(result.suggestions).toEqual(['status']);
    });

    it('returns empty for unknown partial', async () => {
      const result = await getCompletions('git xyz', 7);

      expect(result.suggestions).toEqual([]);
    });
  });

  describe('file path completion for git add', () => {
    it('suggests files after "git add "', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['README.md', 'src', 'package.json']);
      vi.mocked(fsLib.stat).mockImplementation(async (path) => {
        if (path.includes('src')) return { type: 'dir' };
        return { type: 'file' };
      });

      const result = await getCompletions('git add ', 8);

      expect(result.suggestions).toContain('README.md');
      expect(result.suggestions).toContain('src/');
      expect(result.suggestions).toContain('package.json');
      expect(fsLib.readdir).toHaveBeenCalledWith(CWD);
    });

    it('includes hidden files and directories', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue([
        'README.md',
        '.git',
        '.gitignore',
        '.env',
        'src',
      ]);
      vi.mocked(fsLib.stat).mockImplementation(async (path) => {
        if (path.includes('src') || (path.includes('.git') && !path.includes('.gitignore'))) return { type: 'dir' };
        return { type: 'file' };
      });

      const result = await getCompletions('git add ', 8);

      expect(result.suggestions).toContain('README.md');
      expect(result.suggestions).toContain('src/');
      expect(result.suggestions).toContain('.git/');
      expect(result.suggestions).toContain('.gitignore');
      expect(result.suggestions).toContain('.env');
    });

    it('filters files by partial path', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['README.md', 'README.txt', 'other.md']);
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });

      const result = await getCompletions('git add READ', 12);

      expect(result.suggestions).toContain('README.md');
      expect(result.suggestions).toContain('README.txt');
      expect(result.suggestions).not.toContain('other.md');
    });

    it('handles error gracefully', async () => {
      vi.mocked(fsLib.readdir).mockRejectedValue(new Error('ENOENT'));

      const result = await getCompletions('git add ', 8);

      expect(result.suggestions).toEqual([]);
    });
  });

  describe('branch completion for git checkout', () => {
    it('suggests branches after "git checkout "', async () => {
      vi.mocked(gitLib.gitListBranches).mockResolvedValue(['main', 'feature', 'develop']);

      const result = await getCompletions('git checkout ', 13);

      expect(result.suggestions).toContain('main');
      expect(result.suggestions).toContain('feature');
      expect(result.suggestions).toContain('develop');
    });

    it('filters branches by partial input', async () => {
      vi.mocked(gitLib.gitListBranches).mockResolvedValue(['main', 'feature', 'fix-bug']);

      const result = await getCompletions('git checkout f', 14);

      expect(result.suggestions).toContain('feature');
      expect(result.suggestions).toContain('fix-bug');
      expect(result.suggestions).not.toContain('main');
    });

    it('handles error gracefully', async () => {
      vi.mocked(gitLib.gitListBranches).mockRejectedValue(new Error('Not a git repo'));

      const result = await getCompletions('git checkout ', 13);

      expect(result.suggestions).toEqual([]);
    });
  });

  describe('file path completion for ls', () => {
    it('suggests files after "ls "', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['file.txt', 'dir']);
      vi.mocked(fsLib.stat).mockImplementation(async (path) => {
        if (path.includes('dir')) return { type: 'dir' };
        return { type: 'file' };
      });

      const result = await getCompletions('ls ', 3);

      expect(result.suggestions).toContain('file.txt');
      expect(result.suggestions).toContain('dir/');
    });
  });

  describe('file path completion for cat', () => {
    it('suggests files after "cat "', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['README.md', 'index.js']);
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });

      const result = await getCompletions('cat ', 4);

      expect(result.suggestions).toContain('README.md');
      expect(result.suggestions).toContain('index.js');
    });
  });

  describe('file path completion for mkdir', () => {
    it('suggests directories after "mkdir "', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['existing-dir', 'file.txt']);
      vi.mocked(fsLib.stat).mockImplementation(async (path) => {
        if (path.includes('existing-dir')) return { type: 'dir' };
        return { type: 'file' };
      });

      const result = await getCompletions('mkdir ', 6);

      expect(result.suggestions).toContain('existing-dir/');
      expect(result.suggestions).toContain('file.txt');
    });
  });

  describe('file path completion for touch', () => {
    it('suggests files after "touch "', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['existing.txt']);
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });

      const result = await getCompletions('touch ', 6);

      expect(result.suggestions).toContain('existing.txt');
    });

    it('excludes hidden files for touch command', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue([
        'file.txt',
        '.gitignore',
        '.env',
      ]);
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });

      const result = await getCompletions('touch ', 6);

      expect(result.suggestions).toContain('file.txt');
      expect(result.suggestions).not.toContain('.gitignore');
      expect(result.suggestions).not.toContain('.env');
    });
  });

  describe('file path completion for rm', () => {
    it('suggests files after "rm "', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['file.txt', 'dir']);
      vi.mocked(fsLib.stat).mockImplementation(async (path) => {
        if (path.includes('dir')) return { type: 'dir' };
        return { type: 'file' };
      });

      const result = await getCompletions('rm ', 3);

      expect(result.suggestions).toContain('file.txt');
      expect(result.suggestions).toContain('dir/');
    });

    it('includes hidden files (default behavior)', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue([
        'file.txt',
        '.gitignore',
        '.env',
        '.git',
      ]);
      vi.mocked(fsLib.stat).mockImplementation(async (path) => {
        if (path.includes('.git') && !path.includes('.gitignore')) return { type: 'dir' };
        return { type: 'file' };
      });

      const result = await getCompletions('rm ', 3);

      expect(result.suggestions).toContain('file.txt');
      expect(result.suggestions).toContain('.gitignore');
      expect(result.suggestions).toContain('.env');
      expect(result.suggestions).toContain('.git/');
    });
  });

  describe('nested path completion', () => {
    it('completes paths with slashes', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['nested.txt', 'subdir']);
      vi.mocked(fsLib.stat).mockImplementation(async (path) => {
        if (path.includes('subdir')) return { type: 'dir' };
        return { type: 'file' };
      });

      const result = await getCompletions('cat src/', 8);

      expect(fsLib.readdir).toHaveBeenCalledWith(`${CWD}/src`);
      expect(result.suggestions).toContain('src/nested.txt');
      expect(result.suggestions).toContain('src/subdir/');
    });

    it('filters nested files', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['index.ts', 'index.test.ts', 'utils.ts']);
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });

      const result = await getCompletions('cat src/ind', 11);

      expect(result.suggestions).toContain('src/index.ts');
      expect(result.suggestions).toContain('src/index.test.ts');
      expect(result.suggestions).not.toContain('src/utils.ts');
    });
  });

  describe('no completion for other commands', () => {
    it('returns empty for echo command', async () => {
      const result = await getCompletions('echo ', 5);

      expect(result.suggestions).toEqual([]);
    });

    it('returns empty for pwd command', async () => {
      const result = await getCompletions('pwd ', 4);

      expect(result.suggestions).toEqual([]);
    });

    it('returns empty for unknown git subcommands', async () => {
      const result = await getCompletions('git status ', 11);

      expect(result.suggestions).toEqual([]);
    });
  });

  describe('replaceFrom/replaceTo positions', () => {
    it('sets correct positions for command completion', async () => {
      const result = await getCompletions('gi', 2);

      expect(result.replaceFrom).toBe(0);
      expect(result.replaceTo).toBe(2);
    });

    it('sets correct positions for git subcommand completion', async () => {
      const result = await getCompletions('git co', 6);

      expect(result.replaceFrom).toBe(4);
      expect(result.replaceTo).toBe(6);
    });

    it('sets cursor position for new argument', async () => {
      vi.mocked(fsLib.readdir).mockResolvedValue(['file.txt']);
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });

      const result = await getCompletions('ls ', 3);

      expect(result.replaceFrom).toBe(3);
      expect(result.replaceTo).toBe(3);
    });
  });

  describe('lesson-based completion', () => {
    afterEach(() => {
      setCurrentExercise(null);
    });

    it('suggests quoted argument for echo command', async () => {
      setCurrentExercise({
        id: '4-1',
        instruction: 'Add content to README.md',
        hint: 'Type: echo "# My Project" > README.md',
        validate: () => Promise.resolve(true),
        successMessage: 'Done!',
        commandPattern: /^echo\s+.+>\s*README\.md$/i,
      });

      const result = await getCompletions('echo ', 5);

      expect(result.suggestions).toContain('"# My Project"');
    });

    it('suggests next argument after quoted string', async () => {
      setCurrentExercise({
        id: '4-1',
        instruction: 'Add content to README.md',
        hint: 'Type: echo "# My Project" > README.md',
        validate: () => Promise.resolve(true),
        successMessage: 'Done!',
        commandPattern: /^echo\s+.+>\s*README\.md$/i,
      });

      const result = await getCompletions('echo "# My Project" ', 20);

      expect(result.suggestions).toContain('>');
    });

    it('suggests README.md after redirect operator', async () => {
      setCurrentExercise({
        id: '4-1',
        instruction: 'Add content to README.md',
        hint: 'Type: echo "# My Project" > README.md',
        validate: () => Promise.resolve(true),
        successMessage: 'Done!',
        commandPattern: /^echo\s+.+>\s*README\.md$/i,
      });

      const result = await getCompletions('echo "# My Project" > ', 22);

      expect(result.suggestions).toContain('README.md');
    });
  });
});
