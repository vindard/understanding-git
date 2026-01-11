import LightningFS from '@isomorphic-git/lightning-fs';

export const fs = new LightningFS('git-learning-fs');

export async function initializeFs(): Promise<void> {
  // Create a sample directory structure
  try {
    await fs.promises.mkdir('/repo');
  } catch {
    // Directory may already exist
  }
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
