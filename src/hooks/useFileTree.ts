import { useState, useCallback, useEffect } from 'react';
import { initializeFs, readFile, readdir, stat } from '../lib/fs';
import { CWD } from '../lib/config';
import type { FileNode } from '../components/FileTree/FileTree';

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

export interface UseFileTreeReturn {
  files: FileNode[];
  selectedFile: string | null;
  fileContent: string;
  refreshFileTree: () => Promise<void>;
  handleFileSelect: (path: string) => Promise<void>;
  clearSelection: () => void;
}

export function useFileTree(): UseFileTreeReturn {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  const refreshFileTree = useCallback(async () => {
    const tree = await buildFileTree(CWD);
    setFiles(tree);
  }, []);

  useEffect(() => {
    initializeFs().then(refreshFileTree);
  }, [refreshFileTree]);

  const handleFileSelect = useCallback(async (path: string) => {
    setSelectedFile(path);
    try {
      const content = await readFile(path);
      setFileContent(content);
    } catch {
      setFileContent('');
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setFileContent('');
  }, []);

  return {
    files,
    selectedFile,
    fileContent,
    refreshFileTree,
    handleFileSelect,
    clearSelection,
  };
}
