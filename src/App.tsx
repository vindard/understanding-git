import { useEffect } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Terminal } from './components/Terminal/Terminal';
import { FileTree } from './components/FileTree/FileTree';
import { FileViewer } from './components/FileViewer/FileViewer';
import { Instructions } from './components/Instructions/Instructions';
import { executeCommand } from './lib/commands';
import { setCurrentExercise } from './lib/completion';
import { CWD } from './lib/config';
import { lessons } from './data/lessons';
import { useLessonProgress } from './hooks/useLessonProgress';
import { useFileTree } from './hooks/useFileTree';
import { useTerminalLayout } from './hooks/useTerminalLayout';
import './styles/variables.css';
import styles from './App.module.css';

function App() {
  const {
    files,
    selectedFile,
    fileContent,
    refreshFileTree,
    handleFileSelect,
    clearSelection,
  } = useFileTree();

  const {
    isTerminalExpanded,
    isTerminalFullscreen,
    handleTerminalExpandToggle,
    handleTerminalFullscreenToggle,
    handleVerticalSizeChange,
  } = useTerminalLayout();

  const {
    currentLesson,
    currentExerciseIndex,
    completedExercises,
    isLessonComplete,
    isStateBroken,
    checkCurrentExercise,
    checkStateIntegrity,
    goToNextLesson,
    goToPreviousLesson,
    resetProgress,
    lessonIndex,
    totalLessons,
  } = useLessonProgress(lessons);

  // Update completion system with current exercise for lesson-aware suggestions
  useEffect(() => {
    const exercise = currentLesson?.exercises[currentExerciseIndex] ?? null;
    setCurrentExercise(exercise);
  }, [currentLesson, currentExerciseIndex]);

  // Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) to advance to next lesson when ready
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && isLessonComplete && lessonIndex < totalLessons - 1) {
        e.preventDefault();
        goToNextLesson();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLessonComplete, lessonIndex, totalLessons, goToNextLesson]);

  const handleCommand = async (command: string) => {
    const result = await executeCommand(command);
    await refreshFileTree();

    // Reset lesson progress when environment is reset
    if (command.trim() === 'reset') {
      resetProgress();
      clearSelection();
    } else {
      // Check if current exercise is completed after each command
      await checkCurrentExercise(command);
      // Check if any completed exercises have broken state
      await checkStateIntegrity();
    }

    return result;
  };

  return (
    <div className={styles.container}>
      <Allotment>
        {/* File Tree Sidebar */}
        {!isTerminalFullscreen && (
          <Allotment.Pane preferredSize={250} minSize={150} maxSize={400}>
            <div className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                Explorer
              </div>
              <div className={styles.sidebarContent}>
                <FileTree
                  files={files}
                  onFileSelect={handleFileSelect}
                  selectedPath={selectedFile || undefined}
                />
              </div>
            </div>
          </Allotment.Pane>
        )}

        {/* Center: Editor + Terminal stacked vertically */}
        <Allotment.Pane>
          <div className={styles.centerPane}>
            <div className={styles.centerContent}>
              <Allotment
                vertical
                onChange={handleVerticalSizeChange}
              >
                {/* Editor Panel */}
                {!isTerminalExpanded && (
                  <Allotment.Pane>
                    <div className={styles.editorPanel}>
                      {selectedFile ? (
                        <>
                          <div className={styles.editorHeader}>
                            <span className={styles.editorFilename}>
                              {selectedFile.replace(`${CWD}/`, '')}
                            </span>
                          </div>
                          <div className={styles.editorContent}>
                            <FileViewer content={fileContent} path={selectedFile} />
                          </div>
                        </>
                      ) : (
                        <div className={styles.editorPlaceholder}>
                          Select a file to view its contents
                        </div>
                      )}
                    </div>
                  </Allotment.Pane>
                )}

                {/* Terminal Panel */}
                <Allotment.Pane preferredSize={isTerminalExpanded ? undefined : 250} minSize={100} maxSize={isTerminalExpanded ? undefined : 500}>
                  <div className={styles.terminalPanel}>
                    <div className={styles.terminalHeader}>
                      <span className={styles.terminalTitle}>Terminal</span>
                      <div className={styles.terminalHeaderButtons}>
                        {!isTerminalFullscreen && (
                          <button
                            className={styles.terminalExpandBtn}
                            onClick={handleTerminalExpandToggle}
                            title={isTerminalExpanded ? 'Collapse terminal' : 'Expand terminal'}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              {isTerminalExpanded ? (
                                <polyline points="2,4 6,8 10,4" />
                              ) : (
                                <polyline points="2,8 6,4 10,8" />
                              )}
                            </svg>
                          </button>
                        )}
                        <button
                          className={styles.terminalExpandBtn}
                          onClick={handleTerminalFullscreenToggle}
                          title={isTerminalFullscreen ? 'Exit fullscreen' : 'Fullscreen terminal'}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            {isTerminalFullscreen ? (
                              <>
                                <polyline points="1,4 4,4 4,1" />
                                <polyline points="8,1 8,4 11,4" />
                                <polyline points="1,8 4,8 4,11" />
                                <polyline points="8,11 8,8 11,8" />
                              </>
                            ) : (
                              <>
                                <polyline points="1,4 1,1 4,1" />
                                <polyline points="8,1 11,1 11,4" />
                                <polyline points="1,8 1,11 4,11" />
                                <polyline points="11,8 11,11 8,11" />
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className={styles.terminalContent}>
                      <Terminal
                        onCommand={handleCommand}
                        canAdvanceLesson={isLessonComplete && lessonIndex < totalLessons - 1}
                      />
                    </div>
                  </div>
                </Allotment.Pane>
              </Allotment>
            </div>
            <div className={styles.footerBar}>
              Handmade with AI ❤️ (v
              <a
                href={`https://github.com/vindard/understanding-git/commit/${__COMMIT_SHA__}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.versionLink}
              >
                {__COMMIT_SHA__.slice(0, 7)}
              </a>
              )
            </div>
          </div>
        </Allotment.Pane>

        {/* Instructions Panel */}
        {!isTerminalFullscreen && (
          <Allotment.Pane preferredSize={350} minSize={200} maxSize={500}>
            <div className={styles.instructionsPanel}>
              <div className={styles.panelHeader}>
                Instructions
              </div>
              <div className={styles.panelContent}>
                <Instructions
                  lesson={currentLesson}
                  currentExerciseIndex={currentExerciseIndex}
                  completedExercises={completedExercises}
                  isLessonComplete={isLessonComplete}
                  isStateBroken={isStateBroken}
                  onNext={goToNextLesson}
                  onPrevious={goToPreviousLesson}
                  hasNext={lessonIndex < totalLessons - 1}
                  hasPrevious={lessonIndex > 0}
                  lessonNumber={lessonIndex + 1}
                  totalLessons={totalLessons}
                />
              </div>
            </div>
          </Allotment.Pane>
        )}
      </Allotment>
    </div>
  );
}

export default App;
