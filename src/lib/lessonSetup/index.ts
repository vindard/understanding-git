/**
 * Lesson setup service.
 *
 * Provides skipToLesson() which resets the environment and executes
 * command sequences to reach a specific lesson's starting state.
 */

import { resetFs } from '../fs';
import { clearGitStateHash } from '../gitStateHash';
import { executeCommand } from '../commands';
import { getSetupScript, isValidLessonId } from './setup-scripts';

export interface SetupResult {
  success: boolean;
  error?: string;
  commandsExecuted?: number;
}

/**
 * Skip to a specific lesson by resetting the environment and
 * executing the command sequence to reach that lesson's starting state.
 */
export async function skipToLesson(lessonId: string): Promise<SetupResult> {
  // Validate lesson ID
  if (!isValidLessonId(lessonId)) {
    return {
      success: false,
      error: `Invalid lesson ID: ${lessonId}`,
    };
  }

  // Reset environment to clean state
  await resetFs();
  clearGitStateHash();

  // Get and execute the setup commands
  const commands = getSetupScript(lessonId);

  for (const command of commands) {
    const result = await executeCommand(command);
    if (!result.success) {
      return {
        success: false,
        error: `Command failed: ${command} - ${result.output}`,
        commandsExecuted: commands.indexOf(command),
      };
    }
  }

  return {
    success: true,
    commandsExecuted: commands.length,
  };
}
