import { describe, it, expect } from 'vitest';
import {
  djb2Hash,
  createStateString,
  shouldUpdateStoredHash,
  checkIntegrity,
} from './gitStateHash';

describe('gitStateHash pure functions', () => {
  describe('djb2Hash', () => {
    it('returns consistent hash for same input', () => {
      const hash1 = djb2Hash('hello world');
      const hash2 = djb2Hash('hello world');
      expect(hash1).toBe(hash2);
    });

    it('returns different hash for different input', () => {
      const hash1 = djb2Hash('hello');
      const hash2 = djb2Hash('world');
      expect(hash1).not.toBe(hash2);
    });

    it('returns hex string', () => {
      const hash = djb2Hash('test');
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('handles empty string', () => {
      const hash = djb2Hash('');
      expect(hash).toBe('1505'); // djb2 initial value 5381 = 0x1505
    });

    it('handles unicode characters', () => {
      const hash = djb2Hash('hello 世界');
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('is sensitive to character order', () => {
      const hash1 = djb2Hash('ab');
      const hash2 = djb2Hash('ba');
      expect(hash1).not.toBe(hash2);
    });

    it('handles long strings', () => {
      const longString = 'a'.repeat(10000);
      const hash = djb2Hash(longString);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('createStateString', () => {
    it('creates string from file pairs', () => {
      const files: [string, string][] = [
        ['/path/to/file1', 'content1'],
        ['/path/to/file2', 'content2'],
      ];
      const result = createStateString(files);
      expect(result).toBe('/path/to/file1:content1\n/path/to/file2:content2');
    });

    it('handles empty array', () => {
      const result = createStateString([]);
      expect(result).toBe('');
    });

    it('handles single file', () => {
      const files: [string, string][] = [['/file', 'data']];
      const result = createStateString(files);
      expect(result).toBe('/file:data');
    });

    it('preserves file content with special characters', () => {
      const files: [string, string][] = [
        ['/file', 'line1\nline2\ttab'],
      ];
      const result = createStateString(files);
      expect(result).toBe('/file:line1\nline2\ttab');
    });

    it('maintains order of input files', () => {
      const files: [string, string][] = [
        ['/z', '1'],
        ['/a', '2'],
      ];
      const result = createStateString(files);
      expect(result).toBe('/z:1\n/a:2');
    });
  });

  describe('shouldUpdateStoredHash', () => {
    it('returns true when hashes differ', () => {
      expect(shouldUpdateStoredHash('abc123', 'def456')).toBe(true);
    });

    it('returns false when hashes match', () => {
      expect(shouldUpdateStoredHash('abc123', 'abc123')).toBe(false);
    });

    it('returns false for empty matching hashes', () => {
      expect(shouldUpdateStoredHash('', '')).toBe(false);
    });

    it('returns true when one is empty', () => {
      expect(shouldUpdateStoredHash('abc', '')).toBe(true);
      expect(shouldUpdateStoredHash('', 'abc')).toBe(true);
    });
  });

  describe('checkIntegrity', () => {
    it('returns true when stored hash is null (pre-init)', () => {
      expect(checkIntegrity(null, 'any-hash')).toBe(true);
    });

    it('returns true when hashes match', () => {
      expect(checkIntegrity('abc123', 'abc123')).toBe(true);
    });

    it('returns false when hashes differ', () => {
      expect(checkIntegrity('abc123', 'def456')).toBe(false);
    });

    it('returns false when stored hash exists but current is empty', () => {
      expect(checkIntegrity('abc123', '')).toBe(false);
    });

    it('returns true when both stored and current are empty strings', () => {
      expect(checkIntegrity('', '')).toBe(true);
    });
  });

  describe('integration: hash pipeline', () => {
    it('produces consistent hash from files through pipeline', () => {
      const files: [string, string][] = [
        ['/repo/.git/HEAD', 'ref: refs/heads/main'],
        ['/repo/.git/config', '[core]\nbare = false'],
      ];

      const stateString = createStateString(files);
      const hash1 = djb2Hash(stateString);
      const hash2 = djb2Hash(stateString);

      expect(hash1).toBe(hash2);
    });

    it('produces different hash when file content changes', () => {
      const files1: [string, string][] = [
        ['/repo/.git/HEAD', 'ref: refs/heads/main'],
      ];
      const files2: [string, string][] = [
        ['/repo/.git/HEAD', 'ref: refs/heads/feature'],
      ];

      const hash1 = djb2Hash(createStateString(files1));
      const hash2 = djb2Hash(createStateString(files2));

      expect(hash1).not.toBe(hash2);
    });

    it('produces different hash when file is added', () => {
      const files1: [string, string][] = [
        ['/repo/.git/HEAD', 'content'],
      ];
      const files2: [string, string][] = [
        ['/repo/.git/HEAD', 'content'],
        ['/repo/.git/config', 'more'],
      ];

      const hash1 = djb2Hash(createStateString(files1));
      const hash2 = djb2Hash(createStateString(files2));

      expect(hash1).not.toBe(hash2);
    });

    it('integrity check works with hash pipeline', () => {
      const files: [string, string][] = [
        ['/repo/.git/HEAD', 'ref: refs/heads/main'],
      ];

      const storedHash = djb2Hash(createStateString(files));
      const currentHash = djb2Hash(createStateString(files));

      expect(checkIntegrity(storedHash, currentHash)).toBe(true);
    });

    it('integrity check detects tampering', () => {
      const originalFiles: [string, string][] = [
        ['/repo/.git/HEAD', 'ref: refs/heads/main'],
      ];
      const tamperedFiles: [string, string][] = [
        ['/repo/.git/HEAD', 'ref: refs/heads/hacked'],
      ];

      const storedHash = djb2Hash(createStateString(originalFiles));
      const currentHash = djb2Hash(createStateString(tamperedFiles));

      expect(checkIntegrity(storedHash, currentHash)).toBe(false);
    });
  });
});
