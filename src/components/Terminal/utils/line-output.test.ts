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
});
