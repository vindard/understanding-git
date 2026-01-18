/**
 * Integration tests for shell commands with real filesystem.
 * Tests boundary behavior (actual fs operations).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { executeCommand } from './index';
import * as fsLib from '../fs';
import { CWD } from '../config';

describe('Shell Commands Integration', () => {
  beforeEach(async () => {
    await fsLib.resetFs();
  });

  describe('ls command', () => {
    it('lists files in current directory', async () => {
      await fsLib.writeFile(`${CWD}/file1.txt`, 'content');
      await fsLib.writeFile(`${CWD}/file2.txt`, 'content');

      const result = await executeCommand('ls');

      expect(result.success).toBe(true);
      expect(result.output).toContain('file1.txt');
      expect(result.output).toContain('file2.txt');
    });

    it('lists files in specified directory', async () => {
      await fsLib.mkdir(`${CWD}/subdir`);
      await fsLib.writeFile(`${CWD}/subdir/nested.txt`, 'content');

      const result = await executeCommand('ls subdir');

      expect(result.success).toBe(true);
      expect(result.output).toContain('nested.txt');
    });
  });

  describe('cat command', () => {
    it('displays file contents', async () => {
      await fsLib.writeFile(`${CWD}/test.txt`, 'Hello World');

      const result = await executeCommand('cat test.txt');

      expect(result.success).toBe(true);
      expect(result.output).toBe('Hello World');
    });

    it('returns error for missing file operand', async () => {
      const result = await executeCommand('cat');

      expect(result.success).toBe(false);
      expect(result.output).toContain('missing file operand');
    });
  });

  describe('head command', () => {
    it('displays first 10 lines by default', async () => {
      const content = Array.from({ length: 15 }, (_, i) => `line${i + 1}`).join('\n');
      await fsLib.writeFile(`${CWD}/test.txt`, content);

      const result = await executeCommand('head test.txt');

      expect(result.success).toBe(true);
      const lines = result.output.split('\n');
      expect(lines).toHaveLength(10);
      expect(lines[0]).toBe('line1');
      expect(lines[9]).toBe('line10');
    });

    it('respects -n option', async () => {
      const content = Array.from({ length: 10 }, (_, i) => `line${i + 1}`).join('\n');
      await fsLib.writeFile(`${CWD}/test.txt`, content);

      const result = await executeCommand('head -n 3 test.txt');

      expect(result.success).toBe(true);
      const lines = result.output.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[2]).toBe('line3');
    });

    it('returns error for missing file', async () => {
      const result = await executeCommand('head nonexistent.txt');

      expect(result.success).toBe(false);
      expect(result.output).toContain('No such file');
    });
  });

  describe('tail command', () => {
    it('displays last 10 lines by default', async () => {
      const content = Array.from({ length: 15 }, (_, i) => `line${i + 1}`).join('\n');
      await fsLib.writeFile(`${CWD}/test.txt`, content);

      const result = await executeCommand('tail test.txt');

      expect(result.success).toBe(true);
      const lines = result.output.split('\n');
      expect(lines).toHaveLength(10);
      expect(lines[0]).toBe('line6');
      expect(lines[9]).toBe('line15');
    });

    it('respects -n option', async () => {
      const content = Array.from({ length: 10 }, (_, i) => `line${i + 1}`).join('\n');
      await fsLib.writeFile(`${CWD}/test.txt`, content);

      const result = await executeCommand('tail -n 3 test.txt');

      expect(result.success).toBe(true);
      const lines = result.output.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('line8');
    });

    it('returns error for missing file', async () => {
      const result = await executeCommand('tail nonexistent.txt');

      expect(result.success).toBe(false);
      expect(result.output).toContain('No such file');
    });
  });

  describe('mkdir command', () => {
    it('creates a directory', async () => {
      const result = await executeCommand('mkdir newdir');

      expect(result.success).toBe(true);
      const stats = await fsLib.stat(`${CWD}/newdir`);
      expect(stats.type).toBe('dir');
    });

    it('returns error for missing operand', async () => {
      const result = await executeCommand('mkdir');

      expect(result.success).toBe(false);
      expect(result.output).toContain('missing operand');
    });
  });

  describe('rm command', () => {
    it('removes a file', async () => {
      await fsLib.writeFile(`${CWD}/todelete.txt`, 'content');

      const result = await executeCommand('rm todelete.txt');

      expect(result.success).toBe(true);
      await expect(fsLib.stat(`${CWD}/todelete.txt`)).rejects.toThrow();
    });

    it('refuses to remove directory without -r flag', async () => {
      await fsLib.mkdir(`${CWD}/mydir`);

      const result = await executeCommand('rm mydir');

      expect(result.success).toBe(false);
      expect(result.output).toContain('Is a directory');
    });

    it('removes directory with -r flag', async () => {
      await fsLib.mkdir(`${CWD}/mydir`);
      await fsLib.writeFile(`${CWD}/mydir/file.txt`, 'content');

      const result = await executeCommand('rm -r mydir');

      expect(result.success).toBe(true);
      await expect(fsLib.stat(`${CWD}/mydir`)).rejects.toThrow();
    });

    it('removes directory with -rf flag', async () => {
      await fsLib.mkdir(`${CWD}/mydir`);

      const result = await executeCommand('rm -rf mydir');

      expect(result.success).toBe(true);
      await expect(fsLib.stat(`${CWD}/mydir`)).rejects.toThrow();
    });
  });

  describe('echo command', () => {
    it('outputs text', async () => {
      const result = await executeCommand('echo hello world');

      expect(result.success).toBe(true);
      expect(result.output).toBe('hello world');
    });

    it('writes to file with > redirect', async () => {
      await executeCommand('echo "test content" > output.txt');

      const content = await fsLib.readFile(`${CWD}/output.txt`);
      expect(content).toBe('test content');
    });

    it('appends to file with >> redirect', async () => {
      await fsLib.writeFile(`${CWD}/output.txt`, 'line1\n');

      await executeCommand('echo "line2" >> output.txt');

      const content = await fsLib.readFile(`${CWD}/output.txt`);
      expect(content).toBe('line1\nline2');
    });
  });

  describe('pwd command', () => {
    it('returns current working directory', async () => {
      const result = await executeCommand('pwd');

      expect(result.success).toBe(true);
      expect(result.output).toBe(CWD);
    });
  });

  describe('help command', () => {
    it('returns help text', async () => {
      const result = await executeCommand('help');

      expect(result.success).toBe(true);
      expect(result.output).toContain('File commands');
      expect(result.output).toContain('Git commands');
    });
  });

  describe('clear command', () => {
    it('returns clear escape sequence', async () => {
      const result = await executeCommand('clear');

      expect(result.success).toBe(true);
      expect(result.output).toContain('\x1b[2J');
    });
  });

  describe('edge cases', () => {
    it('returns error for unknown command', async () => {
      const result = await executeCommand('unknowncmd');

      expect(result.success).toBe(false);
      expect(result.output).toContain('Command not found');
    });
  });
});
