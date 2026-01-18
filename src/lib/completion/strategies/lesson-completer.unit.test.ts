import { describe, it, expect, beforeEach } from 'vitest';
import { LessonCompleter } from './lesson-completer';
import type { CompletionContext } from '../types';
import type { Exercise } from '../../../types/lesson';

function createContext(overrides: Partial<CompletionContext>): CompletionContext {
  return {
    line: '',
    lineUpToCursor: '',
    cursorPos: 0,
    parts: [],
    cmd: '',
    endsWithSpace: false,
    ...overrides,
  };
}

function createExercise(hint: string): Exercise {
  return {
    id: 'test-exercise',
    instruction: 'Test instruction',
    hint,
    validate: async () => true,
    successMessage: 'Success!',
  };
}

describe('LessonCompleter', () => {
  let completer: LessonCompleter;

  beforeEach(() => {
    completer = new LessonCompleter();
  });

  describe('canHandle', () => {
    it('returns false when no exercise is set', () => {
      const context = createContext({ cmd: 'git', parts: ['git', ''], endsWithSpace: true });
      expect(completer.canHandle(context)).toBe(false);
    });

    it('returns false when exercise has no hint', () => {
      completer.setExercise({ ...createExercise(''), hint: undefined });
      const context = createContext({ cmd: 'git', parts: ['git', ''], endsWithSpace: true });
      expect(completer.canHandle(context)).toBe(false);
    });

    it('returns false when command does not match hint', () => {
      completer.setExercise(createExercise('Type: git init'));
      const context = createContext({ cmd: 'touch', parts: ['touch', ''], endsWithSpace: true });
      expect(completer.canHandle(context)).toBe(false);
    });

    it('returns true when command matches and ends with space', () => {
      completer.setExercise(createExercise('Type: git init'));
      const context = createContext({ cmd: 'git', parts: ['git', ''], endsWithSpace: true });
      expect(completer.canHandle(context)).toBe(true);
    });

    it('returns true when command matches and typing partial arg', () => {
      completer.setExercise(createExercise('Type: git init'));
      const context = createContext({ cmd: 'git', parts: ['git', 'in'], endsWithSpace: false });
      expect(completer.canHandle(context)).toBe(true);
    });

    it('returns false when full command typed without space', () => {
      completer.setExercise(createExercise('Type: git init'));
      const context = createContext({ cmd: 'git', parts: ['git'], endsWithSpace: false });
      expect(completer.canHandle(context)).toBe(false);
    });

    it('returns true when typing partial command that matches hint', () => {
      completer.setExercise(createExercise('Type: touch README.md'));
      const context = createContext({ cmd: 't', parts: ['t'], endsWithSpace: false });
      expect(completer.canHandle(context)).toBe(true);
    });

    it('returns false when partial command does not match hint', () => {
      completer.setExercise(createExercise('Type: touch README.md'));
      const context = createContext({ cmd: 'g', parts: ['g'], endsWithSpace: false });
      expect(completer.canHandle(context)).toBe(false);
    });
  });

  describe('complete', () => {
    it('suggests command from hint when typing partial match', async () => {
      completer.setExercise(createExercise('Type: touch README.md'));
      const context = createContext({
        line: 't',
        lineUpToCursor: 't',
        cursorPos: 1,
        cmd: 't',
        parts: ['t'],
        endsWithSpace: false,
      });

      const result = await completer.complete(context);
      expect(result.suggestions).toEqual(['touch']);
      expect(result.replaceFrom).toBe(0);
      expect(result.replaceTo).toBe(1);
    });

    it('suggests first argument when command followed by space', async () => {
      completer.setExercise(createExercise('Type: touch README.md'));
      const context = createContext({
        line: 'touch ',
        lineUpToCursor: 'touch ',
        cursorPos: 6,
        cmd: 'touch',
        parts: ['touch', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);
      expect(result.suggestions).toEqual(['README.md']);
    });

    it('suggests argument matching partial input', async () => {
      completer.setExercise(createExercise('Type: touch README.md'));
      const context = createContext({
        line: 'touch RE',
        lineUpToCursor: 'touch RE',
        cursorPos: 8,
        cmd: 'touch',
        parts: ['touch', 'RE'],
        endsWithSpace: false,
      });

      const result = await completer.complete(context);
      expect(result.suggestions).toEqual(['README.md']);
    });

    it('returns empty when partial does not match', async () => {
      completer.setExercise(createExercise('Type: touch README.md'));
      const context = createContext({
        line: 'touch foo',
        lineUpToCursor: 'touch foo',
        cursorPos: 9,
        cmd: 'touch',
        parts: ['touch', 'foo'],
        endsWithSpace: false,
      });

      const result = await completer.complete(context);
      expect(result.suggestions).toEqual([]);
    });

    it('suggests second argument at correct position', async () => {
      completer.setExercise(createExercise('Type: git commit -m "Add README"'));
      const context = createContext({
        line: 'git commit ',
        lineUpToCursor: 'git commit ',
        cursorPos: 11,
        cmd: 'git',
        parts: ['git', 'commit', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);
      expect(result.suggestions).toEqual(['-m']);
    });

    it('suggests third argument (quoted string) at correct position', async () => {
      completer.setExercise(createExercise('Type: git commit -m "Add README"'));
      const context = createContext({
        line: 'git commit -m ',
        lineUpToCursor: 'git commit -m ',
        cursorPos: 14,
        cmd: 'git',
        parts: ['git', 'commit', '-m', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);
      expect(result.suggestions).toEqual(['"Add README"']);
    });

    it('returns empty when argument index exceeds hint args', async () => {
      completer.setExercise(createExercise('Type: git init'));
      const context = createContext({
        line: 'git init ',
        lineUpToCursor: 'git init ',
        cursorPos: 9,
        cmd: 'git',
        parts: ['git', 'init', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);
      expect(result.suggestions).toEqual([]);
    });

    it('handles multiple files in hint', async () => {
      completer.setExercise(createExercise('Type: touch index.html style.css'));
      const context = createContext({
        line: 'touch ',
        lineUpToCursor: 'touch ',
        cursorPos: 6,
        cmd: 'touch',
        parts: ['touch', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);
      expect(result.suggestions).toEqual(['index.html']);
    });

    it('suggests second file at correct position', async () => {
      completer.setExercise(createExercise('Type: touch index.html style.css'));
      const context = createContext({
        line: 'touch index.html ',
        lineUpToCursor: 'touch index.html ',
        cursorPos: 17,
        cmd: 'touch',
        parts: ['touch', 'index.html', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);
      expect(result.suggestions).toEqual(['style.css']);
    });

    it('sets correct replaceFrom for trailing space', async () => {
      completer.setExercise(createExercise('Type: touch README.md'));
      const context = createContext({
        line: 'touch ',
        lineUpToCursor: 'touch ',
        cursorPos: 6,
        cmd: 'touch',
        parts: ['touch', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);
      expect(result.replaceFrom).toBe(6);
    });

    it('sets correct replaceFrom for partial input', async () => {
      completer.setExercise(createExercise('Type: touch README.md'));
      const context = createContext({
        line: 'touch RE',
        lineUpToCursor: 'touch RE',
        cursorPos: 8,
        cmd: 'touch',
        parts: ['touch', 'RE'],
        endsWithSpace: false,
      });

      const result = await completer.complete(context);
      expect(result.replaceFrom).toBe(6); // Position of 'RE'
    });
  });

  describe('parseHint (via complete)', () => {
    it('handles hint without Type: prefix', async () => {
      completer.setExercise(createExercise('git init'));
      const context = createContext({
        line: 'git ',
        lineUpToCursor: 'git ',
        cursorPos: 4,
        cmd: 'git',
        parts: ['git', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);
      expect(result.suggestions).toEqual(['init']);
    });

    it('handles quoted strings in hint', async () => {
      completer.setExercise(createExercise('Type: echo "Hello World" > file.txt'));
      const context = createContext({
        line: 'echo ',
        lineUpToCursor: 'echo ',
        cursorPos: 5,
        cmd: 'echo',
        parts: ['echo', ''],
        endsWithSpace: true,
      });

      const result = await completer.complete(context);
      expect(result.suggestions).toEqual(['"Hello World"']);
    });

    it('strips parenthetical comments from hint', async () => {
      completer.setExercise(createExercise('Type: echo "# My Project" > README.md (or use the editor)'));
      const context = createContext({
        line: 'echo "# My Project" > README.md',
        lineUpToCursor: 'echo "# My Project" > README.md',
        cursorPos: 31,
        cmd: 'echo',
        parts: ['echo', '"# My Project"', '>', 'README.md'],
        endsWithSpace: false,
      });

      // Should not suggest anything after the complete command
      const result = await completer.complete(context);
      expect(result.suggestions).toEqual([]);
    });

    it('does not suggest parenthetical text as argument', async () => {
      completer.setExercise(createExercise('Type: echo "# My Project" > README.md (or use the editor)'));
      const context = createContext({
        line: 'echo "# My Project" > README.md ',
        lineUpToCursor: 'echo "# My Project" > README.md ',
        cursorPos: 32,
        cmd: 'echo',
        parts: ['echo', '"# My Project"', '>', 'README.md', ''],
        endsWithSpace: true,
      });

      // Should not suggest "(or" or any part of the parenthetical comment
      const result = await completer.complete(context);
      expect(result.suggestions).toEqual([]);
    });
  });
});
