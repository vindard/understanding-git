export interface StoredProgress {
  lessonId: string;
  lessonIndex: number;
  completedExercises: string[];
  currentExerciseIndex: number;
  lastUpdated: number; // Unix timestamp
}

export interface StorageAdapter {
  save(userId: string, progress: StoredProgress): Promise<void>;
  load(userId: string): Promise<StoredProgress | null>;
  clear(userId: string): Promise<void>;
}
