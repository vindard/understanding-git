import type { CommandHandler } from './types';

/**
 * Command Registry - Central registration point for all shell commands.
 *
 * This module implements the Registry Pattern, which provides:
 * - Single source of truth for available commands
 * - Self-documenting commands (metadata lives with handler)
 * - Extensibility (new commands register themselves)
 * - Decoupling (consumers don't need to know about command implementations)
 *
 * The pattern eliminates the need for:
 * - Switch statements that must be updated for each new command
 * - Duplicated command lists across different modules
 * - Manual synchronization of command names between help text and handlers
 */

export type CommandCategory = 'file' | 'git' | 'shell';

export interface CommandDefinition {
  name: string;
  description: string;
  usage?: string;  // e.g., "<file>" or "[name]"
  handler: CommandHandler;
  category: CommandCategory;
}

interface GitSubcommandDefinition {
  name: string;
  description: string;
  usage?: string;
}

// Internal storage
const commandRegistry = new Map<string, CommandDefinition>();
const gitSubcommands: GitSubcommandDefinition[] = [];

/**
 * Register a command with the registry.
 * Commands should call this during module initialization.
 */
export function registerCommand(definition: CommandDefinition): void {
  if (commandRegistry.has(definition.name)) {
    console.warn(`Command '${definition.name}' is already registered. Overwriting.`);
  }
  commandRegistry.set(definition.name, definition);
}

/**
 * Register a git subcommand for documentation and completion purposes.
 */
export function registerGitSubcommand(subcommand: GitSubcommandDefinition): void {
  const existing = gitSubcommands.find(s => s.name === subcommand.name);
  if (!existing) {
    gitSubcommands.push(subcommand);
  }
}

/**
 * Get a command by name.
 */
export function getCommand(name: string): CommandDefinition | undefined {
  return commandRegistry.get(name);
}

/**
 * Get all registered commands.
 */
export function getAllCommands(): CommandDefinition[] {
  return Array.from(commandRegistry.values());
}

/**
 * Get all command names (for completion).
 */
export function getCommandNames(): string[] {
  return Array.from(commandRegistry.keys());
}

/**
 * Get commands filtered by category.
 */
export function getCommandsByCategory(category: CommandCategory): CommandDefinition[] {
  return getAllCommands().filter(cmd => cmd.category === category);
}

/**
 * Get all git subcommand names (for completion).
 */
export function getGitSubcommandNames(): string[] {
  return gitSubcommands.map(s => s.name);
}

/**
 * Get all git subcommands with their metadata.
 */
export function getGitSubcommands(): GitSubcommandDefinition[] {
  return [...gitSubcommands];
}

/**
 * Check if a command exists.
 */
export function hasCommand(name: string): boolean {
  return commandRegistry.has(name);
}
