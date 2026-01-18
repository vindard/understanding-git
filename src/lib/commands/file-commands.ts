/**
 * File command handlers.
 * Service layer that uses fs operations.
 */

import * as fsLib from '../fs';
import { CWD } from '../config';
import { registerCommand } from './registry';
import {
  resolvePath,
  parseHeadTailArgs,
  getFirstNLines,
  getLastNLines,
  parseRmArgs,
} from './parsing';
import type { CommandResult } from './types';

async function handleLsCommand(args: string[]): Promise<CommandResult> {
  const path = args[0] ? resolvePath(args[0]) : CWD;
  const files = await fsLib.readdir(path);
  return { output: files.join('\n'), success: true };
}

async function handleCatCommand(args: string[]): Promise<CommandResult> {
  if (!args[0]) {
    return { output: 'cat: missing file operand', success: false };
  }
  const path = resolvePath(args[0]);
  const content = await fsLib.readFile(path);
  return { output: content, success: true };
}

async function handleTailCommand(args: string[]): Promise<CommandResult> {
  const { numLines, filePath } = parseHeadTailArgs(args);

  if (!filePath) {
    return { output: 'tail: missing file operand', success: false };
  }

  const path = resolvePath(filePath);
  try {
    const content = await fsLib.readFile(path);
    return { output: getLastNLines(content, numLines), success: true };
  } catch {
    return { output: `tail: cannot open '${filePath}': No such file or directory`, success: false };
  }
}

async function handleHeadCommand(args: string[]): Promise<CommandResult> {
  const { numLines, filePath } = parseHeadTailArgs(args);

  if (!filePath) {
    return { output: 'head: missing file operand', success: false };
  }

  const path = resolvePath(filePath);
  try {
    const content = await fsLib.readFile(path);
    return { output: getFirstNLines(content, numLines), success: true };
  } catch {
    return { output: `head: cannot open '${filePath}': No such file or directory`, success: false };
  }
}

async function handleMkdirCommand(args: string[]): Promise<CommandResult> {
  if (!args[0]) {
    return { output: 'mkdir: missing operand', success: false };
  }
  const path = resolvePath(args[0]);
  await fsLib.mkdir(path);
  return { output: '', success: true };
}

async function handleTouchCommand(args: string[]): Promise<CommandResult> {
  if (args.length === 0) {
    return { output: 'touch: missing file operand', success: false };
  }
  for (const arg of args) {
    const path = resolvePath(arg);
    try {
      await fsLib.readFile(path);
    } catch {
      await fsLib.writeFile(path, '');
    }
  }
  return { output: '', success: true };
}

async function handleRmCommand(args: string[]): Promise<CommandResult> {
  const { recursive, targets } = parseRmArgs(args);

  if (targets.length === 0) {
    return { output: 'rm: missing operand', success: false };
  }

  for (const target of targets) {
    const path = resolvePath(target);
    const stats = await fsLib.stat(path);

    if (stats.type === 'dir') {
      if (!recursive) {
        return { output: `rm: cannot remove '${target}': Is a directory`, success: false };
      }
      await removeRecursive(path);
    } else {
      await fsLib.unlink(path);
    }
  }

  return { output: '', success: true };
}

async function removeRecursive(path: string): Promise<void> {
  const entries = await fsLib.readdir(path);
  for (const entry of entries) {
    const fullPath = `${path}/${entry}`;
    const stats = await fsLib.stat(fullPath);
    if (stats.type === 'dir') {
      await removeRecursive(fullPath);
    } else {
      await fsLib.unlink(fullPath);
    }
  }
  await fsLib.rmdir(path);
}

// Register file commands
registerCommand({
  name: 'ls',
  description: 'List directory contents',
  handler: handleLsCommand,
  category: 'file',
});

registerCommand({
  name: 'cat',
  description: 'Display file contents',
  usage: '<file>',
  handler: handleCatCommand,
  category: 'file',
});

registerCommand({
  name: 'tail',
  description: 'Display last lines of a file',
  usage: '[-n <lines>] <file>',
  handler: handleTailCommand,
  category: 'file',
});

registerCommand({
  name: 'head',
  description: 'Display first lines of a file',
  usage: '[-n <lines>] <file>',
  handler: handleHeadCommand,
  category: 'file',
});

registerCommand({
  name: 'touch',
  description: 'Create an empty file',
  usage: '<file>',
  handler: handleTouchCommand,
  category: 'file',
});

registerCommand({
  name: 'mkdir',
  description: 'Create a directory',
  usage: '<dir>',
  handler: handleMkdirCommand,
  category: 'file',
});

registerCommand({
  name: 'rm',
  description: 'Remove a file',
  usage: '<file>',
  handler: handleRmCommand,
  category: 'file',
});
