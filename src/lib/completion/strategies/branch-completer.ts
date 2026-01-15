import * as gitLib from '../../git';
import type { CompletionContext, CompletionResult, CompletionStrategy } from '../types';

const GIT_BRANCH_SUBCOMMANDS = ['checkout'];

export class BranchCompleter implements CompletionStrategy {
  canHandle(context: CompletionContext): boolean {
    // Handle "git checkout <branch>"
    if (context.cmd === 'git' && context.parts.length >= 2) {
      const gitSubcmd = context.parts[1];
      return GIT_BRANCH_SUBCOMMANDS.includes(gitSubcmd);
    }
    return false;
  }

  async complete(context: CompletionContext): Promise<CompletionResult> {
    const partial = context.parts[context.parts.length - 1] || '';
    const branchToComplete = context.endsWithSpace ? '' : partial;

    const suggestions = await this.completeBranch(branchToComplete);
    const replaceFrom = context.endsWithSpace
      ? context.cursorPos
      : context.lineUpToCursor.lastIndexOf(partial);

    return {
      suggestions,
      replaceFrom,
      replaceTo: context.cursorPos,
    };
  }

  private async completeBranch(partial: string): Promise<string[]> {
    try {
      const branches = await gitLib.gitListBranches();
      return branches.filter(branch => branch.startsWith(partial));
    } catch {
      return [];
    }
  }
}
