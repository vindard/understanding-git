import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the fs module before importing gitStateHash
vi.mock('./fs', () => ({
  fs: {
    promises: {
      readdir: vi.fn(),
      stat: vi.fn(),
      readFile: vi.fn(),
    },
  },
}));

import { fs } from './fs';

// Helper to mock readFile with string content (fs.readFile can return string or Uint8Array)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockReadFile = (content: string) => (fs.promises.readFile as any).mockResolvedValue(content);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockReadFileImpl = (impl: () => Promise<string>) => (fs.promises.readFile as any).mockImplementation(impl);

import {
  updateGitStateHash,
  clearGitStateHash,
  repoIntact,
  withHashUpdate,
} from './gitStateHash';

describe('gitStateHash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGitStateHash();
  });

  describe('repoIntact', () => {
    it('returns true when no hash has been stored yet (pre-init state)', async () => {
      const result = await repoIntact();
      expect(result).toBe(true);
    });

    it('returns true when current hash matches stored hash', async () => {
      // Setup mock filesystem
      vi.mocked(fs.promises.readdir).mockResolvedValue(['HEAD', 'config'] as unknown as string[]);
      vi.mocked(fs.promises.stat).mockResolvedValue({ isDirectory: () => false } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>);
      mockReadFile('ref: refs/heads/main\n');

      // Store the hash
      await updateGitStateHash();

      // Check integrity - should match
      const result = await repoIntact();
      expect(result).toBe(true);
    });

    it('returns false when current hash differs from stored hash', async () => {
      // Initial state
      vi.mocked(fs.promises.readdir).mockResolvedValue(['HEAD', 'config'] as unknown as string[]);
      vi.mocked(fs.promises.stat).mockResolvedValue({ isDirectory: () => false } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>);
      mockReadFile('ref: refs/heads/main\n');

      // Store the hash
      await updateGitStateHash();

      // Simulate tampering - file content changed
      mockReadFile('ref: refs/heads/feature\n');

      // Check integrity - should not match
      const result = await repoIntact();
      expect(result).toBe(false);
    });

    it('returns false when a file is deleted from .git', async () => {
      // Initial state with two files
      vi.mocked(fs.promises.readdir).mockResolvedValue(['HEAD', 'config'] as unknown as string[]);
      vi.mocked(fs.promises.stat).mockResolvedValue({ isDirectory: () => false } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>);
      mockReadFile('content');

      // Store the hash
      await updateGitStateHash();

      // Simulate deletion - only one file remains
      vi.mocked(fs.promises.readdir).mockResolvedValue(['config'] as unknown as string[]);

      // Check integrity - should not match
      const result = await repoIntact();
      expect(result).toBe(false);
    });

    it('returns false when a file is added to .git', async () => {
      // Initial state with one file
      vi.mocked(fs.promises.readdir).mockResolvedValue(['HEAD'] as unknown as string[]);
      vi.mocked(fs.promises.stat).mockResolvedValue({ isDirectory: () => false } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>);
      mockReadFile('content');

      // Store the hash
      await updateGitStateHash();

      // Simulate addition - new file added
      vi.mocked(fs.promises.readdir).mockResolvedValue(['HEAD', 'malicious'] as unknown as string[]);

      // Check integrity - should not match
      const result = await repoIntact();
      expect(result).toBe(false);
    });
  });

  describe('clearGitStateHash', () => {
    it('resets state so repoIntact returns true', async () => {
      // Setup and store a hash
      vi.mocked(fs.promises.readdir).mockResolvedValue(['HEAD'] as unknown as string[]);
      vi.mocked(fs.promises.stat).mockResolvedValue({ isDirectory: () => false } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>);
      mockReadFile('content');

      await updateGitStateHash();

      // Change the state
      mockReadFile('different content');

      // Should be broken
      expect(await repoIntact()).toBe(false);

      // Clear the hash
      clearGitStateHash();

      // Should be OK again (no hash to compare against)
      expect(await repoIntact()).toBe(true);
    });
  });

  describe('updateGitStateHash', () => {
    it('handles nested directories recursively', async () => {
      // Setup: .git contains a directory 'refs' with a file 'heads'
      vi.mocked(fs.promises.readdir)
        .mockResolvedValueOnce(['HEAD', 'refs'] as unknown as string[])
        .mockResolvedValueOnce(['heads'] as unknown as string[]);
      vi.mocked(fs.promises.stat)
        .mockResolvedValueOnce({ isDirectory: () => false } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>) // HEAD
        .mockResolvedValueOnce({ isDirectory: () => true } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>)  // refs
        .mockResolvedValueOnce({ isDirectory: () => false } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>); // refs/heads
      mockReadFile('content');

      // Should not throw
      await expect(updateGitStateHash()).resolves.not.toThrow();

      // Verify recursive traversal
      expect(fs.promises.readdir).toHaveBeenCalledTimes(2);
    });

    it('handles errors gracefully', async () => {
      vi.mocked(fs.promises.readdir).mockRejectedValue(new Error('ENOENT'));

      // Should not throw, just result in empty hash
      await expect(updateGitStateHash()).resolves.not.toThrow();
    });
  });

  describe('withHashUpdate', () => {
    it('updates hash when operation changes state', async () => {
      // Setup initial state
      vi.mocked(fs.promises.readdir).mockResolvedValue(['HEAD'] as unknown as string[]);
      vi.mocked(fs.promises.stat).mockResolvedValue({ isDirectory: () => false } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>);
      mockReadFile('initial');

      // Store initial hash
      await updateGitStateHash();

      // Setup: operation will change state (mock returns different content after)
      let callCount = 0;
      mockReadFileImpl(async () => {
        callCount++;
        // First two calls are for hashBefore (collecting files),
        // subsequent calls are for hashAfter with changed content
        return callCount <= 1 ? 'initial' : 'changed';
      });

      // Run operation that changes state
      await withHashUpdate(async () => {});

      // Reset mock to return the new state
      mockReadFile('changed');

      // Hash should be updated to new state
      expect(await repoIntact()).toBe(true);
    });

    it('does not update hash when operation is a no-op', async () => {
      // Setup initial state
      vi.mocked(fs.promises.readdir).mockResolvedValue(['HEAD'] as unknown as string[]);
      vi.mocked(fs.promises.stat).mockResolvedValue({ isDirectory: () => false } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>);
      mockReadFile('initial');

      // Store initial hash
      await updateGitStateHash();

      // Simulate external corruption
      mockReadFile('corrupted');

      // Run no-op operation (state before === state after within the operation)
      // The corruption happened before the operation, so hashBefore and hashAfter
      // will both be 'corrupted' - no change during the operation
      await withHashUpdate(async () => {});

      // Hash should NOT be updated because operation didn't change anything
      // The stored hash is still 'initial', current state is 'corrupted'
      expect(await repoIntact()).toBe(false);
    });

    it('returns the operation result', async () => {
      vi.mocked(fs.promises.readdir).mockResolvedValue(['HEAD'] as unknown as string[]);
      vi.mocked(fs.promises.stat).mockResolvedValue({ isDirectory: () => false } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>);
      mockReadFile('content');

      const result = await withHashUpdate(async () => 'test-result');
      expect(result).toBe('test-result');
    });

    it('propagates operation errors', async () => {
      vi.mocked(fs.promises.readdir).mockResolvedValue(['HEAD'] as unknown as string[]);
      vi.mocked(fs.promises.stat).mockResolvedValue({ isDirectory: () => false } as unknown as Awaited<ReturnType<typeof fs.promises.stat>>);
      mockReadFile('content');

      await expect(withHashUpdate(async () => {
        throw new Error('operation failed');
      })).rejects.toThrow('operation failed');
    });
  });
});
