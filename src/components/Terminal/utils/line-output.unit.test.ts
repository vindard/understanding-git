import { describe, it, expect } from 'vitest';
import { buildLineOutput } from './line-output';

describe('buildLineOutput', () => {
  it('should not produce excessive spaces that could clear terminal', () => {
    // When prevLineLength is much larger than current line,
    // we should NOT pad with that many spaces
    const result = buildLineOutput('ls', 2, 100);
    expect(result.output).not.toContain(' '.repeat(50));
  });

  it('should use ANSI escape to clear line instead of space padding', () => {
    const result = buildLineOutput('test', 4, 10);
    // Should use \x1b[2K (clear entire line) instead of spaces
    expect(result.output).toContain('\x1b[2K');
  });

  it('should position cursor correctly when not at end of line', () => {
    // Cursor at position 2 in "test" (4 chars) should move back 2
    const result = buildLineOutput('test', 2, 0);
    expect(result.output).toContain('\x1b[2D');
  });

  it('should not add cursor movement when cursor is at end', () => {
    const result = buildLineOutput('test', 4, 0);
    // Should not contain cursor left movement (e.g., \x1b[2D)
    // eslint-disable-next-line no-control-regex
    expect(result.output).not.toMatch(/\x1b\[\d+D/);
    // But should still contain the line content
    expect(result.output).toContain('test');
  });

  it('should include prompt in output', () => {
    const result = buildLineOutput('hello', 5, 0);
    expect(result.output).toContain('$ hello');
  });

  it('should return new prevLineLength equal to current line length', () => {
    const result = buildLineOutput('hello', 5, 100);
    expect(result.newPrevLength).toBe(5);
  });

  describe('ghost text', () => {
    it('should render ghost text in dim mode after current line', () => {
      const result = buildLineOutput('gi', 2, 0, 't');
      // Ghost text should be wrapped in dim escape codes
      expect(result.output).toContain('\x1b[2mt\x1b[0m');
    });

    it('should position cursor before ghost text', () => {
      // "gi" with cursor at end (2), ghost text "t" (1 char)
      // Total length = 3, cursor at 2, so move back 1
      const result = buildLineOutput('gi', 2, 0, 't');
      expect(result.output).toContain('\x1b[1D');
    });

    it('should include ghost text length in newPrevLength', () => {
      const result = buildLineOutput('gi', 2, 0, 't');
      expect(result.newPrevLength).toBe(3); // 2 (line) + 1 (ghost)
    });

    it('should handle empty ghost text', () => {
      const result = buildLineOutput('git', 3, 0, '');
      expect(result.output).toContain('$ git');
      // No dim escape codes when ghost is empty
      expect(result.output).not.toContain('\x1b[2m');
    });

    it('should handle multi-character ghost text', () => {
      // User typed "git i", ghost suggests "nit" for "init"
      const result = buildLineOutput('git i', 5, 0, 'nit');
      expect(result.output).toContain('\x1b[2mnit\x1b[0m');
      // Total 8 chars, cursor at 5, move back 3
      expect(result.output).toContain('\x1b[3D');
      expect(result.newPrevLength).toBe(8);
    });

    it('should position cursor correctly when cursor is mid-line with ghost text', () => {
      // User typed "test", cursor at position 2, ghost text "ing"
      // Line: "test" + ghost "ing" = display "testing" but cursor at 2
      // Total length = 7, cursor at 2, move back 5
      const result = buildLineOutput('test', 2, 0, 'ing');
      expect(result.output).toContain('\x1b[5D');
    });
  });
});
