import { useState, useEffect, useCallback } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Terminal } from './components/Terminal/Terminal';
import { FileTree, type FileNode } from './components/FileTree/FileTree';
import { FileViewer } from './components/FileViewer/FileViewer';
import { Instructions } from './components/Instructions/Instructions';
import { executeCommand } from './lib/shell';
import { initializeFs, readFile, readdir, stat } from './lib/fs';
import './styles/variables.css';
import styles from './App.module.css';

const sampleLesson = {
  id: '1',
  title: 'Getting Started with Git',
  content: `Welcome to the Git learning environment!

In this lesson, you'll learn how to initialize a Git repository.

<strong>Your task:</strong>
1. Initialize a new git repository using <code>git init</code>
2. Create a file using <code>touch README.md</code>
3. Check the status with <code>git status</code>

Try typing commands in the terminal below.`,
  hints: ['Type "git init" to initialize a repository', 'Use "help" to see available commands'],
};

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
              <Instructions lesson={sampleLesson} hasNext={true} />
            </div>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}

export default App;
