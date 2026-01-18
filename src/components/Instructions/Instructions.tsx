import type { Lesson } from '../../types/lesson';
import styles from './Instructions.module.css';

interface InstructionsProps {
  lesson: Lesson | null;
  currentExerciseIndex: number;
  completedExercises: string[];
  isLessonComplete: boolean;
  isStateBroken?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  lessonNumber: number;
  totalLessons: number;
  allLessons?: Lesson[];
  onSelectLesson?: (lessonId: string) => void;
}

export function Instructions({
  lesson,
  currentExerciseIndex,
  completedExercises,
  isLessonComplete,
  isStateBroken = false,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  lessonNumber,
  totalLessons,
  allLessons,
  onSelectLesson,
}: InstructionsProps) {
  if (!lesson) {
    return (
      <div className={styles.placeholder}>
        <p>Select a lesson to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.lessonHeader}>
        {allLessons && onSelectLesson ? (
          <select
            className={styles.lessonSelect}
            value={lesson.id}
            onChange={(e) => onSelectLesson(e.target.value)}
          >
            {allLessons.map((l, idx) => (
              <option key={l.id} value={l.id}>
                {idx + 1}. {l.title}
              </option>
            ))}
          </select>
        ) : (
          <span className={styles.lessonNumber}>
            Lesson {lessonNumber} of {totalLessons}
          </span>
        )}
        <h2 className={styles.title}>{lesson.title}</h2>
        <p className={styles.description}>{lesson.description}</p>
      </div>

      {isStateBroken && (
        <div className={styles.warningBanner}>
          <p>The environment state has changed unexpectedly.</p>
          <p>Try to restore it yourself, or type <code>reset</code> if unrecoverable.</p>
        </div>
      )}

      <div className={styles.exercises}>
        {lesson.exercises.map((exercise, index) => {
          const isCompleted = completedExercises.includes(exercise.id);
          const isCurrent = index === currentExerciseIndex && !isLessonComplete;

          return (
            <div
              key={exercise.id}
              className={`${styles.exercise} ${isCompleted ? styles.exerciseCompleted : ''} ${isCurrent ? styles.exerciseCurrent : ''}`}
            >
              <div className={styles.exerciseStatus}>
                {isCompleted ? (
                  <span className={styles.checkmark}>✓</span>
                ) : (
                  <span className={styles.exerciseNumber}>{index + 1}</span>
                )}
              </div>
              <div className={styles.exerciseContent}>
                <p
                  className={styles.exerciseInstruction}
                  dangerouslySetInnerHTML={{ __html: exercise.instruction }}
                />
                {isCompleted && (
                  <p className={styles.successMessage}>{exercise.successMessage}</p>
                )}
                {isCurrent && exercise.hint && (
                  <details className={styles.hint}>
                    <summary className={styles.hintSummary}>Need a hint?</summary>
                    <p className={styles.hintText}>{exercise.hint}</p>
                  </details>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isLessonComplete && (
        <div className={styles.lessonComplete}>
          <p>🎉 Lesson Complete!</p>
        </div>
      )}

      <div className={styles.navigation}>
        {hasPrevious && (
          <button
            onClick={onPrevious}
            className={`${styles.navButton} ${styles.navButtonPrev}`}
          >
            ← Previous Lesson
          </button>
        )}
        {hasNext && isLessonComplete && (
          <button
            onClick={onNext}
            className={`${styles.navButton} ${styles.navButtonNext}`}
          >
            Next Lesson →
          </button>
        )}
      </div>
    </div>
  );
}
