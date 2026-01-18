/**
 * Integration tests for gitStateHash with real filesystem.
 * Tests file change detection and withHashUpdate behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  updateGitStateHash,
  clearGitStateHash,
  repoIntact,
  withHashUpdate,
} from './gitStateHash';
import { executeCommand } from './commands';
import * as fsLib from './fs';
import { CWD } from './config';

describe('gitStateHash Integration', () => {
  beforeEach(async () => {
    await fsLib.resetFs();
    clearGitStateHash();
  });

  describe('repoIntact', () => {
    it('returns true when no hash stored (pre-init)', async () => {
      const result = await repoIntact();
      expect(result).toBe(true);
    });

    it('returns true when hash matches after git init', async () => {
      await executeCommand('git init');
      await updateGitStateHash();

      const result = await repoIntact();
      expect(result).toBe(true);
    });

    it('returns false when .git content changes after hash stored', async () => {
      await executeCommand('git init');
      await updateGitStateHash();

      // Modify .git content directly (simulate tampering)
      await fsLib.writeFile(`${CWD}/.git/tampered`, 'malicious content');

      const result = await repoIntact();
      expect(result).toBe(false);
    });

    it('returns false when .git file is deleted', async () => {
      await executeCommand('git init');
      await updateGitStateHash();

      // Delete a file from .git
      await fsLib.unlink(`${CWD}/.git/HEAD`);

      const result = await repoIntact();
      expect(result).toBe(false);
    });

    it('returns false when .git file content is modified', async () => {
      await executeCommand('git init');
      await updateGitStateHash();

      // Modify HEAD content
      await fsLib.writeFile(`${CWD}/.git/HEAD`, 'ref: refs/heads/hacked\n');

      const result = await repoIntact();
      expect(result).toBe(false);
    });
  });

  describe('updateGitStateHash', () => {
    it('updates hash to current state after manual tampering', async () => {
      await executeCommand('git init');
      await updateGitStateHash();

      // Manually tamper with .git (not using git commands)
      await fsLib.writeFile(`${CWD}/.git/tampered`, 'bad');

      // Hash is now stale
      expect(await repoIntact()).toBe(false);

      // Update hash to "accept" the current state
      await updateGitStateHash();

      // Now it should match
      expect(await repoIntact()).toBe(true);
    });

    it('git commands auto-update hash via withHashUpdate', async () => {
      await executeCommand('git init');
      await updateGitStateHash();

      // git add uses withHashUpdate internally, so hash stays valid
      await fsLib.writeFile(`${CWD}/README.md`, '# Hello');
      await executeCommand('git add README.md');

      // Hash should still be valid (git add updates it)
      expect(await repoIntact()).toBe(true);
    });
  });

  describe('withHashUpdate', () => {
    it('updates hash when operation changes .git state', async () => {
      await executeCommand('git init');
      await updateGitStateHash();

      await fsLib.writeFile(`${CWD}/README.md`, '# Hello');

      // git add changes .git state
      await withHashUpdate(async () => {
        await executeCommand('git add README.md');
      });

      // Hash should be updated to new state
      expect(await repoIntact()).toBe(true);
    });

    it('does not update hash when operation is no-op', async () => {
      await executeCommand('git init');
      await updateGitStateHash();

      // Tamper with .git
      await fsLib.writeFile(`${CWD}/.git/tampered`, 'bad');

      // Run a no-op (git init on existing repo doesn't change .git)
      await withHashUpdate(async () => {
        // This operation doesn't change .git
      });

      // Hash should NOT be updated - tampering should still be detected
      expect(await repoIntact()).toBe(false);
    });

    it('returns operation result', async () => {
      await executeCommand('git init');

      const result = await withHashUpdate(async () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
    });

    it('propagates operation errors', async () => {
      await executeCommand('git init');

      await expect(
        withHashUpdate(async () => {
          throw new Error('operation failed');
        })
      ).rejects.toThrow('operation failed');
    });
  });

  describe('clearGitStateHash', () => {
    it('resets state so repoIntact returns true', async () => {
      await executeCommand('git init');
      await updateGitStateHash();

      // Tamper
      await fsLib.writeFile(`${CWD}/.git/tampered`, 'bad');
      expect(await repoIntact()).toBe(false);

      // Clear hash
      clearGitStateHash();

      // Now should be OK (no hash to compare)
      expect(await repoIntact()).toBe(true);
    });
  });

  describe('nested directory handling', () => {
    it('detects changes in nested .git directories', async () => {
      await executeCommand('git init');
      await fsLib.writeFile(`${CWD}/README.md`, '# Test');
      await executeCommand('git add README.md');
      await executeCommand('git commit -m "Initial"');

      await updateGitStateHash();

      // refs/heads/main is in a nested directory
      // Modify it to simulate tampering
      await fsLib.writeFile(`${CWD}/.git/refs/heads/main`, 'badhash');

      expect(await repoIntact()).toBe(false);
    });
  });
});
