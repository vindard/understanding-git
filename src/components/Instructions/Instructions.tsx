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
      <div style={{ padding: '16px', color: '#d4d4d4' }}>
        <p>Select a lesson to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', color: '#d4d4d4', height: '100%', overflow: 'auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '16px' }}>{lesson.title}</h2>
      <div
        style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
        dangerouslySetInnerHTML={{ __html: lesson.content }}
      />
      {lesson.hints && lesson.hints.length > 0 && (
        <details style={{ marginTop: '16px' }}>
          <summary style={{ cursor: 'pointer', color: '#569cd6' }}>Hints</summary>
          <ul style={{ marginTop: '8px' }}>
            {lesson.hints.map((hint, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {hint}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
        {hasPrevious && (
          <button
            onClick={onPrevious}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3c3c3c',
              color: '#d4d4d4',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ← Previous
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNext}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0e639c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
