import type { Lesson } from '../types/lesson';
import { gitStatus, gitLog } from '../lib/git';
import { stat, readFile } from '../lib/fs';

// Validator helper functions
const validators = {
  repoInitialized: async (): Promise<boolean> => {
    try {
      // Check for .git directory existence
      const gitDir = await stat('/repo/.git');
      return gitDir.type === 'dir';
    } catch {
      return false;
    }
  },

  fileExists: (path: string) => async (): Promise<boolean> => {
    try {
      await stat(`/repo/${path}`);
      return true;
    } catch {
      return false;
    }
  },

  hasUntrackedFiles: async (): Promise<boolean> => {
    try {
      const status = await gitStatus();
      // Untracked: head=0, workdir=2, stage=0
      return status.some(([, head, workdir, stage]) => 
        head === 0 && workdir === 2 && stage === 0
      );
    } catch {
      return false;
    }
  },

  fileStaged: (filename: string) => async (): Promise<boolean> => {
    try {
      const status = await gitStatus();
      return status.some(([file, , , stage]) => 
        file === filename && stage === 2
      );
    } catch {
      return false;
    }
  },

  hasStagedFiles: async (): Promise<boolean> => {
    try {
      const status = await gitStatus();
      return status.some(([, , , stage]) => stage === 2 || stage === 3);
    } catch {
      return false;
    }
  },

  hasCommits: async (): Promise<boolean> => {
    try {
      const log = await gitLog();
      return log.length > 0;
    } catch {
      return false;
    }
  },

  hasMultipleCommits: async (): Promise<boolean> => {
    try {
      const log = await gitLog();
      return log.length >= 2;
    } catch {
      return false;
    }
  },

  fileHasContent: (path: string) => async (): Promise<boolean> => {
    try {
      const content = await readFile(`/repo/${path}`);
      return content.trim().length > 0;
    } catch {
      return false;
    }
  },

  multipleFilesExist: (count: number) => async (): Promise<boolean> => {
    try {
      const status = await gitStatus();
      return status.length >= count;
    } catch {
      return false;
    }
  },

  workingTreeClean: async (): Promise<boolean> => {
    try {
      const status = await gitStatus();
      // Clean: all files have head=1, workdir=1, stage=1
      return status.every(([, head, workdir, stage]) => 
        head === 1 && workdir === 1 && stage === 1
      );
    } catch {
      return false;
    }
  },
};

export const lessons: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Your First Repository',
    description: 'Learn how to create a new Git repository and check its status.',
    exercises: [
      {
        id: '1-1',
        instruction: 'Initialize a new Git repository using the <code>git init</code> command.',
        hint: 'Type: git init',
        validate: validators.repoInitialized,
        successMessage: 'Repository initialized! You now have a .git folder tracking your project.',
        commandPattern: /^git\s+init$/i,
      },
      {
        id: '1-2',
        instruction: 'Check the status of your repository with <code>git status</code>.',
        hint: 'Type: git status',
        validate: validators.repoInitialized,
        successMessage: 'Great! Git status shows you the current state of your working directory.',
        commandPattern: /^git\s+status$/i,
      },
    ],
  },
  {
    id: 'lesson-2',
    title: 'Tracking Files',
    description: 'Learn how to create files and stage them for commit.',
    exercises: [
      {
        id: '2-1',
        instruction: 'Create a new file called <code>README.md</code> using the <code>touch</code> command.',
        hint: 'Type: touch README.md',
        validate: validators.fileExists('README.md'),
        successMessage: 'File created! But Git doesn\'t track it yet - it\'s "untracked".',
        commandPattern: /^touch\s+README\.md$/i,
      },
      {
        id: '2-2',
        instruction: 'Run <code>git status</code> to see the untracked file.',
        hint: 'Type: git status',
        validate: validators.hasUntrackedFiles,
        successMessage: 'See the red "??" next to README.md? That means it\'s untracked.',
        commandPattern: /^git\s+status$/i,
      },
      {
        id: '2-3',
        instruction: 'Stage the file with <code>git add README.md</code> to prepare it for commit.',
        hint: 'Type: git add README.md',
        validate: validators.fileStaged('README.md'),
        successMessage: 'File staged! It\'s now in the "staging area" ready to be committed.',
        commandPattern: /^git\s+add\s+README\.md$/i,
      },
      {
        id: '2-4',
        instruction: 'Run <code>git status</code> again to see the staged file (shown in green).',
        hint: 'Type: git status',
        validate: validators.hasStagedFiles,
        successMessage: 'The green "A" means the file is staged and ready to commit!',
        commandPattern: /^git\s+status$/i,
      },
    ],
  },
  {
    id: 'lesson-3',
    title: 'Making Commits',
    description: 'Learn how to save your changes with commits.',
    exercises: [
      {
        id: '3-1',
        instruction: 'Create your first commit with a message: <code>git commit -m "Add README"</code>',
        hint: 'Type: git commit -m "Add README"',
        validate: validators.hasCommits,
        successMessage: 'Congratulations! You\'ve made your first commit! 🎉',
        commandPattern: /^git\s+commit\s+-m\s+.+$/i,
      },
      {
        id: '3-2',
        instruction: 'View your commit history with <code>git log</code>.',
        hint: 'Type: git log',
        validate: validators.hasCommits,
        successMessage: 'You can see your commit with its unique hash, author, and message.',
        commandPattern: /^git\s+log$/i,
      },
    ],
  },
  {
    id: 'lesson-4',
    title: 'The Edit-Stage-Commit Cycle',
    description: 'Practice the fundamental Git workflow: edit, stage, commit.',
    exercises: [
      {
        id: '4-1',
        instruction: 'Add some content to README.md: <code>echo "# My Project" > README.md</code>',
        hint: 'Type: echo "# My Project" > README.md',
        validate: validators.fileHasContent('README.md'),
        successMessage: 'File modified! Git now sees it as "changed".',
        commandPattern: /^echo\s+.+>\s*README\.md$/i,
      },
      {
        id: '4-2',
        instruction: 'Stage the modified file with <code>git add README.md</code>.',
        hint: 'Type: git add README.md',
        validate: validators.hasStagedFiles,
        successMessage: 'Changes staged! Ready for the next commit.',
        commandPattern: /^git\s+add\s+(README\.md|\.)$/i,
      },
      {
        id: '4-3',
        instruction: 'Commit the changes: <code>git commit -m "Update README with title"</code>',
        hint: 'Type: git commit -m "Update README with title"',
        validate: validators.hasMultipleCommits,
        successMessage: 'Second commit done! You\'re getting the hang of it! 🚀',
        commandPattern: /^git\s+commit\s+-m\s+.+$/i,
      },
    ],
  },
  {
    id: 'lesson-5',
    title: 'Working with Multiple Files',
    description: 'Learn to manage multiple files and use shortcuts.',
    exercises: [
      {
        id: '5-1',
        instruction: 'Create two more files: <code>touch index.html style.css</code>',
        hint: 'Type: touch index.html style.css',
        validate: validators.multipleFilesExist(3),
        successMessage: 'Multiple files created! You can create several at once.',
        commandPattern: /^touch\s+.+\s+.+$/i,
      },
      {
        id: '5-2',
        instruction: 'Stage all files at once with <code>git add .</code> (the dot means "everything").',
        hint: 'Type: git add .',
        validate: validators.hasStagedFiles,
        successMessage: 'All files staged! The "." is a handy shortcut.',
        commandPattern: /^git\s+add\s+\.$/i,
      },
      {
        id: '5-3',
        instruction: 'Commit all the new files: <code>git commit -m "Add HTML and CSS files"</code>',
        hint: 'Type: git commit -m "Add HTML and CSS files"',
        validate: validators.workingTreeClean,
        successMessage: 'All committed! Your working tree is now clean. You\'ve completed the basics! 🎓',
        commandPattern: /^git\s+commit\s+-m\s+.+$/i,
      },
    ],
  },
];
