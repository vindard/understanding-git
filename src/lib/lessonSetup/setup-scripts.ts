/**
 * Pure functions defining lesson setup command sequences.
 *
 * Each lesson's setup script contains the commands needed to reach
 * the starting state for that lesson (what previous lessons would have done).
 */

// Base command sequences for building up lesson states
const LESSON_1_COMMANDS: readonly string[] = [];

const LESSON_2_COMMANDS: readonly string[] = ['git init'];

const LESSON_3_COMMANDS: readonly string[] = [
  ...LESSON_2_COMMANDS,
  'touch README.md',
  'git add README.md',
];

const LESSON_4_COMMANDS: readonly string[] = [
  ...LESSON_3_COMMANDS,
  'git commit -m "Initial commit"',
];

const LESSON_5_COMMANDS: readonly string[] = [
  ...LESSON_4_COMMANDS,
  'echo "# My Project" > README.md',
  'git add README.md',
  'git commit -m "Update README with title"',
];

const LESSON_6_COMMANDS: readonly string[] = [
  ...LESSON_5_COMMANDS,
  'touch index.html style.css',
  'git add .',
  'git commit -m "Add HTML and CSS files"',
];

/**
 * Command sequences to set up the starting state for each lesson.
 * lesson-1: Empty (start fresh)
 * lesson-2: Git repo initialized
 * lesson-3: Repo with staged README.md
 * lesson-4: Repo with one commit
 * lesson-5: Repo with two commits
 * lesson-6: Repo with three commits and multiple files
 */
export const LESSON_SETUP_SCRIPTS: Record<string, readonly string[]> = {
  'lesson-1': LESSON_1_COMMANDS,
  'lesson-2': LESSON_2_COMMANDS,
  'lesson-3': LESSON_3_COMMANDS,
  'lesson-4': LESSON_4_COMMANDS,
  'lesson-5': LESSON_5_COMMANDS,
  'lesson-6': LESSON_6_COMMANDS,
};

// Ordered list of lesson IDs
const LESSON_IDS = [
  'lesson-1',
  'lesson-2',
  'lesson-3',
  'lesson-4',
  'lesson-5',
  'lesson-6',
] as const;

/**
 * Get the setup script for a given lesson ID.
 * Returns a copy of the command array, or empty array if lesson not found.
 */
export function getSetupScript(lessonId: string): string[] {
  const script = LESSON_SETUP_SCRIPTS[lessonId];
  return script ? [...script] : [];
}

/**
 * Check if a lesson ID is valid.
 */
export function isValidLessonId(lessonId: string): boolean {
  return lessonId in LESSON_SETUP_SCRIPTS;
}

/**
 * Get all valid lesson IDs in order.
 * Returns a copy of the array.
 */
export function getAllLessonIds(): string[] {
  return [...LESSON_IDS];
}
