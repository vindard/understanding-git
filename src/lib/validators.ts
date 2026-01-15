import { gitStatus, gitLog } from './git';
import { stat, readFile } from './fs';

/**
 * Validator functions for lesson exercises.
 * Each validator returns a function that checks if an exercise condition is met.
 */

export async function repoInitialized(): Promise<boolean> {
  try {
    const gitDir = await stat('/repo/.git');
    return gitDir.type === 'dir';
  } catch {
    return false;
  }
}

export function fileExists(path: string): () => Promise<boolean> {
  return async (): Promise<boolean> => {
    try {
      await stat(`/repo/${path}`);
      return true;
    } catch {
      return false;
    }
  };
}

export async function hasUntrackedFiles(): Promise<boolean> {
  try {
    const status = await gitStatus();
    // Untracked: head=0, workdir=2, stage=0
    return status.some(([, head, workdir, stage]) =>
      head === 0 && workdir === 2 && stage === 0
    );
  } catch {
    return false;
  }
}

export function fileStaged(filename: string): () => Promise<boolean> {
  return async (): Promise<boolean> => {
    try {
      const status = await gitStatus();
      return status.some(([file, , , stage]) =>
        file === filename && stage === 2
      );
    } catch {
      return false;
    }
  };
}

export async function hasStagedFiles(): Promise<boolean> {
  try {
    const status = await gitStatus();
    return status.some(([, , , stage]) => stage === 2 || stage === 3);
  } catch {
    return false;
  }
}

export async function hasCommits(): Promise<boolean> {
  try {
    const log = await gitLog();
    return log.length > 0;
  } catch {
    return false;
  }
}

export async function hasMultipleCommits(): Promise<boolean> {
  try {
    const log = await gitLog();
    return log.length >= 2;
  } catch {
    return false;
  }
}

export function fileHasContent(path: string): () => Promise<boolean> {
  return async (): Promise<boolean> => {
    try {
      const content = await readFile(`/repo/${path}`);
      return content.trim().length > 0;
    } catch {
      return false;
    }
  };
}

export function multipleFilesExist(count: number): () => Promise<boolean> {
  return async (): Promise<boolean> => {
    try {
      const status = await gitStatus();
      return status.length >= count;
    } catch {
      return false;
    }
  };
}

export async function workingTreeClean(): Promise<boolean> {
  try {
    const status = await gitStatus();
    // Clean: all files have head=1, workdir=1, stage=1
    return status.every(([, head, workdir, stage]) =>
      head === 1 && workdir === 1 && stage === 1
    );
  } catch {
    return false;
  }
}
