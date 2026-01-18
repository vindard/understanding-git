import { useState, useCallback } from 'react';
import type { Lesson, LessonProgress } from '../types/lesson';
import { repoIntact } from '../lib/gitStateHash';
import { skipToLesson as lessonSetupSkipToLesson } from '../lib/lessonSetup';

interface UseLessonProgressReturn {
  currentLesson: Lesson;
  currentExerciseIndex: number;
  completedExercises: string[];
  isLessonComplete: boolean;
  isAllLessonsComplete: boolean;
  isStateBroken: boolean;
  checkCurrentExercise: (lastCommand: string) => Promise<boolean>;
  checkStateIntegrity: () => Promise<void>;
  goToNextLesson: () => void;
  goToPreviousLesson: () => void;
  resetProgress: () => void;
  skipToLesson: (lessonId: string) => Promise<boolean>;
  lessonIndex: number;
  totalLessons: number;
}

export function useLessonProgress(lessons: Lesson[]): UseLessonProgressReturn {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [progress, setProgress] = useState<LessonProgress>({
    lessonId: lessons[0]?.id || '',
    completedExercises: [],
    currentExerciseIndex: 0,
  });
  const [isStateBroken, setIsStateBroken] = useState(false);

  const currentLesson = lessons[lessonIndex];
  const currentExerciseIndex = progress.currentExerciseIndex;
  const completedExercises = progress.completedExercises;

  const isLessonComplete = currentLesson
    ? completedExercises.filter(id => 
        currentLesson.exercises.some(ex => ex.id === id)
      ).length === currentLesson.exercises.length
    : false;

  const isAllLessonsComplete = lessonIndex === lessons.length - 1 && isLessonComplete;

  const checkCurrentExercise = useCallback(async (lastCommand: string): Promise<boolean> => {
    if (!currentLesson) return false;

    const exercise = currentLesson.exercises[currentExerciseIndex];
    if (!exercise) return false;

    // Already completed
    if (completedExercises.includes(exercise.id)) {
      return true;
    }

    // Check command pattern if specified
    if (exercise.commandPattern && !exercise.commandPattern.test(lastCommand)) {
      return false;
    }

    const isValid = await exercise.validate();

    if (isValid) {
      setProgress(prev => {
        const newCompleted = [...prev.completedExercises, exercise.id];
        const nextIndex = Math.min(
          prev.currentExerciseIndex + 1,
          currentLesson.exercises.length - 1
        );

        return {
          ...prev,
          completedExercises: newCompleted,
          currentExerciseIndex: nextIndex,
        };
      });
    }

    return isValid;
  }, [currentLesson, currentExerciseIndex, completedExercises]);

  const checkStateIntegrity = useCallback(async () => {
    if (!currentLesson || completedExercises.length === 0) {
      setIsStateBroken(false);
      return;
    }

    // Check if .git directory has been tampered with
    if (!await repoIntact()) {
      setIsStateBroken(true);
      return;
    }

    // Check if any completed exercise in current lesson has invalid state
    for (const exerciseId of completedExercises) {
      const exercise = currentLesson.exercises.find(ex => ex.id === exerciseId);
      if (exercise) {
        const isValid = await exercise.validate();
        if (!isValid) {
          setIsStateBroken(true);
          return;
        }
      }
    }
    setIsStateBroken(false);
  }, [currentLesson, completedExercises]);

  const goToNextLesson = useCallback(() => {
    if (lessonIndex < lessons.length - 1) {
      const nextIndex = lessonIndex + 1;
      setLessonIndex(nextIndex);
      setProgress({
        lessonId: lessons[nextIndex].id,
        completedExercises: [],
        currentExerciseIndex: 0,
      });
    }
  }, [lessonIndex, lessons]);

  const goToPreviousLesson = useCallback(() => {
    if (lessonIndex > 0) {
      const prevIndex = lessonIndex - 1;
      setLessonIndex(prevIndex);
      setProgress({
        lessonId: lessons[prevIndex].id,
        completedExercises: [],
        currentExerciseIndex: 0,
      });
    }
  }, [lessonIndex, lessons]);

  const resetProgress = useCallback(() => {
    setLessonIndex(0);
    setProgress({
      lessonId: lessons[0]?.id || '',
      completedExercises: [],
      currentExerciseIndex: 0,
    });
    setIsStateBroken(false);
  }, [lessons]);

  const skipToLesson = useCallback(async (lessonId: string): Promise<boolean> => {
    // Setup filesystem for target lesson
    const result = await lessonSetupSkipToLesson(lessonId);
    if (!result.success) {
      return false;
    }

    // Update React state
    const idx = lessons.findIndex(l => l.id === lessonId);
    if (idx >= 0) {
      setLessonIndex(idx);
      setProgress({
        lessonId,
        completedExercises: [],
        currentExerciseIndex: 0,
      });
      setIsStateBroken(false);
    }

    return true;
  }, [lessons]);

  return {
    currentLesson,
    currentExerciseIndex,
    completedExercises,
    isLessonComplete,
    isAllLessonsComplete,
    isStateBroken,
    checkCurrentExercise,
    checkStateIntegrity,
    goToNextLesson,
    goToPreviousLesson,
    resetProgress,
    skipToLesson,
    lessonIndex,
    totalLessons: lessons.length,
  };
}
