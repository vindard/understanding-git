import * as fsLib from '../../fs';
import { CWD } from '../../config';
import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';
import {
  filterByPrefix,
  filterHidden,
  excludeGitDir,
  excludeAlreadyAdded,
  formatAsFileOrDir,
  addPathPrefix,
  parsePartialPath,
  getPathPrefix,
  calculateReplaceFrom,
  shouldCompleteFilePath,
  shouldHideHidden,
  isGitAdd,
  getExistingArgs,
} from '../filters';

export class FilePathCompleter implements CompletionStrategy {
  canHandle(context: CompletionContext): boolean {
    return shouldCompleteFilePath(context.cmd, context.parts);
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const partial = context.parts[context.parts.length - 1] || '';
    const pathToComplete = context.endsWithSpace ? '' : partial;
    const hideHidden = shouldHideHidden(context.cmd);
    const gitAdd = isGitAdd(context.cmd, context.parts);

    // Fetch from filesystem
    const rawSuggestions = await this.fetchFileSuggestions(pathToComplete, hideHidden);

    // Apply pure filtering logic
    let suggestions = rawSuggestions;
    if (gitAdd) {
      suggestions = excludeGitDir(suggestions);
    }
    const existingArgs = getExistingArgs(context.parts, gitAdd);
    suggestions = excludeAlreadyAdded(suggestions, existingArgs);

    const replaceFrom = calculateReplaceFrom(
      context.endsWithSpace,
      context.cursorPos,
      context.lineUpToCursor,
      partial
    );

    return {
      suggestions,
      replaceFrom,
      replaceTo: context.cursorPos,
    };
  }

  /**
   * Fetch file suggestions from filesystem.
   * This is the only method that crosses the fs boundary.
   */
  private async fetchFileSuggestions(partial: string, hideHidden: boolean): Promise<string[]> {
    try {
      const { dirPart, prefix, hasPath } = parsePartialPath(partial);
      const dirPath = hasPath
        ? (dirPart.startsWith('/') ? dirPart : `${CWD}/${dirPart}`)
        : CWD;

      // Fetch directory entries
      const entries = await fsLib.readdir(dirPath);

      // Apply pure filters
      let matching = filterByPrefix(entries, prefix);
      matching = filterHidden(matching, hideHidden);

      // Fetch stats and format (this mixes fetch with formatting)
      const suggestions: string[] = [];
      for (const entry of matching) {
        const fullPath = `${dirPath}/${entry}`.replace('//', '/');
        try {
          const stats = await fsLib.stat(fullPath);
          suggestions.push(formatAsFileOrDir(entry, stats.type === 'dir'));
        } catch {
          suggestions.push(entry);
        }
      }

      // Add path prefix if needed
      const pathPrefix = getPathPrefix(partial);
      return addPathPrefix(suggestions, pathPrefix);
    } catch {
      return [];
    }
  }
}
