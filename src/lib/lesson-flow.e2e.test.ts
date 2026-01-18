/**
 * E2E tests for lesson flows.
 *
 * These tests verify multiple services working together:
 * commands + validators + fs + git
 *
 * They catch bugs like "lesson 4 leaves unexpected state for lesson 5".
 *
 * Each test:
 * 1. Resets the filesystem to a clean state
 * 2. Executes real commands
 * 3. Verifies real validators pass/fail
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resetFs } from './fs';
import { gitInit } from './git';
import { executeCommand } from './commands';
import { lessons } from '../data/lessons';

function getExercise(lessonId: string, exerciseId: string) {
  const lesson = lessons.find((l) => l.id === lessonId);
  return lesson?.exercises.find((e) => e.id === exerciseId);
}

describe('Lesson Flow Integration Tests (Real Implementations)', () => {
  beforeEach(async () => {
    // Reset to clean filesystem before each test
    await resetFs();
  });

  describe('Lesson 1: Your First Repository', () => {
    it('step 1-1: git init creates repository and validator passes', async () => {
      await gitInit();

      const exercise = getExercise('lesson-1', '1-1');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 1-2: git status works after init and validator passes', async () => {
      await gitInit();

      const result = await executeCommand('git status');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-1', '1-2');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 1-1 fails without git init', async () => {
      // Don't run git init
      const exercise = getExercise('lesson-1', '1-1');
      const valid = await exercise?.validate();
      expect(valid).toBe(false);
    });
  });

  describe('Lesson 2: Tracking Files', () => {
    beforeEach(async () => {
      // Lesson 2 assumes lesson 1 completed: repo initialized
      await gitInit();
    });

    it('step 2-1: touch creates file and validator passes', async () => {
      const result = await executeCommand('touch README.md');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-2', '2-1');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 2-2: git status shows untracked file', async () => {
      await executeCommand('touch README.md');

      const result = await executeCommand('git status');
      expect(result.success).toBe(true);
      expect(result.output).toContain('README.md');

      const exercise = getExercise('lesson-2', '2-2');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 2-3: git add stages file and validator passes', async () => {
      await executeCommand('touch README.md');

      const result = await executeCommand('git add README.md');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-2', '2-3');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 2-4: git status shows staged file', async () => {
      await executeCommand('touch README.md');
      await executeCommand('git add README.md');

      const result = await executeCommand('git status');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-2', '2-4');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 2-3 fails without file created', async () => {
      // Don't create file, try to stage it
      const exercise = getExercise('lesson-2', '2-3');
      const valid = await exercise?.validate();
      expect(valid).toBe(false);
    });
  });

  describe('Lesson 3: Making Commits', () => {
    beforeEach(async () => {
      // Lesson 3 assumes lessons 1-2 completed: repo with staged file
      await gitInit();
      await executeCommand('touch README.md');
      await executeCommand('git add README.md');
    });

    it('step 3-1: git commit creates commit and validator passes', async () => {
      const result = await executeCommand('git commit -m "Add README"');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-3', '3-1');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 3-2: git log shows commit history', async () => {
      await executeCommand('git commit -m "Add README"');

      const result = await executeCommand('git log');
      expect(result.success).toBe(true);
      expect(result.output).toContain('Add README');

      const exercise = getExercise('lesson-3', '3-2');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 3-1 fails without any commits', async () => {
      // Don't commit
      const exercise = getExercise('lesson-3', '3-1');
      const valid = await exercise?.validate();
      expect(valid).toBe(false);
    });
  });

  describe('Lesson 1 → 2 Transition', () => {
    it('repo from lesson 1 enables lesson 2 to work', async () => {
      // Complete lesson 1
      await gitInit();
      expect(await getExercise('lesson-1', '1-1')?.validate()).toBe(true);

      // Now lesson 2-1 should work
      const result = await executeCommand('touch README.md');
      expect(result.success).toBe(true);
      expect(await getExercise('lesson-2', '2-1')?.validate()).toBe(true);
    });
  });

  describe('Lesson 2 → 3 Transition', () => {
    it('staged file from lesson 2 enables lesson 3 commit', async () => {
      // Complete lessons 1-2
      await gitInit();
      await executeCommand('touch README.md');
      await executeCommand('git add README.md');
      expect(await getExercise('lesson-2', '2-3')?.validate()).toBe(true);

      // Now lesson 3-1 should work
      const result = await executeCommand('git commit -m "Add README"');
      expect(result.success).toBe(true);
      expect(await getExercise('lesson-3', '3-1')?.validate()).toBe(true);
    });

    it('lesson 2 incomplete: file created but not staged breaks lesson 3 flow', async () => {
      await gitInit();
      await executeCommand('touch README.md');
      // Don't stage the file - lesson 2-3 not completed

      // Lesson 2-3 validator should fail (file not staged)
      const ex23 = getExercise('lesson-2', '2-3');
      expect(await ex23?.validate()).toBe(false);
    });
  });

  describe('Lesson 3 → 4 Transition', () => {
    it('commit from lesson 3 enables lesson 4 to create second commit', async () => {
      // Complete lessons 1-3
      await gitInit();
      await executeCommand('touch README.md');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Add README"');
      expect(await getExercise('lesson-3', '3-1')?.validate()).toBe(true);

      // Now lesson 4 should work
      await executeCommand('echo "# My Project" > README.md');
      expect(await getExercise('lesson-4', '4-1')?.validate()).toBe(true);

      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Update README"');
      expect(await getExercise('lesson-4', '4-3')?.validate()).toBe(true);
    });
  });

  describe('Lesson 4: The Edit-Stage-Commit Cycle', () => {
    beforeEach(async () => {
      // Lesson 4 assumes lessons 1-3 completed: repo initialized with one commit
      await gitInit();
      await executeCommand('touch README.md');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Initial commit"');
    });

    it('step 4-1: echo writes content and validator passes', async () => {
      const result = await executeCommand('echo "# My Project" > README.md');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-4', '4-1');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 4-2: git add stages file and validator passes', async () => {
      // First do 4-1
      await executeCommand('echo "# My Project" > README.md');

      // Now do 4-2
      const result = await executeCommand('git add README.md');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-4', '4-2');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 4-3: git commit creates second commit and validator passes', async () => {
      // Do 4-1 and 4-2 first
      await executeCommand('echo "# My Project" > README.md');
      await executeCommand('git add README.md');

      // Now do 4-3
      const result = await executeCommand(
        'git commit -m "Update README with title"'
      );
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-4', '4-3');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('completes full lesson 4 flow', async () => {
      // 4-1
      let result = await executeCommand('echo "# My Project" > README.md');
      expect(result.success).toBe(true);
      let valid = await getExercise('lesson-4', '4-1')?.validate();
      expect(valid).toBe(true);

      // 4-2
      result = await executeCommand('git add README.md');
      expect(result.success).toBe(true);
      valid = await getExercise('lesson-4', '4-2')?.validate();
      expect(valid).toBe(true);

      // 4-3
      result = await executeCommand('git commit -m "Update README with title"');
      expect(result.success).toBe(true);
      valid = await getExercise('lesson-4', '4-3')?.validate();
      expect(valid).toBe(true);
    });
  });

  describe('Lesson 5: Working with Multiple Files', () => {
    beforeEach(async () => {
      // Lesson 5 assumes lessons 1-4 completed
      await gitInit();
      await executeCommand('touch README.md');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Initial commit"');
      // Complete lesson 4
      await executeCommand('echo "# My Project" > README.md');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Update README with title"');
    });

    it('step 5-1: touch creates files and validator passes with 3 files', async () => {
      const result = await executeCommand('touch index.html style.css');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-5', '5-1');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 5-2: git add . stages all and validator passes', async () => {
      // Do 5-1 first
      await executeCommand('touch index.html style.css');

      const result = await executeCommand('git add .');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-5', '5-2');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 5-3: git commit leaves clean working tree', async () => {
      // Do 5-1 and 5-2 first
      await executeCommand('touch index.html style.css');
      await executeCommand('git add .');

      const result = await executeCommand(
        'git commit -m "Add HTML and CSS files"'
      );
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-5', '5-3');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });
  });

  describe('Lesson 4 → 5 Transition', () => {
    it('README.md from lesson 4 enables lesson 5-1 to pass', async () => {
      // Start fresh
      await gitInit();

      // Complete lessons 1-3 setup
      await executeCommand('touch README.md');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Initial commit"');

      // Complete lesson 4
      await executeCommand('echo "# My Project" > README.md');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Update README with title"');

      // Verify lesson 4 is complete
      const ex43 = getExercise('lesson-4', '4-3');
      expect(await ex43?.validate()).toBe(true);

      // Now do lesson 5-1
      const result = await executeCommand('touch index.html style.css');
      expect(result.success).toBe(true);

      // This validator checks for 3 files - README.md must exist from lesson 4
      const ex51 = getExercise('lesson-5', '5-1');
      const valid = await ex51?.validate();
      expect(valid).toBe(true);
    });

    it('lesson 5-1 fails if README.md missing (catches state bug)', async () => {
      // Start fresh - simulate a bug where lesson 4 didn't leave README.md
      await gitInit();

      // Only create 2 files, no README.md
      await executeCommand('touch index.html style.css');

      // Lesson 5-1 expects 3 files - should fail without README.md
      const exercise = getExercise('lesson-5', '5-1');
      const valid = await exercise?.validate();
      expect(valid).toBe(false);
    });
  });

  describe('Full Lesson Sequence', () => {
    it('completes lessons 1-5 in sequence', async () => {
      // Lesson 1: Initialize repository
      await gitInit();
      expect(await getExercise('lesson-1', '1-1')?.validate()).toBe(true);

      // Lesson 2: Create and stage file
      await executeCommand('touch README.md');
      expect(await getExercise('lesson-2', '2-1')?.validate()).toBe(true);

      await executeCommand('git status'); // 2-2 just observes
      expect(await getExercise('lesson-2', '2-2')?.validate()).toBe(true);

      await executeCommand('git add README.md');
      expect(await getExercise('lesson-2', '2-3')?.validate()).toBe(true);

      await executeCommand('git status'); // 2-4 just observes
      expect(await getExercise('lesson-2', '2-4')?.validate()).toBe(true);

      // Lesson 3: First commit
      await executeCommand('git commit -m "Initial commit"');
      expect(await getExercise('lesson-3', '3-1')?.validate()).toBe(true);

      await executeCommand('git log'); // 3-2 just observes
      expect(await getExercise('lesson-3', '3-2')?.validate()).toBe(true);

      // Lesson 4: Edit-stage-commit cycle
      await executeCommand('echo "# My Project" > README.md');
      expect(await getExercise('lesson-4', '4-1')?.validate()).toBe(true);

      await executeCommand('git add README.md');
      expect(await getExercise('lesson-4', '4-2')?.validate()).toBe(true);

      await executeCommand('git commit -m "Update README"');
      expect(await getExercise('lesson-4', '4-3')?.validate()).toBe(true);

      // Lesson 5: Multiple files
      await executeCommand('touch index.html style.css');
      expect(await getExercise('lesson-5', '5-1')?.validate()).toBe(true);

      await executeCommand('git add .');
      expect(await getExercise('lesson-5', '5-2')?.validate()).toBe(true);

      await executeCommand('git commit -m "Add HTML and CSS"');
      expect(await getExercise('lesson-5', '5-3')?.validate()).toBe(true);
    });
  });
});
