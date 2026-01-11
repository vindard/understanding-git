import LightningFS from '@isomorphic-git/lightning-fs';

const DB_NAME = 'git-learning-fs';

export let fs = new LightningFS(DB_NAME);

export async function resetFs(): Promise<void> {
  // Delete the IndexedDB database and create a fresh one
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  // Create a fresh filesystem
  fs = new LightningFS(DB_NAME);
  // Create the repo directory
  await fs.promises.mkdir('/repo');
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
