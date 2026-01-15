import LightningFS from '@isomorphic-git/lightning-fs';
import { CWD } from './config';

const DB_NAME = 'git-learning-fs';

export let fs = new LightningFS(DB_NAME);

// Recursively delete directory contents
async function clearDirectory(path: string): Promise<void> {
  const entries = await fs.promises.readdir(path);
  for (const entry of entries) {
    const fullPath = `${path}/${entry}`;
    const stats = await fs.promises.stat(fullPath);
    if (stats.isDirectory()) {
      await clearDirectory(fullPath);
      await fs.promises.rmdir(fullPath);
    } else {
      await fs.promises.unlink(fullPath);
    }
  }
}

export async function resetFs(): Promise<void> {
  // Delete the IndexedDB database and create a fresh one
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  // Create a fresh filesystem
  fs = new LightningFS(DB_NAME);
  // Create the repo directory, or clear it if it already exists (due to IndexedDB timing)
  try {
    await fs.promises.mkdir(CWD);
  } catch (err) {
    if ((err as { code?: string }).code === 'EEXIST') {
      // Directory exists from previous state - clear its contents
      await clearDirectory(CWD);
    } else {
      throw err;
    }
  }
}

export async function initializeFs(): Promise<void> {
  // Always start fresh for consistent learning experience
  await resetFs();
}

export async function readFile(path: string): Promise<string> {
  const content = await fs.promises.readFile(path, 'utf8');
  return content as string;
}

export async function writeFile(path: string, content: string): Promise<void> {
  await fs.promises.writeFile(path, content, 'utf8');
}

export async function readdir(path: string): Promise<string[]> {
  return await fs.promises.readdir(path);
}

export async function stat(path: string): Promise<{ type: 'file' | 'dir' }> {
  const stats = await fs.promises.stat(path);
  return { type: stats.isDirectory() ? 'dir' : 'file' };
}

export async function mkdir(path: string): Promise<void> {
  await fs.promises.mkdir(path);
}

export async function unlink(path: string): Promise<void> {
  await fs.promises.unlink(path);
}

export async function rmdir(path: string): Promise<void> {
  await fs.promises.rmdir(path);
}
