/**
 * Unit tests for the command registry.
 *
 * These tests verify that:
 * 1. Commands register themselves correctly when modules are imported
 * 2. Query functions return expected results from the populated registry
 *
 * No I/O operations (fs, git) - just in-memory registry operations.
 */

import { describe, it, expect } from 'vitest';

// Import commands module to trigger registration
import './index';

import {
  getCommand,
  getAllCommands,
  getCommandNames,
  getCommandsByCategory,
  getGitSubcommandNames,
  hasCommand,
} from './registry';

describe('Command Registry', () => {
  describe('command registration', () => {
    it('registers file commands', () => {
      const fileCommands = getCommandsByCategory('file');
      const names = fileCommands.map(c => c.name);

      expect(names).toContain('ls');
      expect(names).toContain('cat');
      expect(names).toContain('touch');
      expect(names).toContain('mkdir');
      expect(names).toContain('rm');
      expect(names).toContain('head');
      expect(names).toContain('tail');
    });

    it('registers git command', () => {
      const gitCommands = getCommandsByCategory('git');
      expect(gitCommands).toHaveLength(1);
      expect(gitCommands[0].name).toBe('git');
    });

    it('registers shell commands', () => {
      const shellCommands = getCommandsByCategory('shell');
      const names = shellCommands.map(c => c.name);

      expect(names).toContain('echo');
      expect(names).toContain('pwd');
      expect(names).toContain('help');
      expect(names).toContain('clear');
      expect(names).toContain('reset');
    });

    it('registers git subcommands', () => {
      const subcommands = getGitSubcommandNames();

      expect(subcommands).toContain('init');
      expect(subcommands).toContain('add');
      expect(subcommands).toContain('commit');
      expect(subcommands).toContain('status');
      expect(subcommands).toContain('log');
      expect(subcommands).toContain('branch');
      expect(subcommands).toContain('checkout');
    });
  });

  describe('getCommand', () => {
    it('returns command definition for registered command', () => {
      const git = getCommand('git');

      expect(git).toBeDefined();
      expect(git?.name).toBe('git');
      expect(git?.category).toBe('git');
      expect(typeof git?.handler).toBe('function');
    });

    it('returns undefined for unregistered command', () => {
      expect(getCommand('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllCommands', () => {
    it('returns all registered commands', () => {
      const commands = getAllCommands();

      expect(commands.length).toBeGreaterThan(0);
      expect(commands.some(c => c.name === 'git')).toBe(true);
      expect(commands.some(c => c.name === 'ls')).toBe(true);
      expect(commands.some(c => c.name === 'echo')).toBe(true);
    });
  });

  describe('getCommandNames', () => {
    it('returns array of command names', () => {
      const names = getCommandNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names).toContain('git');
      expect(names).toContain('ls');
      expect(names).toContain('echo');
    });
  });

  describe('hasCommand', () => {
    it('returns true for registered commands', () => {
      expect(hasCommand('git')).toBe(true);
      expect(hasCommand('ls')).toBe(true);
      expect(hasCommand('help')).toBe(true);
    });

    it('returns false for unregistered commands', () => {
      expect(hasCommand('nonexistent')).toBe(false);
      expect(hasCommand('')).toBe(false);
    });
  });

  describe('command metadata', () => {
    it('all commands have required fields', () => {
      const commands = getAllCommands();

      for (const cmd of commands) {
        expect(cmd.name).toBeTruthy();
        expect(cmd.description).toBeTruthy();
        expect(typeof cmd.handler).toBe('function');
        expect(['file', 'git', 'shell']).toContain(cmd.category);
      }
    });
  });
});
