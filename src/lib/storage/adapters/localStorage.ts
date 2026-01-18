import type { StorageAdapter, StoredProgress } from '../types';
import { getStorageKey, serializeProgress, deserializeProgress } from '../storage-utils';

export function createLocalStorageAdapter(): StorageAdapter {
  return {
    async save(userId: string, progress: StoredProgress): Promise<void> {
      const key = getStorageKey(userId);
      const json = serializeProgress(progress);
      localStorage.setItem(key, json);
    },

    async load(userId: string): Promise<StoredProgress | null> {
      const key = getStorageKey(userId);
      const json = localStorage.getItem(key);
      if (json === null) {
        return null;
      }
      return deserializeProgress(json);
    },

    async clear(userId: string): Promise<void> {
      const key = getStorageKey(userId);
      localStorage.removeItem(key);
    },
  };
}
