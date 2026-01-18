import { useState, useCallback, useEffect } from 'react';
import { initializeFs, readFile, writeFile, readdir, stat } from '../lib/fs';
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
  editedContent: string;
  isDirty: boolean;
  refreshFileTree: () => Promise<void>;
  handleFileSelect: (path: string) => Promise<void>;
  handleContentChange: (value: string | undefined) => void;
  saveFile: () => Promise<void>;
  clearSelection: () => void;
}

export function useFileTree(): UseFileTreeReturn {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [editedContent, setEditedContent] = useState<string>('');

  const isDirty = editedContent !== fileContent;

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
      setEditedContent(content);
    } catch {
      setFileContent('');
      setEditedContent('');
    }
  }, []);

  const handleContentChange = useCallback((value: string | undefined) => {
    setEditedContent(value ?? '');
  }, []);

  const saveFile = useCallback(async () => {
    if (selectedFile && editedContent !== fileContent) {
      await writeFile(selectedFile, editedContent);
      setFileContent(editedContent);
    }
  }, [selectedFile, editedContent, fileContent]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setFileContent('');
    setEditedContent('');
  }, []);

  return {
    files,
    selectedFile,
    fileContent,
    editedContent,
    isDirty,
    refreshFileTree,
    handleFileSelect,
    handleContentChange,
    saveFile,
    clearSelection,
  };
}
