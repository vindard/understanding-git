import * as fsLib from '../fs';
import { CWD } from '../config';
import type { CommandResult } from './types';

function resolvePath(path: string): string {
  if (path.startsWith('/')) {
    return path;
  }
  return `${CWD}/${path}`;
}

export async function handleLsCommand(args: string[]): Promise<CommandResult> {
  const path = args[0] ? resolvePath(args[0]) : CWD;
  const files = await fsLib.readdir(path);
  return { output: files.join('\n'), success: true };
}

export async function handleCatCommand(args: string[]): Promise<CommandResult> {
  if (!args[0]) {
    return { output: 'cat: missing file operand', success: false };
  }
  const path = resolvePath(args[0]);
  const content = await fsLib.readFile(path);
  return { output: content, success: true };
}

export async function handleMkdirCommand(args: string[]): Promise<CommandResult> {
  if (!args[0]) {
    return { output: 'mkdir: missing operand', success: false };
  }
  const path = resolvePath(args[0]);
  await fsLib.mkdir(path);
  return { output: '', success: true };
}

export async function handleTouchCommand(args: string[]): Promise<CommandResult> {
  if (!args[0]) {
    return { output: 'touch: missing file operand', success: false };
  }
  const path = resolvePath(args[0]);
  try {
    await fsLib.readFile(path);
  } catch {
    await fsLib.writeFile(path, '');
  }
  return { output: '', success: true };
}

export async function handleRmCommand(args: string[]): Promise<CommandResult> {
  const recursive = args[0] === '-r' || args[0] === '-rf';
  const targets = recursive ? args.slice(1) : args;

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
