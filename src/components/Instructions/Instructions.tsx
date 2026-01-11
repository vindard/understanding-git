import styles from './Instructions.module.css';

interface Lesson {
  id: string;
  title: string;
  content: string;
  hints?: string[];
}

interface InstructionsProps {
  lesson: Lesson | null;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function Instructions({
  lesson,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
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
      <h2 className={styles.title}>{lesson.title}</h2>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: lesson.content }}
      />
      {lesson.hints && lesson.hints.length > 0 && (
        <details className={styles.hints}>
          <summary className={styles.hintsSummary}>Hints</summary>
          <ul className={styles.hintsList}>
            {lesson.hints.map((hint, index) => (
              <li key={index}>{hint}</li>
            ))}
          </ul>
        </details>
      )}
      <div className={styles.navigation}>
        {hasPrevious && (
          <button
            onClick={onPrevious}
            className={`${styles.navButton} ${styles.navButtonPrev}`}
          >
            ← Previous
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNext}
            className={`${styles.navButton} ${styles.navButtonNext}`}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
