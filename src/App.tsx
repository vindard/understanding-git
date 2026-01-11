import { useState, useEffect, useCallback } from 'react';
import { Terminal } from './components/Terminal/Terminal';
import { FileTree, type FileNode } from './components/FileTree/FileTree';
import { FileViewer } from './components/FileViewer/FileViewer';
import { Instructions } from './components/Instructions/Instructions';
import { executeCommand } from './lib/shell';
import { initializeFs, readFile, readdir, stat } from './lib/fs';
import './App.css';

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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '250px 1fr 350px',
        gridTemplateRows: '1fr 300px',
        height: '100vh',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
      }}
    >
      {/* File Tree */}
      <div
        style={{
          gridRow: '1 / 3',
          borderRight: '1px solid #3c3c3c',
          overflow: 'auto',
          padding: '8px 0',
        }}
      >
        <div style={{ padding: '8px 16px', fontWeight: 'bold', borderBottom: '1px solid #3c3c3c' }}>
          FILES
        </div>
        <FileTree files={files} onFileSelect={handleFileSelect} selectedPath={selectedFile || undefined} />
      </div>

      {/* File Viewer */}
      <div style={{ borderBottom: '1px solid #3c3c3c', overflow: 'hidden' }}>
        {selectedFile ? (
          <FileViewer content={fileContent} path={selectedFile} />
        ) : (
          <div style={{ padding: '16px', color: '#6e6e6e' }}>Select a file to view its contents</div>
        )}
      </div>

      {/* Instructions */}
      <div
        style={{
          gridRow: '1 / 3',
          borderLeft: '1px solid #3c3c3c',
          overflow: 'auto',
          backgroundColor: '#252526',
        }}
      >
        <div style={{ padding: '8px 16px', fontWeight: 'bold', borderBottom: '1px solid #3c3c3c' }}>
          INSTRUCTIONS
        </div>
        <Instructions lesson={sampleLesson} hasNext={true} />
      </div>

      {/* Terminal */}
      <div style={{ overflow: 'hidden' }}>
        <Terminal onCommand={handleCommand} />
      </div>
    </div>
  );
}

export default App;
