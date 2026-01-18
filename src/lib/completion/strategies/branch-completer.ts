import * as gitLib from '../../git';
import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';
import {
  filterByPrefix,
  calculateReplaceFrom,
  shouldCompleteBranch,
} from '../filters';

export class BranchCompleter implements CompletionStrategy {
  canHandle(context: CompletionContext): boolean {
    return shouldCompleteBranch(context.cmd, context.parts);
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const partial = context.parts[context.parts.length - 1] || '';
    const branchToComplete = context.endsWithSpace ? '' : partial;

    // Fetch from git
    const branches = await this.fetchBranches();

    // Apply pure filtering
    const suggestions = filterByPrefix(branches, branchToComplete);

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
   * Fetch branches from git.
   * This is the only method that crosses the git boundary.
   */
  private async fetchBranches(): Promise<string[]> {
    try {
      return await gitLib.gitListBranches();
    } catch {
      return [];
    }
  }
}
