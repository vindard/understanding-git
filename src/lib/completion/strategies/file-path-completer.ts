import * as fsLib from '../../fs';
import { CWD } from '../../config';
import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';
const PATH_COMMANDS = ['ls', 'cat', 'mkdir', 'touch', 'rm'];
const GIT_PATH_SUBCOMMANDS = ['add'];

export class FilePathCompleter implements CompletionStrategy {
  canHandle(context: CompletionContext): boolean {
    // Handle path completion for commands like ls, cat, mkdir, touch, rm
    if (PATH_COMMANDS.includes(context.cmd)) {
      return true;
    }

    // Handle "git add <path>"
    if (context.cmd === 'git' && context.parts.length >= 2) {
      const gitSubcmd = context.parts[1];
      return GIT_PATH_SUBCOMMANDS.includes(gitSubcmd);
    }

    return false;
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const partial = context.parts[context.parts.length - 1] || '';
    const pathToComplete = context.endsWithSpace ? '' : partial;
    const hideHidden = context.cmd === 'touch';  // touch shouldn't suggest hidden files
    const isGitAdd = context.cmd === 'git' && context.parts[1] === 'add';

    let suggestions = await this.completeFilePath(pathToComplete, hideHidden);

    // For git add, always exclude .git directory
    if (isGitAdd) {
      suggestions = suggestions.filter(s => s !== '.git/' && !s.startsWith('.git/'));
    }

    // Filter out files already present in the command
    const existingArgs = new Set(context.parts.slice(isGitAdd ? 2 : 1));
    suggestions = suggestions.filter(s => !existingArgs.has(s) && !existingArgs.has(s.replace(/\/$/, '')));

    const replaceFrom = context.endsWithSpace
      ? context.cursorPos
      : context.lineUpToCursor.lastIndexOf(partial);

    return {
      suggestions,
      replaceFrom,
      replaceTo: context.cursorPos,
    };
  }

  private async completeFilePath(partial: string, hideHidden = false): Promise<string[]> {
    try {
      let dirPath: string;
      let prefix: string;

      if (partial.includes('/')) {
        const lastSlash = partial.lastIndexOf('/');
        const dirPart = partial.slice(0, lastSlash) || '/';
        prefix = partial.slice(lastSlash + 1);
        dirPath = dirPart.startsWith('/') ? dirPart : `${CWD}/${dirPart}`;
      } else {
        dirPath = CWD;
        prefix = partial;
      }

      const entries = await fsLib.readdir(dirPath);
      let matching = entries.filter(entry => entry.startsWith(prefix));
      if (hideHidden) {
        matching = matching.filter(entry => !entry.startsWith('.'));
      }

      const suggestions: string[] = [];
      for (const entry of matching) {
        const fullPath = `${dirPath}/${entry}`.replace('//', '/');
        try {
          const stats = await fsLib.stat(fullPath);
          if (stats.type === 'dir') {
            suggestions.push(entry + '/');
          } else {
            suggestions.push(entry);
          }
        } catch {
          suggestions.push(entry);
        }
      }

      // If partial had a path prefix, include it in suggestions
      if (partial.includes('/')) {
        const pathPrefix = partial.slice(0, partial.lastIndexOf('/') + 1);
        return suggestions.map(s => pathPrefix + s);
      }

      return suggestions;
    } catch {
      return [];
    }
  }
}
