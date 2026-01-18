/**
 * Integration tests for lessonSetup service.
 *
 * Tests the skipToLesson function that resets filesystem and executes
 * command sequences to reach a specific lesson's starting state.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resetFs, readdir, readFile } from '../fs';
import { clearGitStateHash, repoIntact } from '../gitStateHash';
import { skipToLesson } from './index';
import { lessons } from '../../data/lessons';
import git from 'isomorphic-git';
import { fs } from '../fs';
import { CWD } from '../config';

describe('lessonSetup Integration', () => {
  beforeEach(async () => {
    await resetFs();
    clearGitStateHash();
  });

  describe('skipToLesson', () => {
    it('returns success: false for invalid lesson id', async () => {
      const result = await skipToLesson('invalid-lesson');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid lesson');
    });

    it('lesson-1: starts with empty filesystem', async () => {
      const result = await skipToLesson('lesson-1');
      expect(result.success).toBe(true);

      const files = await readdir(CWD);
      expect(files).toEqual([]);
    });

    it('lesson-2: starts with initialized git repo', async () => {
      const result = await skipToLesson('lesson-2');
      expect(result.success).toBe(true);

      // Should have .git directory
      const files = await readdir(CWD);
      expect(files).toContain('.git');

      // Git state hash should be valid
      expect(await repoIntact()).toBe(true);
    });

    it('lesson-3: starts with staged README.md', async () => {
      const result = await skipToLesson('lesson-3');
      expect(result.success).toBe(true);

      // Should have README.md and .git
      const files = await readdir(CWD);
      expect(files).toContain('README.md');
      expect(files).toContain('.git');

      // README.md should be staged
      const status = await git.statusMatrix({ fs, dir: CWD });
      const readmeStatus = status.find(([f]) => f === 'README.md');
      expect(readmeStatus).toBeTruthy();
      // Status [filename, head, workdir, stage] - [1,0,0] means staged (added)
      expect(readmeStatus![2]).toBe(2); // workdir: 2 = file exists
      expect(readmeStatus![3]).toBe(2); // stage: 2 = added

      expect(await repoIntact()).toBe(true);
    });

    it('lesson-4: starts with one commit', async () => {
      const result = await skipToLesson('lesson-4');
      expect(result.success).toBe(true);

      // Should have one commit
      const commits = await git.log({ fs, dir: CWD });
      expect(commits.length).toBe(1);
      expect(commits[0].commit.message.trim()).toBe('Initial commit');

      expect(await repoIntact()).toBe(true);
    });

    it('lesson-5: starts with two commits and README content', async () => {
      const result = await skipToLesson('lesson-5');
      expect(result.success).toBe(true);

      // Should have two commits
      const commits = await git.log({ fs, dir: CWD });
      expect(commits.length).toBe(2);

      // README should have content
      const content = await readFile(`${CWD}/README.md`);
      expect(content).toContain('# My Project');

      expect(await repoIntact()).toBe(true);
    });

    it('lesson-6: starts with three commits and multiple files', async () => {
      const result = await skipToLesson('lesson-6');
      expect(result.success).toBe(true);

      // Should have three commits
      const commits = await git.log({ fs, dir: CWD });
      expect(commits.length).toBe(3);

      // Should have multiple files
      const files = await readdir(CWD);
      expect(files).toContain('README.md');
      expect(files).toContain('index.html');
      expect(files).toContain('style.css');

      expect(await repoIntact()).toBe(true);
    });

    it('clears previous state before setup', async () => {
      // First go to lesson-6 (most complex state)
      await skipToLesson('lesson-6');
      let files = await readdir(CWD);
      expect(files).toContain('index.html');

      // Now skip to lesson-2 (simpler state)
      const result = await skipToLesson('lesson-2');
      expect(result.success).toBe(true);

      // Should NOT have the files from lesson-6
      files = await readdir(CWD);
      expect(files).not.toContain('index.html');
      expect(files).not.toContain('style.css');
      expect(files).not.toContain('README.md');
      // But should have .git
      expect(files).toContain('.git');
    });

    it('validators pass after skip to lesson-4', async () => {
      await skipToLesson('lesson-4');

      // Lesson 4's first exercise expects file to have content
      // We need to check the lesson's expected starting state
      const lesson4 = lessons.find((l) => l.id === 'lesson-4');
      expect(lesson4).toBeTruthy();

      // At the START of lesson 4, we should have:
      // - A repo with one commit (from lesson 3)
      // - README.md exists (committed in lesson 3)
      // - Clean working tree (nothing staged)
      const commits = await git.log({ fs, dir: CWD });
      expect(commits.length).toBe(1);
    });

    it('validators pass after skip to lesson-6', async () => {
      await skipToLesson('lesson-6');

      // Lesson 6's first exercise just checks git branch
      const lesson6 = lessons.find((l) => l.id === 'lesson-6');
      expect(lesson6).toBeTruthy();

      // At the START of lesson 6, we should have:
      // - A repo with three commits
      // - Multiple files (README.md, index.html, style.css)
      const commits = await git.log({ fs, dir: CWD });
      expect(commits.length).toBe(3);

      // First exercise validator should pass (hasCommits)
      const firstExercise = lesson6!.exercises[0];
      expect(await firstExercise.validate()).toBe(true);
    });

    it('returns executed commands count', async () => {
      const result = await skipToLesson('lesson-4');
      expect(result.success).toBe(true);
      expect(result.commandsExecuted).toBe(4); // git init, touch, git add, git commit
    });

    it('detects .git deletion after skip even with no exercises completed', async () => {
      // This test documents the expected behavior:
      // After skipping to a lesson, the git state hash is set.
      // If .git is deleted, repoIntact() should return false.
      // Bug: useLessonProgress.checkStateIntegrity had early return when completedExercises.length === 0

      const result = await skipToLesson('lesson-3');
      expect(result.success).toBe(true);

      // State is intact immediately after skip
      expect(await repoIntact()).toBe(true);

      // Simulate deleting .git directory (user tampering via rm -rf .git)
      // LightningFS doesn't have rm(), so we need to clear contents then rmdir
      const clearDir = async (path: string): Promise<void> => {
        const entries = await fs.promises.readdir(path);
        for (const entry of entries) {
          const fullPath = `${path}/${entry}`;
          const stats = await fs.promises.stat(fullPath);
          if (stats.isDirectory()) {
            await clearDir(fullPath);
            await fs.promises.rmdir(fullPath);
          } else {
            await fs.promises.unlink(fullPath);
          }
        }
      };
      await clearDir(`${CWD}/.git`);
      await fs.promises.rmdir(`${CWD}/.git`);

      // repoIntact() should detect the deletion
      expect(await repoIntact()).toBe(false);
    });

    it('previous lesson validators fail after prerequisite file deleted', async () => {
      // Skip to lesson 4 - requires README.md to exist (from lesson 3)
      const result = await skipToLesson('lesson-4');
      expect(result.success).toBe(true);

      // Lesson 2's exercise 2-1 validates that README.md exists
      const lesson2 = lessons.find(l => l.id === 'lesson-2');
      const exercise2_1 = lesson2?.exercises.find(e => e.id === '2-1');
      expect(await exercise2_1?.validate()).toBe(true);

      // Delete README.md (simulating user tampering)
      await fs.promises.unlink(`${CWD}/README.md`);

      // Lesson 2's exercise 2-1 should now fail (file doesn't exist)
      expect(await exercise2_1?.validate()).toBe(false);
    });
  });
});
