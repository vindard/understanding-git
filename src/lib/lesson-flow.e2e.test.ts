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
import { executeCommand } from './commands';
import { repoIntact, clearGitStateHash } from './gitStateHash';
import { lessons } from '../data/lessons';

// Helper to init git repo - wraps executeCommand for cleaner tests
async function gitInit() {
  await executeCommand('git init');
}

function getExercise(lessonId: string, exerciseId: string) {
  const lesson = lessons.find((l) => l.id === lessonId);
  return lesson?.exercises.find((e) => e.id === exerciseId);
}

describe('Lesson Flow E2E Tests', () => {
  beforeEach(async () => {
    // Reset to clean filesystem and clear hash state before each test
    await resetFs();
    clearGitStateHash();
  });

  describe('Hash integrity through lesson flow', () => {
    it('maintains hash integrity through lesson 4 commit', async () => {
      // This test verifies the bug: hash should remain valid after git commit

      // Lesson 1: init
      await executeCommand('git init');
      expect(await repoIntact()).toBe(true);

      // Lesson 2: create and stage file
      await executeCommand('touch README.md');
      expect(await repoIntact()).toBe(true);

      await executeCommand('git add README.md');
      expect(await repoIntact()).toBe(true);

      // Lesson 3: first commit
      await executeCommand('git commit -m "Initial commit"');
      expect(await repoIntact()).toBe(true);

      // Lesson 4: edit-stage-commit cycle
      await executeCommand('echo "# My Project" > README.md');
      expect(await repoIntact()).toBe(true);

      await executeCommand('git add README.md');
      expect(await repoIntact()).toBe(true);

      // THIS IS THE FAILING STEP - hash should be valid after commit
      await executeCommand('git commit -m "Update README with title"');
      expect(await repoIntact()).toBe(true);
    });
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

    it('all completed exercise validators remain true after lesson 4 commit', async () => {
      // This test catches the bug: validators for completed exercises should
      // remain valid even after completing subsequent exercises.

      // Complete all of lesson 4
      await executeCommand('echo "# My Project" > README.md');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Update README with title"');

      // After 4-3 commit, ALL previous validators should still pass
      // This was failing because hasStagedFiles (4-2) returns false after commit
      expect(await getExercise('lesson-4', '4-1')?.validate()).toBe(true);
      expect(await getExercise('lesson-4', '4-2')?.validate()).toBe(true);
      expect(await getExercise('lesson-4', '4-3')?.validate()).toBe(true);
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

    it('all completed exercise validators remain true after lesson 5 commit', async () => {
      // Same bug as lesson 4: hasStagedFiles (5-2) would fail after commit
      await executeCommand('touch index.html style.css');
      await executeCommand('git add .');
      await executeCommand('git commit -m "Add HTML and CSS files"');

      // After 5-3 commit, ALL previous validators should still pass
      expect(await getExercise('lesson-5', '5-1')?.validate()).toBe(true);
      expect(await getExercise('lesson-5', '5-2')?.validate()).toBe(true);
      expect(await getExercise('lesson-5', '5-3')?.validate()).toBe(true);
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

  describe('Lesson 6: Branching Basics', () => {
    beforeEach(async () => {
      // Lesson 6 assumes lessons 1-5 completed
      await gitInit();
      await executeCommand('touch README.md');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Initial commit"');
      await executeCommand('echo "# My Project" > README.md');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Update README with title"');
      await executeCommand('touch index.html style.css');
      await executeCommand('git add .');
      await executeCommand('git commit -m "Add HTML and CSS files"');
    });

    it('step 6-1: git branch lists current branch', async () => {
      const result = await executeCommand('git branch');
      expect(result.success).toBe(true);
      expect(result.output).toContain('master');

      const exercise = getExercise('lesson-6', '6-1');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 6-2: git branch feature creates new branch', async () => {
      const result = await executeCommand('git branch feature');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-6', '6-2');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 6-3: git branch shows multiple branches', async () => {
      await executeCommand('git branch feature');

      const result = await executeCommand('git branch');
      expect(result.success).toBe(true);
      expect(result.output).toContain('feature');
      expect(result.output).toContain('master');

      const exercise = getExercise('lesson-6', '6-3');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 6-4: git checkout feature switches branch', async () => {
      await executeCommand('git branch feature');

      const result = await executeCommand('git checkout feature');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-6', '6-4');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('step 6-5: git branch confirms on feature branch', async () => {
      await executeCommand('git branch feature');
      await executeCommand('git checkout feature');

      const result = await executeCommand('git branch');
      expect(result.success).toBe(true);

      const exercise = getExercise('lesson-6', '6-5');
      const valid = await exercise?.validate();
      expect(valid).toBe(true);
    });

    it('all completed exercise validators remain true after lesson 6', async () => {
      await executeCommand('git branch feature');
      await executeCommand('git checkout feature');

      // After completing lesson 6, ALL validators should still pass
      expect(await getExercise('lesson-6', '6-1')?.validate()).toBe(true);
      expect(await getExercise('lesson-6', '6-2')?.validate()).toBe(true);
      expect(await getExercise('lesson-6', '6-3')?.validate()).toBe(true);
      expect(await getExercise('lesson-6', '6-4')?.validate()).toBe(true);
      expect(await getExercise('lesson-6', '6-5')?.validate()).toBe(true);
    });
  });

  describe('Lesson 5 → 6 Transition', () => {
    it('clean working tree from lesson 5 enables lesson 6', async () => {
      // Complete lessons 1-5
      await gitInit();
      await executeCommand('touch README.md');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Initial commit"');
      await executeCommand('echo "# My Project" > README.md');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Update README with title"');
      await executeCommand('touch index.html style.css');
      await executeCommand('git add .');
      await executeCommand('git commit -m "Add HTML and CSS files"');

      // Verify lesson 5 is complete
      expect(await getExercise('lesson-5', '5-3')?.validate()).toBe(true);

      // Now lesson 6-1 should work
      const result = await executeCommand('git branch');
      expect(result.success).toBe(true);

      const ex61 = getExercise('lesson-6', '6-1');
      const valid = await ex61?.validate();
      expect(valid).toBe(true);
    });
  });

  describe('Full Lesson Sequence', () => {
    it('completes lessons 1-6 in sequence', async () => {
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

      // Lesson 6: Branching basics
      await executeCommand('git branch');
      expect(await getExercise('lesson-6', '6-1')?.validate()).toBe(true);

      await executeCommand('git branch feature');
      expect(await getExercise('lesson-6', '6-2')?.validate()).toBe(true);

      await executeCommand('git branch');
      expect(await getExercise('lesson-6', '6-3')?.validate()).toBe(true);

      await executeCommand('git checkout feature');
      expect(await getExercise('lesson-6', '6-4')?.validate()).toBe(true);

      await executeCommand('git branch');
      expect(await getExercise('lesson-6', '6-5')?.validate()).toBe(true);
    });
  });
});
