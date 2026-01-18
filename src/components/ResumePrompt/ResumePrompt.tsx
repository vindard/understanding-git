import type { StoredProgress } from '../../hooks/useLessonProgress';
import styles from './ResumePrompt.module.css';

interface ResumePromptProps {
  savedProgress: StoredProgress;
  lessonTitle: string;
  onResume: () => void;
  onStartFresh: () => void;
}

export function ResumePrompt({
  savedProgress,
  lessonTitle,
  onResume,
  onStartFresh,
}: ResumePromptProps) {
  const exerciseCount = savedProgress.completedExercises.length;
  const exerciseText = exerciseCount === 1 ? 'exercise' : 'exercises';

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.heading}>Welcome Back!</h2>
        <p className={styles.description}>
          You have saved progress from a previous session.
        </p>
        <div className={styles.progressInfo}>
          <div className={styles.lessonName}>
            <span className={styles.label}>Lesson:</span>
            <span className={styles.value}>{lessonTitle}</span>
          </div>
          {exerciseCount > 0 && (
            <div className={styles.exerciseProgress}>
              <span className={styles.label}>Completed:</span>
              <span className={styles.value}>
                {exerciseCount} {exerciseText}
              </span>
            </div>
          )}
        </div>
        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={onResume}
          >
            Resume Progress
          </button>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={onStartFresh}
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
