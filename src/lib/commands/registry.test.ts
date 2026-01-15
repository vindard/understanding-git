import { describe, it, expect, vi } from 'vitest';

// Mock fs module to avoid IndexedDB errors in test environment
vi.mock('../fs', () => ({
  resetFs: vi.fn(),
}));

// Import the commands module to trigger command registration
// This must happen before importing from registry
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
  describe('getCommand', () => {
    it('returns command definition for registered commands', () => {
      const gitCmd = getCommand('git');
      expect(gitCmd).toBeDefined();
      expect(gitCmd?.name).toBe('git');
      expect(gitCmd?.category).toBe('git');
      expect(typeof gitCmd?.handler).toBe('function');
    });

    it('returns undefined for unregistered commands', () => {
      const unknown = getCommand('nonexistent');
      expect(unknown).toBeUndefined();
    });
  });

  describe('getAllCommands', () => {
    it('returns all registered commands', () => {
      const commands = getAllCommands();
      expect(commands.length).toBeGreaterThan(0);

      // Check that essential commands are registered
      const names = commands.map(c => c.name);
      expect(names).toContain('git');
      expect(names).toContain('ls');
      expect(names).toContain('cat');
      expect(names).toContain('help');
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

  describe('getCommandsByCategory', () => {
    it('returns file commands', () => {
      const fileCommands = getCommandsByCategory('file');
      expect(fileCommands.length).toBeGreaterThan(0);

      const names = fileCommands.map(c => c.name);
      expect(names).toContain('ls');
      expect(names).toContain('cat');
      expect(names).toContain('touch');
      expect(names).toContain('mkdir');
      expect(names).toContain('rm');
    });

    it('returns git commands', () => {
      const gitCommands = getCommandsByCategory('git');
      expect(gitCommands.length).toBe(1);
      expect(gitCommands[0].name).toBe('git');
    });

    it('returns shell commands', () => {
      const shellCommands = getCommandsByCategory('shell');
      expect(shellCommands.length).toBeGreaterThan(0);

      const names = shellCommands.map(c => c.name);
      expect(names).toContain('echo');
      expect(names).toContain('pwd');
      expect(names).toContain('help');
      expect(names).toContain('clear');
      expect(names).toContain('reset');
    });
  });

  describe('getGitSubcommandNames', () => {
    it('returns git subcommand names for completion', () => {
      const subcommands = getGitSubcommandNames();
      expect(Array.isArray(subcommands)).toBe(true);
      expect(subcommands).toContain('init');
      expect(subcommands).toContain('add');
      expect(subcommands).toContain('commit');
      expect(subcommands).toContain('status');
      expect(subcommands).toContain('log');
      expect(subcommands).toContain('branch');
      expect(subcommands).toContain('checkout');
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
