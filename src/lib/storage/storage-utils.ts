import type { StoredProgress } from './types';

export function getStorageKey(userId: string): string {
  return `progress:${userId}`;
}

export function createStoredProgress(
  lessonId: string,
  lessonIndex: number,
  completedExercises: string[],
  currentExerciseIndex: number,
): StoredProgress {
  return {
    lessonId,
    lessonIndex,
    completedExercises,
    currentExerciseIndex,
    lastUpdated: Date.now(),
  };
}

export function serializeProgress(progress: StoredProgress): string {
  return JSON.stringify(progress);
}

export function isValidStoredProgress(data: unknown): data is StoredProgress {
  if (data === null || data === undefined) {
    return false;
  }

  if (typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.lessonId !== 'string') {
    return false;
  }

  if (typeof obj.lessonIndex !== 'number') {
    return false;
  }

  if (!Array.isArray(obj.completedExercises)) {
    return false;
  }

  if (!obj.completedExercises.every((item: unknown) => typeof item === 'string')) {
    return false;
  }

  if (typeof obj.currentExerciseIndex !== 'number') {
    return false;
  }

  if (typeof obj.lastUpdated !== 'number') {
    return false;
  }

  return true;
}

export function deserializeProgress(json: string): StoredProgress | null {
  if (!json) {
    return null;
  }

  try {
    const parsed = JSON.parse(json);

    if (!isValidStoredProgress(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
