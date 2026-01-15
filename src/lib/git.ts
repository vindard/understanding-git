import git from 'isomorphic-git';
import * as fsModule from './fs';
import { CWD } from './config';

const dir = CWD;

// Get fs dynamically since it can be reassigned on reset
function getFs() {
  return fsModule.fs;
}

export async function gitInit(): Promise<void> {
  await git.init({ fs: getFs(), dir });
}

export async function gitAdd(filepath: string): Promise<void> {
  await git.add({ fs: getFs(), dir, filepath });
}

export async function gitCommit(message: string): Promise<string> {
  const sha = await git.commit({
    fs: getFs(),
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
  return await git.statusMatrix({ fs: getFs(), dir });
}

export async function gitLog(depth = 10): Promise<Array<{ oid: string; message: string; author: string }>> {
  const commits = await git.log({ fs: getFs(), dir, depth });
  return commits.map((commit) => ({
    oid: commit.oid.slice(0, 7),
    message: commit.commit.message,
    author: commit.commit.author.name,
  }));
}

export async function gitBranch(name: string): Promise<void> {
  await git.branch({ fs: getFs(), dir, ref: name });
}

export async function gitCheckout(ref: string): Promise<void> {
  await git.checkout({ fs: getFs(), dir, ref });
}

export async function gitListBranches(): Promise<string[]> {
  return await git.listBranches({ fs: getFs(), dir });
}

export async function gitCurrentBranch(): Promise<string | undefined> {
  return await git.currentBranch({ fs: getFs(), dir }) || undefined;
}
