/**
 * Integration tests for filesystem operations.
 * Tests file read/write operations used by the editor.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetFs, readFile, writeFile, readdir } from './fs';
import { CWD } from './config';

describe('Filesystem Integration', () => {
  beforeEach(async () => {
    await resetFs();
  });

  describe('writeFile and readFile', () => {
    it('writes and reads file content', async () => {
      const content = 'Hello, World!';
      const path = `${CWD}/test.txt`;

      await writeFile(path, content);
      const result = await readFile(path);

      expect(result).toBe(content);
    });

    it('overwrites existing file content', async () => {
      const path = `${CWD}/test.txt`;

      await writeFile(path, 'original content');
      await writeFile(path, 'updated content');
      const result = await readFile(path);

      expect(result).toBe('updated content');
    });

    it('handles multiline content', async () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const path = `${CWD}/multiline.txt`;

      await writeFile(path, content);
      const result = await readFile(path);

      expect(result).toBe(content);
    });

    it('handles empty content', async () => {
      const path = `${CWD}/empty.txt`;

      await writeFile(path, '');
      const result = await readFile(path);

      expect(result).toBe('');
    });

    it('handles unicode content', async () => {
      const content = 'Hello 世界 🌍';
      const path = `${CWD}/unicode.txt`;

      await writeFile(path, content);
      const result = await readFile(path);

      expect(result).toBe(content);
    });

    it('file appears in directory listing after write', async () => {
      const path = `${CWD}/newfile.txt`;

      await writeFile(path, 'content');
      const files = await readdir(CWD);

      expect(files).toContain('newfile.txt');
    });
  });

  describe('editor save workflow', () => {
    it('simulates file edit and save cycle', async () => {
      const path = `${CWD}/README.md`;

      // Create initial file
      await writeFile(path, '# Initial Title');
      let content = await readFile(path);
      expect(content).toBe('# Initial Title');

      // "Edit" the file (simulate user typing)
      const editedContent = '# Updated Title\n\nSome new content.';

      // "Save" the file
      await writeFile(path, editedContent);

      // Verify saved content
      content = await readFile(path);
      expect(content).toBe(editedContent);
    });

    it('preserves file after multiple edits', async () => {
      const path = `${CWD}/document.md`;

      // Create and save multiple times
      await writeFile(path, 'Version 1');
      await writeFile(path, 'Version 2');
      await writeFile(path, 'Version 3');

      const content = await readFile(path);
      expect(content).toBe('Version 3');
    });
  });
});
