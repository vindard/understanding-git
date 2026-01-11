import { useState, useEffect, useCallback } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Terminal } from './components/Terminal/Terminal';
import { FileTree, type FileNode } from './components/FileTree/FileTree';
import { FileViewer } from './components/FileViewer/FileViewer';
import { Instructions } from './components/Instructions/Instructions';
import { executeCommand } from './lib/shell';
import { initializeFs, readFile, readdir, stat } from './lib/fs';
import { lessons } from './data/lessons';
import { useLessonProgress } from './hooks/useLessonProgress';
import './styles/variables.css';
import styles from './App.module.css';

async function buildFileTree(path: string): Promise<FileNode[]> {
  try {
    const entries = await readdir(path);
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = `${path}/${entry}`.replace('//', '/');
      const stats = await stat(fullPath);

      if (stats.type === 'dir') {
        const children = await buildFileTree(fullPath);
        nodes.push({ name: entry, type: 'directory', path: fullPath, children });
      } else {
        nodes.push({ name: entry, type: 'file', path: fullPath });
      }
    }

    return nodes;
  } catch {
    return [];
  }
}

function App() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  const {
    currentLesson,
    currentExerciseIndex,
    completedExercises,
    isLessonComplete,
    checkCurrentExercise,
    goToNextLesson,
    goToPreviousLesson,
    lessonIndex,
    totalLessons,
  } = useLessonProgress(lessons);

  const refreshFileTree = useCallback(async () => {
    const tree = await buildFileTree('/repo');
    setFiles(tree);
  }, []);

  useEffect(() => {
    initializeFs().then(refreshFileTree);
  }, [refreshFileTree]);

  const handleFileSelect = async (path: string) => {
    setSelectedFile(path);
    try {
      const content = await readFile(path);
      setFileContent(content);
    } catch {
      setFileContent('');
    }
  };

  const handleCommand = async (command: string) => {
    const result = await executeCommand(command);
    await refreshFileTree();

    // Check if current exercise is completed after each command
    await checkCurrentExercise(command);

    return result;
  };

  return (
    <div className={styles.container}>
      <Allotment>
        {/* File Tree Sidebar */}
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

        {/* Center: Editor + Terminal stacked vertically */}
        <Allotment.Pane>
          <Allotment vertical>
            {/* Editor Panel */}
            <Allotment.Pane>
              <div className={styles.editorPanel}>
                {selectedFile ? (
                  <FileViewer content={fileContent} path={selectedFile} />
                ) : (
                  <div className={styles.editorPlaceholder}>
                    Select a file to view its contents
                  </div>
                )}
              </div>
            </Allotment.Pane>

            {/* Terminal Panel */}
            <Allotment.Pane preferredSize={250} minSize={100} maxSize={500}>
              <div className={styles.terminalPanel}>
                <Terminal onCommand={handleCommand} />
              </div>
            </Allotment.Pane>
          </Allotment>
        </Allotment.Pane>

        {/* Instructions Panel */}
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
      </Allotment>
    </div>
  );
}

export default App;
