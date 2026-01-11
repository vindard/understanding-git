import git from 'isomorphic-git';
import { fs } from './fs';

const dir = '/repo';

export async function gitInit(): Promise<void> {
  await git.init({ fs, dir });
}

export async function gitAdd(filepath: string): Promise<void> {
  await git.add({ fs, dir, filepath });
}

export async function gitCommit(message: string): Promise<string> {
  const sha = await git.commit({
    fs,
    dir,
    message,
    author: {
      name: 'Git Learner',
      email: 'learner@example.com',
    },
  });
  return sha;
}

export async function gitStatus(): Promise<Array<[string, number, number, number]>> {
  return await git.statusMatrix({ fs, dir });
}

export async function gitLog(depth = 10): Promise<Array<{ oid: string; message: string; author: string }>> {
  const commits = await git.log({ fs, dir, depth });
  return commits.map((commit) => ({
    oid: commit.oid.slice(0, 7),
    message: commit.commit.message,
    author: commit.commit.author.name,
  }));
}

export async function gitBranch(name: string): Promise<void> {
  await git.branch({ fs, dir, ref: name });
}

export async function gitCheckout(ref: string): Promise<void> {
  await git.checkout({ fs, dir, ref });
}

export async function gitListBranches(): Promise<string[]> {
  return await git.listBranches({ fs, dir });
}

export async function gitCurrentBranch(): Promise<string | undefined> {
  return await git.currentBranch({ fs, dir }) || undefined;
}
