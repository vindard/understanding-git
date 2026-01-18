import type { StorageAdapter, StoredProgress } from './types';
import { createLocalStorageAdapter } from './adapters/localStorage';

export type { StoredProgress, StorageAdapter } from './types';
export { createStoredProgress } from './storage-utils';

const DEFAULT_USER_ID = 'anonymous';

let adapter: StorageAdapter | null = null;

function getAdapter(): StorageAdapter {
  if (!adapter) {
    adapter = createLocalStorageAdapter();
  }
  return adapter;
}

export function setStorageAdapter(newAdapter: StorageAdapter): void {
  adapter = newAdapter;
}

export async function saveProgress(progress: StoredProgress, userId?: string): Promise<void> {
  const id = userId ?? DEFAULT_USER_ID;
  await getAdapter().save(id, progress);
}

export async function loadProgress(userId?: string): Promise<StoredProgress | null> {
  const id = userId ?? DEFAULT_USER_ID;
  return getAdapter().load(id);
}

export async function clearProgress(userId?: string): Promise<void> {
  const id = userId ?? DEFAULT_USER_ID;
  await getAdapter().clear(id);
}

// For testing purposes - resets to use default localStorage adapter
export function resetStorageAdapter(): void {
  adapter = null;
}

// Expose default user ID for external use
export { DEFAULT_USER_ID };
