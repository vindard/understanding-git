export interface Exercise {
  id: string;
  instruction: string;
  hint?: string;
  validate: () => Promise<boolean>;
  successMessage: string;
  commandPattern?: RegExp;  // Optional: require command to match this pattern
  allowEditing?: boolean;   // Optional: allow file editing in the editor
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
}

export interface LessonProgress {
  lessonId: string;
  completedExercises: string[];
  currentExerciseIndex: number;
}
