import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies before importing the module that uses them
vi.mock('./git', () => ({
  gitStatus: vi.fn(),
  gitLog: vi.fn(),
}));

vi.mock('./fs', () => ({
  stat: vi.fn(),
  readFile: vi.fn(),
}));

// Import the mocked modules
import * as gitLib from './git';
import * as fsLib from './fs';

// Import validators from lessons.ts - we test them through the lessons data
import { lessons } from '../data/lessons';

// Helper to get a validator by exercise ID
function getValidator(lessonId: string, exerciseId: string) {
  const lesson = lessons.find(l => l.id === lessonId);
  const exercise = lesson?.exercises.find(e => e.id === exerciseId);
  return exercise?.validate;
}

describe('Lesson Validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('repoInitialized (exercise 1-1, 1-2)', () => {
    it('returns true when .git directory exists', async () => {
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'dir' });

      const validator = getValidator('lesson-1', '1-1');
      const result = await validator?.();

      expect(result).toBe(true);
      expect(fsLib.stat).toHaveBeenCalledWith('/repo/.git');
    });

    it('returns false when .git is a file (not directory)', async () => {
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });

      const validator = getValidator('lesson-1', '1-1');
      const result = await validator?.();

      expect(result).toBe(false);
    });

    it('returns false when .git does not exist', async () => {
      vi.mocked(fsLib.stat).mockRejectedValue(new Error('ENOENT'));

      const validator = getValidator('lesson-1', '1-1');
      const result = await validator?.();

      expect(result).toBe(false);
    });
  });

  describe('fileExists (exercise 2-1)', () => {
    it('returns true when file exists', async () => {
      vi.mocked(fsLib.stat).mockResolvedValue({ type: 'file' });

      const validator = getValidator('lesson-2', '2-1');
      const result = await validator?.();

      expect(result).toBe(true);
      expect(fsLib.stat).toHaveBeenCalledWith('/repo/README.md');
    });

    it('returns false when file does not exist', async () => {
      vi.mocked(fsLib.stat).mockRejectedValue(new Error('ENOENT'));

      const validator = getValidator('lesson-2', '2-1');
      const result = await validator?.();

      expect(result).toBe(false);
    });
  });

  describe('hasUntrackedFiles (exercise 2-2)', () => {
    it('returns true when there are untracked files', async () => {
      // Untracked: head=0, workdir=2, stage=0
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 0, 2, 0],
      ]);

      const validator = getValidator('lesson-2', '2-2');
      const result = await validator?.();

      expect(result).toBe(true);
    });

    it('returns false when no untracked files', async () => {
      // Tracked file: head=1, workdir=1, stage=1
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 1, 1, 1],
      ]);

      const validator = getValidator('lesson-2', '2-2');
      const result = await validator?.();

      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      vi.mocked(gitLib.gitStatus).mockRejectedValue(new Error('Not a git repo'));

      const validator = getValidator('lesson-2', '2-2');
      const result = await validator?.();

      expect(result).toBe(false);
    });
  });

  describe('fileStaged (exercise 2-3)', () => {
    it('returns true when specific file is staged', async () => {
      // Staged (added): stage=2
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 0, 2, 2],
      ]);

      const validator = getValidator('lesson-2', '2-3');
      const result = await validator?.();

      expect(result).toBe(true);
    });

    it('returns false when file is not staged', async () => {
      // Untracked (not staged): stage=0
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 0, 2, 0],
      ]);

      const validator = getValidator('lesson-2', '2-3');
      const result = await validator?.();

      expect(result).toBe(false);
    });

    it('returns false when different file is staged', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['other.txt', 0, 2, 2],
      ]);

      const validator = getValidator('lesson-2', '2-3');
      const result = await validator?.();

      expect(result).toBe(false);
    });
  });

  describe('hasStagedFiles (exercise 2-4, 4-2, 5-2)', () => {
    it('returns true when files are staged (stage=2)', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 0, 2, 2],
      ]);

      const validator = getValidator('lesson-2', '2-4');
      const result = await validator?.();

      expect(result).toBe(true);
    });

    it('returns true when files are staged (stage=3, modified)', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 1, 2, 3],
      ]);

      const validator = getValidator('lesson-2', '2-4');
      const result = await validator?.();

      expect(result).toBe(true);
    });

    it('returns false when no staged files', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 0, 2, 0],
      ]);

      const validator = getValidator('lesson-2', '2-4');
      const result = await validator?.();

      expect(result).toBe(false);
    });
  });

  describe('hasCommits (exercise 3-1, 3-2)', () => {
    it('returns true when there are commits', async () => {
      vi.mocked(gitLib.gitLog).mockResolvedValue([
        { oid: 'abc1234', message: 'Initial commit', author: 'Git Learner' },
      ]);

      const validator = getValidator('lesson-3', '3-1');
      const result = await validator?.();

      expect(result).toBe(true);
    });

    it('returns false when no commits', async () => {
      vi.mocked(gitLib.gitLog).mockResolvedValue([]);

      const validator = getValidator('lesson-3', '3-1');
      const result = await validator?.();

      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      vi.mocked(gitLib.gitLog).mockRejectedValue(new Error('No commits'));

      const validator = getValidator('lesson-3', '3-1');
      const result = await validator?.();

      expect(result).toBe(false);
    });
  });

  describe('fileHasContent (exercise 4-1)', () => {
    it('returns true when file has content', async () => {
      vi.mocked(fsLib.readFile).mockResolvedValue('# My Project');

      const validator = getValidator('lesson-4', '4-1');
      const result = await validator?.();

      expect(result).toBe(true);
      expect(fsLib.readFile).toHaveBeenCalledWith('/repo/README.md');
    });

    it('returns false when file is empty', async () => {
      vi.mocked(fsLib.readFile).mockResolvedValue('');

      const validator = getValidator('lesson-4', '4-1');
      const result = await validator?.();

      expect(result).toBe(false);
    });

    it('returns false when file has only whitespace', async () => {
      vi.mocked(fsLib.readFile).mockResolvedValue('   \n\t  ');

      const validator = getValidator('lesson-4', '4-1');
      const result = await validator?.();

      expect(result).toBe(false);
    });

    it('returns false when file does not exist', async () => {
      vi.mocked(fsLib.readFile).mockRejectedValue(new Error('ENOENT'));

      const validator = getValidator('lesson-4', '4-1');
      const result = await validator?.();

      expect(result).toBe(false);
    });
  });

  describe('hasMultipleCommits (exercise 4-3)', () => {
    it('returns true when there are 2+ commits', async () => {
      vi.mocked(gitLib.gitLog).mockResolvedValue([
        { oid: 'abc1234', message: 'Second commit', author: 'Git Learner' },
        { oid: 'def5678', message: 'First commit', author: 'Git Learner' },
      ]);

      const validator = getValidator('lesson-4', '4-3');
      const result = await validator?.();

      expect(result).toBe(true);
    });

    it('returns false when there is only 1 commit', async () => {
      vi.mocked(gitLib.gitLog).mockResolvedValue([
        { oid: 'abc1234', message: 'First commit', author: 'Git Learner' },
      ]);

      const validator = getValidator('lesson-4', '4-3');
      const result = await validator?.();

      expect(result).toBe(false);
    });

    it('returns false when there are no commits', async () => {
      vi.mocked(gitLib.gitLog).mockResolvedValue([]);

      const validator = getValidator('lesson-4', '4-3');
      const result = await validator?.();

      expect(result).toBe(false);
    });
  });

  describe('multipleFilesExist (exercise 5-1)', () => {
    it('returns true when there are enough files tracked', async () => {
      // Exercise 5-1 expects 3 files
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 1, 1, 1],
        ['index.html', 0, 2, 0],
        ['style.css', 0, 2, 0],
      ]);

      const validator = getValidator('lesson-5', '5-1');
      const result = await validator?.();

      expect(result).toBe(true);
    });

    it('returns false when there are not enough files', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 1, 1, 1],
        ['index.html', 0, 2, 0],
      ]);

      const validator = getValidator('lesson-5', '5-1');
      const result = await validator?.();

      expect(result).toBe(false);
    });
  });

  describe('workingTreeClean (exercise 5-3)', () => {
    it('returns true when all files are committed (head=1, workdir=1, stage=1)', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 1, 1, 1],
        ['index.html', 1, 1, 1],
        ['style.css', 1, 1, 1],
      ]);

      const validator = getValidator('lesson-5', '5-3');
      const result = await validator?.();

      expect(result).toBe(true);
    });

    it('returns false when there are uncommitted changes', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 1, 1, 1],
        ['index.html', 1, 2, 1], // Modified in working dir
      ]);

      const validator = getValidator('lesson-5', '5-3');
      const result = await validator?.();

      expect(result).toBe(false);
    });

    it('returns false when there are staged but uncommitted files', async () => {
      vi.mocked(gitLib.gitStatus).mockResolvedValue([
        ['README.md', 1, 1, 1],
        ['newfile.txt', 0, 2, 2], // Staged new file
      ]);

      const validator = getValidator('lesson-5', '5-3');
      const result = await validator?.();

      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      vi.mocked(gitLib.gitStatus).mockRejectedValue(new Error('Not a git repo'));

      const validator = getValidator('lesson-5', '5-3');
      const result = await validator?.();

      expect(result).toBe(false);
    });
  });
});
